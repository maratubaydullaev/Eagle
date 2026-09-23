import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { verifyTelegramInitData } from '../_shared/telegram.ts'

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

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const { initData } = await req.json()
    const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
    if (!initData || !token) return json({ error: 'missing configuration' }, 500)

    const user = await verifyTelegramInitData(String(initData), token)
    return json({ ok: true, user })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : String(error) }, 400)
  }
})
