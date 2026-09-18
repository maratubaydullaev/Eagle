import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'content-type': 'application/json' } })

async function hmac(key: Uint8Array, message: string) {
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message)))
}
async function sha256(value: string) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))
}
function hex(bytes: Uint8Array) { return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('') }
async function telegramUser(initData: string, token: string) {
  const p = new URLSearchParams(initData), hash = p.get('hash'), authDate = Number(p.get('auth_date') || 0)
  p.delete('hash')
  if (!hash || !authDate || Math.floor(Date.now() / 1000) - authDate > 86400 || Math.floor(Date.now() / 1000) < authDate - 60) throw new Error('invalid or expired initData')
  const data = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join('\n')
  const secret = await hmac(new TextEncoder().encode('WebAppData'), token)
  const digest = hex(await hmac(secret, data))
  if (digest !== hash) throw new Error('invalid Telegram signature')
  const user = JSON.parse(p.get('user') || 'null')
  if (!user?.id) throw new Error('Telegram user missing')
  return user
}
function userUuid(telegramId: number) {
  return hexToUuid(hex(crypto.subtle ? new Uint8Array() : new Uint8Array()))
}
function hexToUuid(hexValue: string) {
  const h = hexValue.slice(0, 32)
  return `${h.slice(0,8)}-${h.slice(8,12)}-5${h.slice(13,16)}-8${h.slice(17,20)}-${h.slice(20,32)}`
}
async function stableUuid(id: number) {
  const digest = await sha256(`pochemuchka:telegram:${id}`)
  return hexToUuid(hex(digest))
}

serve(async req => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!token || !url || !serviceKey) return json({ error: 'server not configured' }, 500)
    const { initData, action, payload = {} } = await req.json()
    const user = await telegramUser(initData, token)
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
    const userId = await stableUuid(Number(user.id))

    if (action === 'bootstrap') {
      const { data: profile } = await admin.from('profiles').select('*').eq('user_id', userId).maybeSingle()
      const { data: progress, error } = profile ? await admin.from('lesson_progress').select('*').eq('profile_id', profile.id) : { data: [], error: null }
      if (error) throw error
      return json({ ok: true, telegramUser: user, profile, progress: progress || [] })
    }

    if (action === 'save_profile') {
      const age = Number(payload.age), name = String(payload.name || '').trim().slice(0, 40), avatar = String(payload.avatar || '🐱').slice(0, 8)
      if (!name || age < 6 || age > 10) return json({ error: 'invalid profile' }, 400)
      await admin.from('telegram_users').upsert({ id: userId, telegram_id: Number(user.id), first_name: user.first_name || null, last_name: user.last_name || null, username: user.username || null, updated_at: new Date().toISOString() }, { onConflict: 'telegram_id' })
      const { data, error } = await admin.from('profiles').upsert({ user_id: userId, name, age, avatar, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }).select().single()
      if (error) throw error
      return json({ ok: true, profile: data })
    }

    const { data: profile, error: profileError } = await admin.from('profiles').select('id').eq('user_id', userId).single()
    if (profileError || !profile) return json({ error: 'profile not found' }, 404)

    if (action === 'save_progress') {
      const allowed = ['locked', 'available', 'in_progress', 'completed']
      if (!allowed.includes(payload.status) || !payload.lessonId) return json({ error: 'invalid progress' }, 400)
      const row = { profile_id: profile.id, lesson_id: String(payload.lessonId), status: payload.status, score: Number(payload.score || 0), mastery: Number(payload.mastery || 0), attempts: Number(payload.attempts || 0), started_at: payload.startedAt || null, completed_at: payload.completedAt || null, xp: Number(payload.xp || 0), stars: Number(payload.stars || 0) }
      const { data, error } = await admin.from('lesson_progress').upsert(row, { onConflict: 'profile_id,lesson_id' }).select().single()
      if (error) throw error
      return json({ ok: true, progress: data })
    }

    if (action === 'analytics') {
      const eventName = String(payload.eventName || '').slice(0, 80)
      if (!eventName) return json({ error: 'eventName required' }, 400)
      const { error } = await admin.from('analytics_events').insert({ profile_id: profile.id, event_name: eventName, payload: payload.payload || {} })
      if (error) throw error
      return json({ ok: true })
    }

    return json({ error: 'unknown action' }, 400)
  } catch (e) { return json({ error: e instanceof Error ? e.message : String(e) }, 400) }
})
