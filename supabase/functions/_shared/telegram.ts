// Единая Telegram initData-валидация для всех Edge Functions.
// Используется:
//   - supabase/functions/pochemuchka-api/index.ts
//   - supabase/functions/telegram-auth/index.ts

export async function hmac(key: Uint8Array, message: string) {
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

// Детерминированный производный UUID из Telegram user id (не «случайный» uuid).
export async function stableUuid(id: number) {
  return hexToUuid(hex(await sha256(`pochemuchka:telegram:${id}`)))
}

export async function verifyTelegramInitData(initData: string, token: string) {
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
