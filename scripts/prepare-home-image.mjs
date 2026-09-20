import { existsSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const source = resolve(root, 'public/images/home-approved.webp')
const target = resolve(root, 'public/images/home-approved-hq.webp')

mkdirSync(dirname(target), { recursive: true })

if (!existsSync(source)) {
  throw new Error(`Missing source image: ${source}`)
}

try {
  await sharp(source)
    .resize({ width: 768, kernel: sharp.kernel.lanczos3 })
    .sharpen({ sigma: 0.8, m1: 0.5, m2: 0.02 })
    .webp({ quality: 96, effort: 6 })
    .toFile(target)

  console.log(`Prepared high-resolution Home image: ${target}`)
} catch (error) {
  console.warn('Sharp image preparation failed; using the original approved image as a fallback.', error)
  copyFileSync(source, target)
}
