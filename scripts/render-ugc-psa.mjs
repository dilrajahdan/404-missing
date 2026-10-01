#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
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
const storyVideo = join(workDir, 'story.mp4')
const endCard = join(workDir, 'end-card.mp4')
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

await writeFile(captions, `WEBVTT

00:00.000 --> 00:03.800
Every site has dead links.

00:03.800 --> 00:08.000
What if one could help bring a child home?

00:08.000 --> 00:14.400
With 404 Missing, your 404 page can show an official local missing-child appeal.

00:14.400 --> 00:19.200
Your API keeps provider keys private.

00:19.200 --> 00:24.980
A visitor recognises something, calls police, and one page matters.

00:24.980 --> 00:30.000
${strapline}
${githubUrl}
`)

const audioDuration = Math.min(25, Math.max(20, duration(voiceover)))
const storyFilter = [
  `[0:v]trim=0:${audioDuration.toFixed(3)},setpts=PTS-STARTPTS,scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280,setsar=1,format=yuv420p[v0]`,
  `[2:v]format=rgba[ov]`,
  `[v0][ov]overlay=0:0[v]`,
  `[1:a]atrim=0:${audioDuration.toFixed(3)},asetpts=PTS-STARTPTS,loudnorm=I=-16:TP=-1.5:LRA=11[a]`,
].join(';')

run('ffmpeg', [
  '-y',
  '-hide_banner',
  '-loglevel',
  'warning',
  '-i',
  rawVideo,
  '-i',
  voiceover,
  '-i',
  storyOverlayPng,
  '-filter_complex',
  storyFilter,
  '-map',
  '[v]',
  '-map',
  '[a]',
  '-c:v',
  'libx264',
  '-crf',
  '22',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  '-movflags',
  '+faststart',
  storyVideo,
])

run('ffmpeg', [
  '-y',
  '-hide_banner',
  '-loglevel',
  'warning',
  '-loop',
  '1',
  '-i',
  endCardPng,
  '-f',
  'lavfi',
  '-i',
  'anullsrc=channel_layout=stereo:sample_rate=44100',
  '-t',
  '5',
  '-c:v',
  'libx264',
  '-crf',
  '20',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  '-pix_fmt',
  'yuv420p',
  '-movflags',
  '+faststart',
  endCard,
])

run('ffmpeg', [
  '-y',
  '-hide_banner',
  '-loglevel',
  'warning',
  '-i',
  storyVideo,
  '-i',
  endCard,
  '-filter_complex',
  '[0:v]setpts=PTS-STARTPTS[v0];[0:a]asetpts=PTS-STARTPTS[a0];[1:v]setpts=PTS-STARTPTS[v1];[1:a]asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[vcat][a];[vcat]fps=24,format=yuv420p[v]',
  '-map',
  '[v]',
  '-map',
  '[a]',
  '-c:v',
  'libx264',
  '-crf',
  '22',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
  '-movflags',
  '+faststart',
  finalVideo,
])

run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-ss', '26', '-i', finalVideo, '-frames:v', '1', '-update', '1', poster])
run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'warning', '-i', finalVideo, '-vf', 'fps=1,scale=270:-1,tile=5x6', '-frames:v', '1', '-update', '1', contactSheet])

console.log(`Rendered ${finalVideo}`)
console.log(`Rendered ${poster}`)
console.log(`Rendered ${qr}`)
console.log(`Rendered ${captions}`)
console.log(`Rendered ${contactSheet}`)
