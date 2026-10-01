#!/usr/bin/env node
import { access, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const out = join(root, 'docs/assets')
const work = join(root, '.local/product-video')
const width = 1280
const height = 720
const fps = 30
const framesPerScene = 90
const scenes = [
  {
    eyebrow: 'Step 0 + 1: Get ready',
    title: 'Install. Choose your provider.',
    body: 'Node 22+. Install the release linked in the README. Request NCMEC approval for inline US appeals.',
    code: 'README → Five-Minute Path\ndocs/api-access.md → Get provider access',
    focus: 'card',
  },
  {
    eyebrow: 'Step 2 + 3: Server route',
    title: 'One small config object.',
    body: 'Keys stay on your server. The common helper wires the provider, service and Fetch handler for you.',
    code: `createMissing404Handler({\n  defaultCountry: 'GB',\n  ncmec: { clientId, clientSecret, tokenStore },\n})`,
    focus: 'config',
  },
  {
    eyebrow: 'Step 4: Your 404 page',
    title: 'React, Vue, Ember, Astro or plain HTML.',
    body: 'Use the adapter for your stack, or drop in the web component anywhere a 404 page can render HTML.',
    code: `React  <MissingChild country="GB" />\nVue    <MissingChild country="GB" />\nEmber  <missing-child country="GB"></missing-child>\nAstro  <missing-child country="GB"></missing-child>`,
    focus: 'grid',
  },
  {
    eyebrow: 'Step 5: Check the result',
    title: 'Visit a missing URL.',
    body: 'Check HTTP 404, the home link and the official link. UK currently uses a directory while feed access is arranged.',
    code: 'HTTP 404 + no-store API + official reporting link',
    focus: 'result',
  },
]

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function lines(value, max = 54) {
  const words = String(value).split(/\s+/)
  const rows = []
  let row = ''
  for (const word of words) {
    const next = row ? `${row} ${word}` : word
    if (next.length > max && row) {
      rows.push(row)
      row = word
    } else row = next
  }
  if (row) rows.push(row)
  return rows
}

function textBlock(rows, x, y, size, color, weight = 500, gap = 1.35) {
  return rows.map((row, i) => `<text x="${x}" y="${y + i * size * gap}" fill="${color}" font-size="${size}" font-weight="${weight}">${esc(row)}</text>`).join('')
}

function codeBlock(code, x, y, w) {
  const rows = code.split('\n')
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${rows.length * 34 + 42}" rx="14" fill="#121815" stroke="#314039"/>
    ${rows.map((row, i) => `<text x="${x + 28}" y="${y + 50 + i * 34}" fill="#dce8df" font-size="17" font-family="'SFMono-Regular','Menlo','Consolas',monospace">${esc(row)}</text>`).join('')}
  `
}

function card(focus, t) {
  const glow = 0.25 + Math.sin(t * Math.PI) * 0.35
  const photo = focus === 'result' ? '#d9e8dc' : '#ebefe8'
  return `
    <g transform="translate(770 128)">
      <rect width="390" height="468" rx="22" fill="#f8faf5" stroke="#c9d5cb" stroke-width="2"/>
      <text x="34" y="52" fill="#526359" font-size="18" font-weight="700" letter-spacing="3">A MOMENT TO HELP</text>
      <text x="34" y="98" fill="#17231c" font-size="25" font-weight="760">Help bring a child home</text>
      <text x="34" y="138" fill="#405348" font-size="20">An official appeal or local directory.</text>
      <rect x="34" y="174" width="132" height="150" rx="8" fill="${photo}" stroke="#d2ddd4"/>
      <circle cx="100" cy="230" r="36" fill="#b7cdbd"/>
      <rect x="74" y="272" width="52" height="36" rx="18" fill="#b7cdbd"/>
      <text x="190" y="206" fill="#17231c" font-size="20" font-weight="730">Official appeal</text>
      <text x="190" y="244" fill="#405348" font-size="15">Selected area</text>
      <text x="190" y="278" fill="#405348" font-size="15">Official provider</text>
      <rect x="34" y="352" width="226" height="54" rx="8" fill="#263c2d"/>
      <text x="58" y="386" fill="#ffffff" font-size="20" font-weight="700">View official appeal</text>
      <text x="34" y="438" fill="#405348" font-size="18">Show appeals in: United Kingdom</text>
      <rect x="-8" y="-8" width="406" height="484" rx="28" fill="none" stroke="#67a97a" stroke-width="${focus === 'card' || focus === 'result' ? 4 : 0}" opacity="${glow}"/>
    </g>
  `
}

function frameworkGrid() {
  const items = [
    ['React', 'adapter'],
    ['Vue', 'adapter'],
    ['Ember', 'web component'],
    ['Astro', 'web component'],
  ]
  return `<g transform="translate(740 168)">${items.map(([name, type], i) => {
    const x = (i % 2) * 204
    const y = Math.floor(i / 2) * 148
    return `<g transform="translate(${x} ${y})"><rect width="172" height="112" rx="18" fill="#f8faf5" stroke="#c9d5cb" stroke-width="2"/><text x="24" y="46" fill="#17231c" font-size="28" font-weight="760">${name}</text><text x="24" y="78" fill="#526359" font-size="18">${type}</text></g>`
  }).join('')}</g>`
}

function svg(scene, frame) {
  const t = frame / (framesPerScene - 1)
  const slide = 18 - Math.cos(t * Math.PI / 2) * 18
  const opacity = Math.min(1, t * 3)
  const visual = scene.focus === 'grid' ? frameworkGrid() : card(scene.focus, t)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f4f7f0"/>
      <stop offset="0.55" stop-color="#eef5ed"/>
      <stop offset="1" stop-color="#e5eee4"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="28" flood-color="#17311f" flood-opacity="0.16"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <circle cx="1080" cy="68" r="92" fill="#d6e6d8" opacity="0.55"/>
  <circle cx="116" cy="646" r="120" fill="#dce8df" opacity="0.8"/>
  <g transform="translate(${80 + slide} 96)" opacity="${opacity}">
    <text x="0" y="0" fill="#3d6b4d" font-size="21" font-weight="800" letter-spacing="4">${esc(scene.eyebrow.toUpperCase())}</text>
    ${textBlock(lines(scene.title, 25), 0, 72, 58, '#17231c', 780, 1.06)}
    ${textBlock(lines(scene.body, 52), 0, 220, 25, '#3e5047', 500, 1.38)}
    ${codeBlock(scene.code, 0, 360, 610)}
  </g>
  <g filter="url(#shadow)" opacity="${opacity}">
    ${visual}
  </g>
  <rect x="80" y="650" width="${1120 * ((scenes.indexOf(scene) + t) / scenes.length)}" height="8" rx="4" fill="#3d6b4d"/>
  <text x="80" y="685" fill="#526359" font-size="18">404 Missing • Setup walkthrough • github.com/dilrajahdan/404-missing</text>
</svg>`
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function capture(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout)
    process.exit(result.status ?? 1)
  }
  return result.stdout.trim()
}

