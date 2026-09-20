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

const result = spawnSync('magick', [
  source,
  '-resize', '768x',
  '-filter', 'Lanczos',
  '-unsharp', '0x0.8+0.5+0.02',
  '-define', 'webp:method=6',
  '-quality', '96',
  target,
], { stdio: 'inherit' })

if (result.error || result.status !== 0) {
  console.warn('ImageMagick is unavailable; using the original approved image as a fallback.')
  copyFileSync(source, target)
}

console.log(`Prepared Home image: ${target}`)
