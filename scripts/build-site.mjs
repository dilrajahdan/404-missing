import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
const out = new URL('../.local/site/404-missing/', import.meta.url)
await rm(out, { recursive: true, force: true })
await mkdir(out, { recursive: true })
await cp(new URL('../site/', import.meta.url), out, { recursive: true })
await mkdir(new URL('assets/', out), { recursive: true })
const assets = {
  'setup.mp4': '404-missing-product-demo.mp4',
  'setup.vtt': '404-missing-product-demo.vtt',
  'setup-poster.png': '404-missing-product-demo-poster.png',
  'story.mp4': 'ugc/404-missing-ugc-psa.mp4',
  'story.vtt': 'ugc/404-missing-ugc-psa.vtt',
  'story-poster.jpg': 'ugc/404-missing-ugc-psa-poster.jpg',
}
for (const [target, source] of Object.entries(assets)) {
  await cp(
    new URL(`../docs/assets/${source}`, import.meta.url),
    new URL(`assets/${target}`, out),
  )
}
await writeFile(new URL('.nojekyll', out), '')
const check = spawnSync('python3', ['scripts/verify-site.py', out.pathname], {
  stdio: 'inherit',
})
if (check.status !== 0) process.exit(check.status ?? 1)
console.log(`Built ${out.pathname}`)
