#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import QRCode from 'qrcode'

const root = new URL('..', import.meta.url).pathname
const assetDir = join(root, 'docs/assets/ugc')
const workDir = join(root, '.local/ugc-psa')
const rawVideo = join(assetDir, '404-missing-ugc-psa-raw.mp4')
const voiceover = join(assetDir, '404-missing-ugc-psa-voiceover.mp3')
const qr = join(assetDir, '404-missing-github-qr.png')
const captions = join(assetDir, '404-missing-ugc-psa.vtt')
const finalVideo = join(assetDir, '404-missing-ugc-psa.mp4')
const poster = join(assetDir, '404-missing-ugc-psa-poster.jpg')
const contactSheet = join(workDir, '404-missing-ugc-psa-contact-sheet.jpg')
const storyOverlaySvg = join(workDir, 'story-overlay.svg')
const storyOverlayPng = join(workDir, 'story-overlay.png')
const endCardSvg = join(workDir, 'end-card.svg')
const endCardPng = join(workDir, 'end-card.png')
const githubUrl = 'https://github.com/dilrajahdan/404-missing'
const strapline = 'Turn dead links into lifelines.'

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

function escDrawtext(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
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

await mkdir(assetDir, { recursive: true })
await mkdir(workDir, { recursive: true })
await QRCode.toFile(qr, githubUrl, {
  errorCorrectionLevel: 'M',
  margin: 2,
  width: 520,
  color: {
    dark: '#0b1f14',
    light: '#f5f7f0',
  },
})

await writeFile(storyOverlaySvg, `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <rect x="0" y="0" width="720" height="112" fill="#000000" opacity="0.34"/>
  <rect x="30" y="27" width="240" height="64" rx="18" fill="#000000" opacity="0.24"/>
  <text x="50" y="70" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="800" fill="#ffffff">404 Missing</text>
  <text x="670" y="68" text-anchor="end" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#ffffff">Fictional dramatisation</text>
  <rect x="30" y="1110" width="660" height="92" rx="24" fill="#000000" opacity="0.56"/>
  <text x="52" y="1169" font-family="Arial, Helvetica, sans-serif" font-size="39" font-weight="850" fill="#ffffff">${escDrawtext(strapline)}</text>
</svg>
`)
run('rsvg-convert', ['-w', '720', '-h', '1280', '-o', storyOverlayPng, storyOverlaySvg])

const qrBase64 = (await readFile(qr)).toString('base64')
await writeFile(endCardSvg, `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="1280" viewBox="0 0 720 1280">
  <defs>
    <radialGradient id="glow" cx="50%" cy="18%" r="72%">
      <stop offset="0%" stop-color="#244c31"/>
      <stop offset="58%" stop-color="#0b1f14"/>
      <stop offset="100%" stop-color="#06120b"/>
    </radialGradient>
  </defs>
  <rect width="720" height="1280" fill="url(#glow)"/>
  <circle cx="604" cy="130" r="92" fill="#5ca56b" opacity="0.18"/>
  <circle cx="98" cy="1130" r="126" fill="#5ca56b" opacity="0.13"/>
  <text x="360" y="172" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="900" fill="#ffffff">Turn dead links</text>
  <text x="360" y="238" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="56" font-weight="900" fill="#ffffff">into lifelines.</text>
  <text x="360" y="315" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="650" fill="#d7eadb">Open source missing-child appeals</text>
  <text x="360" y="355" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="29" font-weight="650" fill="#d7eadb">for 404 pages</text>
  <rect x="183" y="442" width="354" height="354" rx="34" fill="#f5f7f0"/>
  <image href="data:image/png;base64,${qrBase64}" x="205" y="464" width="310" height="310"/>
  <text x="360" y="970" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="27" font-weight="760" fill="#f7fff7">${escDrawtext(githubUrl)}</text>
  <text x="360" y="1022" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="25" font-weight="650" fill="#bad6c0">Scan or star the repo</text>
  <text x="360" y="1100" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="23" fill="#86ae8f">Show an official appeal where a dead link used to be.</text>
</svg>
`)
run('rsvg-convert', ['-w', '720', '-h', '1280', '-o', endCardPng, endCardSvg])

// Generate verbatim captions from the TTS alignment, rather than estimated timings.
const narration = JSON.parse(await readFile(join(assetDir, '404-missing-ugc-psa-narration.json'), 'utf8'))
const { characters, character_start_times_seconds: starts, character_end_times_seconds: ends } = narration.alignment
function timestamp(seconds) {
  const ms = Math.round(seconds * 1000)
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`
}
const cues = []
let first = 0
for (let i = 0; i < characters.length; i++) {
  if ((/[.!?]/.test(characters[i]) && !/[.!?]/.test(characters[i + 1] || '')) || i === characters.length - 1) {
    while (first < i && /\s/.test(characters[first])) first++
    cues.push(`${timestamp(starts[first])} --> ${timestamp(ends[i])}\n${characters.slice(first, i + 1).join('')}`)
    first = i + 1
  }
}
await writeFile(captions, `WEBVTT\n\n${cues.join('\n\n')}\n`)

const storyDuration = 25
const totalDuration = Math.max(32, duration(voiceover) + 1.5)
const endDuration = totalDuration - storyDuration
// Keep narration continuous across the story and final card. Never truncate speech.
run('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'warning',
  '-i', rawVideo, '-i', storyOverlayPng,
  '-loop', '1', '-framerate', '24', '-i', endCardPng,
  '-i', voiceover,
  '-filter_complex', [
    `[0:v]trim=duration=${storyDuration},setpts=PTS-STARTPTS,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,fps=24[story]`,
    '[story][1:v]overlay=0:0,format=yuv420p[v0]',
    `[2:v]trim=duration=${endDuration},setpts=PTS-STARTPTS,setsar=1,format=yuv420p[v1]`,
    '[v0][v1]concat=n=2:v=1:a=0[v]',
    `[3:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000,afade=t=in:d=0.03,apad,atrim=duration=${totalDuration}[a]`,
  ].join(';'),
  '-map', '[v]', '-map', '[a]', '-t', String(totalDuration),
  '-c:v', 'libx264', '-crf', '22', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', finalVideo,
])

run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-ss', String(totalDuration - 1), '-i', finalVideo, '-frames:v', '1', '-update', '1', poster])
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-i', finalVideo, '-vf', `fps=1/2,scale=180:-1,tile=5x${Math.ceil(totalDuration / 10)}`, '-frames:v', '1', '-update', '1', contactSheet])
console.log(`Rendered ${totalDuration.toFixed(2)} seconds with continuous narration and ${endDuration.toFixed(2)} seconds of repository end-card.`)
