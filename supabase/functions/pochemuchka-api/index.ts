// Production deployment is managed by GitHub Actions.
// Deployment trigger: verify SUPABASE_ACCESS_TOKEN and redeploy gift purchase action.
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'content-type': 'application/json' },
  })

async function hmac(key: Uint8Array, message: string) {
  const keyBuffer = new ArrayBuffer(key.byteLength)
  new Uint8Array(keyBuffer).set(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message)))
}
async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}
function hex(bytes: Uint8Array) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}
function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
function hexToUuid(h: string) {
  const x = h.slice(0, 32)
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-5${x.slice(13, 16)}-8${x.slice(17, 20)}-${x.slice(20, 32)}`
}
async function stableUuid(id: number) {
  return hexToUuid(hex(await sha256(`pochemuchka:telegram:${id}`)))
}

async function telegramUser(initData: string, token: string) {
  const params = new URLSearchParams(initData)
  const hash = params.get('hash')
  const authDate = Number(params.get('auth_date') || 0)
  const now = Math.floor(Date.now() / 1000)

  if (!hash || !authDate || now - authDate > 86400 || now < authDate - 60) {
    throw new Error('invalid or expired initData')
  }

  params.delete('hash')
  const data = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n')
  const secret = await hmac(new TextEncoder().encode('WebAppData'), token)
  if (!constantTimeEqual(hex(await hmac(secret, data)), hash)) {
    throw new Error('invalid Telegram signature')
  }

  const user = JSON.parse(params.get('user') || 'null')
  if (!user?.id) throw new Error('Telegram user missing')
  return user
}

function secretKey() {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (keys) {
    try {
      const parsed = JSON.parse(keys)
      if (parsed.default) return parsed.default
    } catch {}
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
}

function reviewDate(mastery: number) {
  const days = mastery < 1 ? 1 : 7
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function evaluateActivity(type: string, content: any, answer: unknown) {
  if (!content || answer === null || answer === undefined) return false

  if (type === 'quiz') {
    return typeof answer === 'string' && answer === String(content.correctAnswerId)
  }

  if (type === 'drag_drop') {
    if (!answer || typeof answer !== 'object') return false
    const a = answer as { item?: unknown; target?: unknown }
    const targetIndex = Array.isArray(content.targets) ? content.targets.indexOf(a.target) : -1
    return targetIndex >= 0 &&
      Array.isArray(content.correct) &&
      String(content.correct[targetIndex]) === String(a.item)
  }

  if (type === 'matching') {
    if (!answer || typeof answer !== 'object') return false
    const a = answer as { first?: unknown; second?: unknown }
    if (typeof a.first !== 'string' || typeof a.second !== 'string') return false
    return Array.isArray(content.pairs) && content.pairs.some(
      (pair: unknown) =>
        Array.isArray(pair) &&
        pair.length === 2 &&
        ((String(pair[0]) === a.first && String(pair[1]) === a.second) ||
          (String(pair[0]) === a.second && String(pair[1]) === a.first)),
    )
  }

  return false
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const url = Deno.env.get('SUPABASE_URL')
    const key = secretKey()
    if (!token || !url || !key) return json({ error: 'server not configured' }, 500)

    const body = await req.json()
    const user = await telegramUser(String(body.initData || ''), token)
    const admin = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const userId = await stableUuid(Number(user.id))

    if (body.action === 'bootstrap') {
      const { data: profile, error: pe } = await admin
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()
      if (pe) throw pe
      if (!profile) {
        return json({ ok: true, telegramUser: user, profile: null, progress: [], activityAttempts: [] })
      }

      const [{ data: progress, error: progressError }, { data: attempts, error: attemptsError }] =
        await Promise.all([
          admin.from('lesson_progress').select('*').eq('profile_id', profile.id),
          admin
            .from('activity_attempts')
            .select('*')
            .eq('profile_id', profile.id)
            .order('created_at', { ascending: true })
            .limit(1000),
        ])
      if (progressError) throw progressError
      if (attemptsError) throw attemptsError

      // Keep bootstrap compatible during the one-time database migration.
      let giftPurchases: any[] = []
      const { data: transactionalPurchases, error: transactionalPurchaseError } = await admin
        .from('gift_purchases')
        .select('gift_id,created_at')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(100)
      if (!transactionalPurchaseError) {
        giftPurchases = transactionalPurchases || []
      } else {
        const { data: legacyPurchases, error: legacyPurchaseError } = await admin
          .from('analytics_events')
          .select('payload,created_at')
          .eq('profile_id', profile.id)
          .eq('event_name', 'gift_purchased')
          .order('created_at', { ascending: true })
          .limit(100)
        if (legacyPurchaseError) throw legacyPurchaseError
        giftPurchases = (legacyPurchases || []).map((row: any) => ({
          gift_id: String(row.payload?.giftId || ''),
          created_at: row.created_at,
        })).filter((row: any) => row.gift_id)
      }

      return json({
        ok: true,
        telegramUser: user,
        profile,
        progress: progress || [],
        activityAttempts: attempts || [],
        giftPurchases: (giftPurchases || []).map((row: any) => ({ gift_id: String(row.gift_id || '') })).filter((row: any) => row.gift_id),
      })
    }

    if (body.action === 'save_profile') {
      const age = Number(body.payload?.age)
      const name = String(body.payload?.name || '').trim().slice(0, 40)
      const avatar = String(body.payload?.avatar || '🐱').slice(0, 8)
      if (!name || age < 4 || age > 10) return json({ error: 'invalid profile' }, 400)

      const { error: ue } = await admin.from('telegram_users').upsert(
        {
          id: userId,
          telegram_id: Number(user.id),
          first_name: user.first_name || null,
          last_name: user.last_name || null,
          username: user.username || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'telegram_id' },
      )
      if (ue) throw ue

      const { data, error } = await admin
        .from('profiles')
        .upsert(
          { user_id: userId, name, age, avatar, updated_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        )
        .select()
        .single()
      if (error) throw error
      return json({ ok: true, profile: data })
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id,age')
      .eq('user_id', userId)
      .single()
    if (profileError || !profile) return json({ error: 'profile not found' }, 404)

    if (body.action === 'activity_attempt') {
      const activityId = String(body.payload?.activityId || '')
      if (!activityId) return json({ error: 'activityId required' }, 400)

      const { data: activity, error: ae } = await admin
        .from('activities')
        .select('id,type,content,lesson_id,lessons!inner(id,is_active,age_min,age_max)')
        .eq('id', activityId)
        .maybeSingle()
      if (ae) throw ae
      if (!activity) return json({ error: 'activity not found' }, 404)

      const lesson = Array.isArray(activity.lessons) ? activity.lessons[0] : activity.lessons
      if (!lesson?.is_active || profile.age < lesson.age_min || profile.age > lesson.age_max) {
        return json({ error: 'activity unavailable for this profile' }, 403)
      }

      const answer = body.payload?.answer ?? null
      const isCorrect = evaluateActivity(activity.type, activity.content, answer)
      const timeSpent = Math.max(0, Math.min(3600000, Math.floor(Number(body.payload?.timeSpent || 0))))

      const { data, error } = await admin
        .from('activity_attempts')
        .insert({
          profile_id: profile.id,
          activity_id: activityId,
          is_correct: isCorrect,
          answer,
          time_spent: timeSpent,
        })
        .select()
        .single()
      if (error) throw error

      return json({ ok: true, isCorrect, attempt: data })
    }

    if (body.action === 'purchase_gift') {
      const giftId = String(body.payload?.giftId || '')
      const giftCosts: Record<string, number> = { sticker: 5, avatar: 10, treasure: 15 }
      if (!giftCosts[giftId]) return json({ error: 'unknown gift' }, 400)

      const { data, error } = await admin.rpc('purchase_gift_atomic', {
        p_profile_id: profile.id,
        p_gift_id: giftId,
      })

      // The first production deploy may race the one-time DB migration.
      // Fall back to the legacy event path only while the RPC does not exist.
      if (error?.code === '42883' || error?.message?.includes('purchase_gift_atomic')) {
        const { data: purchases, error: purchaseReadError } = await admin
          .from('analytics_events')
          .select('payload,created_at')
          .eq('profile_id', profile.id)
          .eq('event_name', 'gift_purchased')
          .order('created_at', { ascending: true })
        if (purchaseReadError) throw purchaseReadError

        const purchasedGifts = (purchases || [])
          .map((row: any) => String(row.payload?.giftId || ''))
          .filter(Boolean)
        if (purchasedGifts.includes(giftId)) {
          const { data: progressRows, error: starError } = await admin
            .from('lesson_progress')
            .select('stars')
            .eq('profile_id', profile.id)
          if (starError) throw starError
          const earnedStars = (progressRows || []).reduce((n: number, row: any) => n + Number(row.stars || 0), 0)
          const spentStars = purchasedGifts.reduce((n, id) => n + (giftCosts[id] || 0), 0)
          return json({ ok: true, alreadyPurchased: true, stars: Math.max(0, earnedStars - spentStars), purchasedGifts })
        }

        const { data: progressRows, error: starError } = await admin
          .from('lesson_progress')
          .select('stars')
          .eq('profile_id', profile.id)
        if (starError) throw starError
        const earnedStars = (progressRows || []).reduce((n: number, row: any) => n + Number(row.stars || 0), 0)
        const spentStars = purchasedGifts.reduce((n, id) => n + (giftCosts[id] || 0), 0)
        const stars = earnedStars - spentStars
        if (stars < giftCosts[giftId]) return json({ error: 'not_enough_stars', stars: Math.max(0, stars) }, 400)

        const { error: purchaseError } = await admin.from('analytics_events').insert({
          profile_id: profile.id,
          event_name: 'gift_purchased',
          payload: { giftId, cost: giftCosts[giftId] },
        })
        if (purchaseError) throw purchaseError
        return json({ ok: true, stars: stars - giftCosts[giftId], purchasedGifts: [...purchasedGifts, giftId] })
      }

      if (error) throw error
      if (data?.error) {
        const status = data.error === 'already_purchased' ? 200 : data.error === 'not_enough_stars' ? 400 : 400
        return json(data, status)
      }

      return json(data)
    }

    if (body.action === 'leaderboard') {
      const { data: profiles, error: profilesError } = await admin
        .from('profiles')
        .select('id,name,avatar')
      if (profilesError) throw profilesError

      const { data: progressRows, error: progressError } = await admin
        .from('lesson_progress')
        .select('profile_id,xp,status,lesson_id')
        .eq('status', 'completed')
      if (progressError) throw progressError

      const totals = new Map<string, { points: number; completed: Set<string> }>()
      for (const row of progressRows || []) {
        const current = totals.get(row.profile_id) || { points: 0, completed: new Set<string>() }
        current.points += Number(row.xp || 0)
        current.completed.add(row.lesson_id)
        totals.set(row.profile_id, current)
      }

      const { data: lessonCatalog, error: lessonError } = await admin
        .from('lessons')
        .select('id,title')
        .eq('is_active', true)
      if (lessonError) throw lessonError

      const leaderboard = (profiles || [])
        .map((p: any) => {
          const total = totals.get(p.id) || { points: 0, completed: new Set<string>() }
          const lessons = (lessonCatalog || []).map((lesson: any) => ({
            lessonId: lesson.id,
            title: String(lesson.title || 'Урок'),
            completed: total.completed.has(lesson.id),
          }))
          return {
            profileId: p.id,
            name: String(p.name || 'Ученик').slice(0, 40),
            avatar: String(p.avatar || '🐱').slice(0, 8),
            points: total.points,
            completedLessons: lessons.filter((lesson) => lesson.completed).length,
            totalLessons: lessons.length,
            lessons,
          }
        })
        .filter((entry) => entry.points > 0)
        .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name))
        .slice(0, 100)
        .map((entry, index) => ({ rank: index + 1, ...entry, isCurrentUser: entry.profileId === profile.id }))

      return json({ ok: true, leaderboard })
    }

    if (body.action === 'due_reviews') {
      const { data, error } = await admin
        .from('lesson_progress')
        .select('*')
        .eq('profile_id', profile.id)
        .not('next_review_at', 'is', null)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true })
      if (error) throw error
      return json({ ok: true, progress: data || [] })
    }

    if (body.action === 'save_progress') {
      const lessonId = String(body.payload?.lessonId || '')
      const status = String(body.payload?.status || '')
      if (!lessonId || !['in_progress', 'completed'].includes(status)) {
        return json({ error: 'invalid progress' }, 400)
      }

      const { data: lesson, error: lessonError } = await admin
        .from('lessons')
        .select('id,is_active,age_min,age_max,topic_id,order_index')
        .eq('id', lessonId)
        .maybeSingle()
      if (lessonError) throw lessonError
      if (!lesson || !lesson.is_active || profile.age < lesson.age_min || profile.age > lesson.age_max) {
        return json({ error: 'lesson unavailable for this profile' }, 403)
      }

      // The client lock is UX only; the server also enforces lesson sequence.
      const { data: sequence, error: sequenceError } = await admin
        .from('lessons')
        .select('id,order_index')
        .eq('topic_id', lesson.topic_id)
        .eq('is_active', true)
        .lte('age_min', profile.age)
        .gte('age_max', profile.age)
        .order('order_index', { ascending: true })
      if (sequenceError) throw sequenceError

      const lessonIndex = (sequence || []).findIndex((item: any) => item.id === lessonId)
      if (lessonIndex > 0) {
        const previousLessonId = sequence![lessonIndex - 1].id
        const { data: previousProgress, error: previousProgressError } = await admin
          .from('lesson_progress')
          .select('status')
          .eq('profile_id', profile.id)
          .eq('lesson_id', previousLessonId)
          .maybeSingle()
        if (previousProgressError) throw previousProgressError
        if (previousProgress?.status !== 'completed') {
          return json({ error: 'lesson locked' }, 403)
        }
      }

      const { data: activities, error: activitiesError } = await admin
        .from('activities')
        .select('id,type,content')
        .eq('lesson_id', lessonId)
        .order('order_index')
      if (activitiesError) throw activitiesError
      if (!activities?.length) return json({ error: 'lesson has no activities' }, 400)

      const { data: existing, error: existingError } = await admin
        .from('lesson_progress')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('lesson_id', lessonId)
        .maybeSingle()
      if (existingError) throw existingError

      const ids = activities.map((a) => a.id)
      const { data: attempts, error: attemptsError } = await admin
        .from('activity_attempts')
        .select('activity_id,is_correct,created_at')
        .eq('profile_id', profile.id)
        .in('activity_id', ids)
        .order('created_at', { ascending: false })
      if (attemptsError) throw attemptsError

      const latest = new Map<string, boolean>()
      for (const attempt of attempts || []) {
        if (!latest.has(attempt.activity_id)) latest.set(attempt.activity_id, Boolean(attempt.is_correct))
      }

      const answeredCount = latest.size
      const score = [...latest.values()].filter(Boolean).length
      const accuracy = score / activities.length

      if (status === 'completed' && answeredCount < activities.length) {
        return json({
          error: 'lesson has unanswered activities',
          answered: answeredCount,
          total: activities.length,
        }, 400)
      }

      if (status === 'in_progress') {
        const { data, error } = await admin
          .from('lesson_progress')
          .upsert(
            {
              profile_id: profile.id,
              lesson_id: lessonId,
              status,
              score,
              mastery: existing?.mastery || 0,
              attempts: existing?.attempts || 0,
              started_at: body.payload?.startedAt || existing?.started_at || new Date().toISOString(),
              xp: existing?.xp || 0,
              stars: existing?.stars || 0,
              completed_at: existing?.completed_at || null,
              next_review_at: existing?.next_review_at || null,
            },
            { onConflict: 'profile_id,lesson_id' },
          )
          .select()
          .single()
        if (error) throw error
        return json({ ok: true, progress: data, serverScore: score })
      }

      const mastery = Number(accuracy.toFixed(3))
      const stars = accuracy >= 0.9 ? 3 : accuracy >= 0.6 ? 2 : accuracy >= 0.3 ? 1 : 0
      const rewardKey = `lesson:${lessonId}:completion`
      const { data: reward, error: rewardLookupError } = await admin
        .from('reward_transactions')
        .select('amount')
        .eq('profile_id', profile.id)
        .eq('reward_key', rewardKey)
        .maybeSingle()
      if (rewardLookupError) throw rewardLookupError

      const rewardAmount = 20 + score * 10
      if (!reward) {
        const { error: rewardError } = await admin.from('reward_transactions').insert({
          profile_id: profile.id,
          reward_key: rewardKey,
          amount: rewardAmount,
        })
        if (rewardError && rewardError.code !== '23505') throw rewardError
      }

      const storedXp = existing?.xp || rewardAmount
      const storedStars = Math.max(existing?.stars || 0, stars)
      const progress = {
        profile_id: profile.id,
        lesson_id: lessonId,
        status: 'completed',
        score,
        mastery,
        attempts: (existing?.attempts || 0) + 1,
        started_at: body.payload?.startedAt || existing?.started_at || null,
        completed_at: new Date().toISOString(),
        next_review_at: reviewDate(mastery),
        xp: storedXp,
        stars: storedStars,
      }
      const { data, error } = await admin
        .from('lesson_progress')
        .upsert(progress, { onConflict: 'profile_id,lesson_id' })
        .select()
        .single()
      if (error) throw error

      return json({ ok: true, progress: data, serverScore: score, mastery })
    }

    if (body.action === 'analytics') {
      const eventName = String(body.payload?.eventName || '').slice(0, 80)
      if (!eventName) return json({ error: 'eventName required' }, 400)
      const { error } = await admin.from('analytics_events').insert({
        profile_id: profile.id,
        event_name: eventName,
        payload: body.payload?.payload || {},
      })
      if (error) throw error
      return json({ ok: true })
    }

    return json({ error: 'unknown action' }, 400)
  } catch (error) {
    console.error('pochemuchka-api request failed', error)
    return json({ error: error instanceof Error ? error.message : String(error) }, 400)
  }
})
