import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

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
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  return new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message)))
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { initData } = await req.json()
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!initData || !token) return json({ error: 'missing configuration' }, 500)

    const params = new URLSearchParams(String(initData))
    const hash = params.get('hash')
    const authDate = Number(params.get('auth_date') || 0)
    const now = Math.floor(Date.now() / 1000)

    if (!hash || !authDate || now - authDate > 86400 || now < authDate - 60) {
      return json({ error: 'expired or invalid initData' }, 401)
    }

    params.delete('hash')
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => key + '=' + value)
      .join('\n')

    const enc = new TextEncoder()
    const secret = await hmac(enc.encode('WebAppData'), token)
    const digest = await hmac(secret, dataCheckString)
    const expectedHash = [...digest].map((b) => b.toString(16).padStart(2, '0')).join('')

    if (!constantTimeEqual(expectedHash, hash)) return json({ error: 'invalid initData' }, 401)

    const user = JSON.parse(params.get('user') || 'null')
    if (!user?.id) return json({ error: 'Telegram user missing' }, 401)
    return json({ ok: true, user })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400)
  }
})

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
