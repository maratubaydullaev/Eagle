import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const source = resolve(root, 'public/images/home-approved.webp')
const target = resolve(root, 'public/images/home-approved-hq.webp')

mkdirSync(dirname(target), { recursive: true })

if (!existsSync(source)) {
  throw new Error(`Missing source image: ${source}`)
}

const candidates = ['magick', 'convert']
let prepared = false

for (const command of candidates) {
  const probe = spawnSync(command, ['-version'], { stdio: 'ignore' })
  if (probe.error || probe.status !== 0) continue

  const result = spawnSync(command, [
    source,
    '-resize', '768x',
    '-filter', 'Lanczos',
    '-unsharp', '0x0.8+0.5+0.02',
    '-define', 'webp:method=6',
    '-quality', '96',
    target,
  ], { stdio: 'inherit' })

  if (!result.error && result.status === 0 && existsSync(target)) {
    prepared = true
    console.log(`Prepared Home image with ${command}: ${target}`)
    break
  }
}

if (!prepared) {
  console.warn('ImageMagick is unavailable; using the original approved image as a fallback.')
  copyFileSync(source, target)
}
