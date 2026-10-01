// Play on request, with the original narration. Prevent two voices playing together.
const videos = [...document.querySelectorAll('video')]
for (const video of videos) {
  video.addEventListener('play', () => {
    for (const other of videos) if (other !== video) other.pause()
  })
  video.addEventListener('error', () => {
    if (video.nextElementSibling?.classList.contains('video-error')) return
    const message = document.createElement('p')
    message.className = 'video-error'
    message.textContent =
      'Video unavailable here. Use the “Open video” link below to play or download it.'
    video.after(message)
  })
}
