import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

async function hmac(key: Uint8Array, message: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message)))
}
async function sha256(value: string) { return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))) }
function hex(bytes: Uint8Array) { return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('') }
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
function hexToUuid(h: string) { const x = h.slice(0, 32); return `${x.slice(0,8)}-${x.slice(8,12)}-5${x.slice(13,16)}-8${x.slice(17,20)}-${x.slice(20,32)}` }
async function stableUuid(id: number) { return hexToUuid(hex(await sha256(`pochemuchka:telegram:${id}`))) }

async function telegramUser(initData: string, token: string) {
  const params = new URLSearchParams(initData), hash = params.get('hash')
  const authDate = Number(params.get('auth_date') || 0), now = Math.floor(Date.now() / 1000)
  if (!hash || !authDate || now - authDate > 86400 || now < authDate - 60) throw new Error('invalid or expired initData')
  params.delete('hash')
  const data = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n')
  const secret = await hmac(new TextEncoder().encode('WebAppData'), token)
  if (!constantTimeEqual(hex(await hmac(secret, data)), hash)) throw new Error('invalid Telegram signature')
  const user = JSON.parse(params.get('user') || 'null')
  if (!user?.id) throw new Error('Telegram user missing')
  return user
}

function secretKey() {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (keys) { try { const parsed = JSON.parse(keys); if (parsed.default) return parsed.default } catch {} }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
}
function reviewDate(mastery: number) {
  const days = mastery < .4 ? 1 : mastery < .7 ? 3 : 7
  const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString()
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN'), url = Deno.env.get('SUPABASE_URL'), key = secretKey()
    if (!token || !url || !key) return json({ error: 'server not configured' }, 500)
    const body = await req.json(), user = await telegramUser(String(body.initData || ''), token)
    const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
    const userId = await stableUuid(Number(user.id))

    if (body.action === 'bootstrap') {
      const { data: profile, error: pe } = await admin.from('profiles').select('*').eq('user_id', userId).maybeSingle()
      if (pe) throw pe
      if (!profile) return json({ ok: true, telegramUser: user, profile: null, progress: [], activityAttempts: [] })
      const [{ data: progress, error: progressError }, { data: attempts, error: attemptsError }] = await Promise.all([
        admin.from('lesson_progress').select('*').eq('profile_id', profile.id),
        admin.from('activity_attempts').select('*').eq('profile_id', profile.id).order('created_at', { ascending: true }).limit(1000)
      ])
      if (progressError) throw progressError
      if (attemptsError) throw attemptsError
      return json({ ok: true, telegramUser: user, profile, progress: progress || [], activityAttempts: attempts || [] })
    }

    if (body.action === 'save_profile') {
      const age = Number(body.payload?.age), name = String(body.payload?.name || '').trim().slice(0, 40), avatar = String(body.payload?.avatar || '🐱').slice(0, 8)
      if (!name || age < 6 || age > 10) return json({ error: 'invalid profile' }, 400)
      const { error: ue } = await admin.from('telegram_users').upsert({ id: userId, telegram_id: Number(user.id), first_name: user.first_name || null, last_name: user.last_name || null, username: user.username || null, updated_at: new Date().toISOString() }, { onConflict: 'telegram_id' })
      if (ue) throw ue
      const { data, error } = await admin.from('profiles').upsert({ user_id: userId, name, age, avatar, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single()
      if (error) throw error
      return json({ ok: true, profile: data })
    }

    const { data: profile, error: profileError } = await admin.from('profiles').select('id').eq('user_id', userId).single()
    if (profileError || !profile) return json({ error: 'profile not found' }, 404)

    if (body.action === 'activity_attempt') {
      const activityId = String(body.payload?.activityId || '')
      if (!activityId) return json({ error: 'activityId required' }, 400)
      const { data: activity, error: ae } = await admin.from('activities').select('id').eq('id', activityId).maybeSingle()
      if (ae) throw ae
      if (!activity) return json({ error: 'activity not found' }, 404)
      const { data, error } = await admin.from('activity_attempts').insert({
        profile_id: profile.id, activity_id: activityId, is_correct: Boolean(body.payload?.isCorrect),
        answer: body.payload?.answer ?? null, time_spent: Math.max(0, Math.floor(Number(body.payload?.timeSpent || 0)))
      }).select().single()
      if (error) throw error
      return json({ ok: true, attempt: data })
    }

    if (body.action === 'due_reviews') {
      const { data, error } = await admin.from('lesson_progress').select('*').eq('profile_id', profile.id).not('next_review_at', 'is', null).lte('next_review_at', new Date().toISOString()).order('next_review_at', { ascending: true })
      if (error) throw error
      return json({ ok: true, progress: data || [] })
    }

    if (body.action === 'save_progress') {
      const lessonId = String(body.payload?.lessonId || ''), status = String(body.payload?.status || '')
      if (!lessonId || !['in_progress', 'completed'].includes(status)) return json({ error: 'invalid progress' }, 400)
      const { data: activities, error: activitiesError } = await admin.from('activities').select('id').eq('lesson_id', lessonId).order('order_index')
      if (activitiesError) throw activitiesError
      if (!activities?.length) return json({ error: 'lesson has no activities' }, 400)
      const { data: existing, error: existingError } = await admin.from('lesson_progress').select('*').eq('profile_id', profile.id).eq('lesson_id', lessonId).maybeSingle()
      if (existingError) throw existingError

      if (status === 'in_progress') {
        const requestedScore = Math.max(0, Math.min(activities.length, Math.floor(Number(body.payload?.score || 0))))
        const { data, error } = await admin.from('lesson_progress').upsert({
          profile_id: profile.id, lesson_id: lessonId, status, score: requestedScore,
          mastery: existing?.mastery || 0, attempts: existing?.attempts || 0,
          started_at: body.payload?.startedAt || existing?.started_at || new Date().toISOString(),
          xp: existing?.xp || 0, stars: existing?.stars || 0, completed_at: existing?.completed_at || null,
          next_review_at: existing?.next_review_at || null
        }, { onConflict: 'profile_id,lesson_id' }).select().single()
        if (error) throw error
        return json({ ok: true, progress: data })
      }

      const ids = activities.map(a => a.id)
      const { data: attempts, error: attemptsError } = await admin.from('activity_attempts').select('activity_id,is_correct,created_at').eq('profile_id', profile.id).in('activity_id', ids).order('created_at', { ascending: false })
      if (attemptsError) throw attemptsError
      const latest = new Map<string, boolean>()
      for (const attempt of attempts || []) if (!latest.has(attempt.activity_id)) latest.set(attempt.activity_id, Boolean(attempt.is_correct))
      const score = [...latest.values()].filter(Boolean).length
      const accuracy = score / activities.length
      const mastery = Number((((existing?.mastery || 0) * .4) + (accuracy * .6)).toFixed(3))
      const stars = accuracy >= .9 ? 3 : accuracy >= .6 ? 2 : accuracy >= .3 ? 1 : 0
      const rewardKey = `lesson:${lessonId}:completion`
      const { data: reward } = await admin.from('reward_transactions').select('amount').eq('profile_id', profile.id).eq('reward_key', rewardKey).maybeSingle()
      const rewardAmount = 20 + score * 10
      if (!reward) {
        const { error: rewardError } = await admin.from('reward_transactions').insert({ profile_id: profile.id, reward_key: rewardKey, amount: rewardAmount })
        if (rewardError && rewardError.code !== '23505') throw rewardError
      }
      const storedXp = existing?.xp || rewardAmount
      const storedStars = Math.max(existing?.stars || 0, stars)
      const progress = {
        profile_id: profile.id, lesson_id: lessonId, status: 'completed', score, mastery,
        attempts: (existing?.attempts || 0) + 1, started_at: body.payload?.startedAt || existing?.started_at || null,
        completed_at: new Date().toISOString(), next_review_at: reviewDate(mastery), xp: storedXp, stars: storedStars
      }
      const { data, error } = await admin.from('lesson_progress').upsert(progress, { onConflict: 'profile_id,lesson_id' }).select().single()
      if (error) throw error
      return json({ ok: true, progress: data, serverScore: score, mastery })
    }

    if (body.action === 'analytics') {
      const eventName = String(body.payload?.eventName || '').slice(0, 80)
      if (!eventName) return json({ error: 'eventName required' }, 400)
      const { error } = await admin.from('analytics_events').insert({ profile_id: profile.id, event_name: eventName, payload: body.payload?.payload || {} })
      if (error) throw error
      return json({ ok: true })
    }
    return json({ error: 'unknown action' }, 400)
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400)
  }
})