function duration(path) {
  return Number(capture('ffprobe', [
    '-hide_banner',
    '-v',
    'error',
    '-show_entries',
    'format=duration',
    '-of',
    'default=noprint_wrappers=1:nokey=1',
    path,
  ]))
}

function vttTime(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const whole = Math.floor(seconds % 60)
  const millis = Math.round((seconds - Math.floor(seconds)) * 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(millis).padStart(3, '0')}`
}

await rm(work, { recursive: true, force: true })
await mkdir(work, { recursive: true })
await mkdir(out, { recursive: true })

let index = 0
for (const scene of scenes) {
  for (let frame = 0; frame < framesPerScene; frame++) {
    const name = `frame-${String(index).padStart(4, '0')}`
    const svgPath = join(work, `${name}.svg`)
    const pngPath = join(work, `${name}.png`)
    await writeFile(svgPath, svg(scene, frame))
    run('rsvg-convert', ['-w', String(width), '-h', String(height), '-o', pngPath, svgPath])
    index++
  }
}

const mp4 = join(out, '404-missing-product-demo.mp4')
const silentMp4 = join(work, '404-missing-product-demo-silent.mp4')
const voiceover = join(out, '404-missing-product-demo-voiceover.mp3')
const gif = join(out, '404-missing-product-demo.gif')
const captions = join(out, '404-missing-product-demo.vtt')
const poster = join(out, '404-missing-product-demo-poster.png')
const sheet = join(work, '404-missing-product-demo-contact-sheet.jpg')

try {
  await access(voiceover)
} catch {
  console.error(`Missing product video voiceover: ${voiceover}`)
  console.error('Generate the ElevenLabs voiceover first. Product videos for Dappa must not render silently.')
  process.exit(1)
}

const narration = JSON.parse(await readFile(join(out, '404-missing-product-demo-narration.json'), 'utf8'))
const durations = narration.scenes.map(scene => scene.duration)
const totalDuration = durations.reduce((sum, value) => sum + value, 0)
let offset = 0
const cues = []
for (const scene of narration.scenes) {
  const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = scene.alignment
  let first = 0
  for (let i = 0; i < characters.length; i++) {
    if (/[.!?]/.test(characters[i]) || i === characters.length - 1) {
      while (first < i && /\s/.test(characters[first])) first++
      cues.push(`${vttTime(offset + starts[first])} --> ${vttTime(offset + ends[i])}\n${characters.slice(first, i + 1).join('')}`)
      first = i + 1
    }
  }
  offset += scene.duration
}
await writeFile(captions, `WEBVTT\n\n${cues.join('\n\n')}\n`)
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-framerate', String(fps), '-i', join(work, 'frame-%04d.png'), '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '23', silentMp4])
const filters = ['[0:v]split=4[s0][s1][s2][s3]']
for (let i = 0; i < 4; i++) {
  filters.push(`[s${i}]trim=start=${i * 3}:end=${(i + 1) * 3},setpts=(PTS-STARTPTS)*${durations[i] / 3},fps=30,tpad=stop_mode=clone:stop_duration=1,trim=duration=${durations[i]}[v${i}]`)
}
filters.push('[v0][v1][v2][v3]concat=n=4:v=1:a=0,format=yuv420p[v]')
filters.push(`[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad,atrim=duration=${totalDuration}[a]`)
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-i', silentMp4, '-i', voiceover,
  '-filter_complex', filters.join(';'), '-map', '[v]', '-map', '[a]',
  '-c:v', 'libx264', '-crf', '23', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(totalDuration), mp4])
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-i', silentMp4, '-vf', 'fps=10,scale=760:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5', gif])
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-ss', '5', '-i', mp4, '-frames:v', '1', poster])
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-i', mp4, '-vf', `fps=1/${totalDuration / 12},scale=320:-1,tile=4x3`, '-frames:v', '1', sheet])
console.log(`Rendered ${mp4}`)
console.log(`Rendered ${gif}`)
console.log(`Rendered ${captions}`)
console.log(`Narrated walkthrough: ${totalDuration.toFixed(2)} seconds`)
console.log(`Rendered ${poster}`)
console.log(`Rendered ${sheet}`)
