import { countryCode, directoryFor, type AppealResult } from './index.js'

const styles = `
:host{display:block;color:var(--missing-ink,#202622);font:400 16px/1.5 var(--missing-font,system-ui,sans-serif);text-align:left}
*{box-sizing:border-box}section{background:var(--missing-surface,#f7f8f4);border:1px solid var(--missing-border,#d3d9cf);border-radius:var(--missing-radius,12px);padding:24px;max-width:680px;margin:auto}
h2{font-size:clamp(22px,4vw,28px);line-height:1.2;letter-spacing:-.025em;margin:0 0 10px;font-weight:650}h3{font-size:24px;line-height:1.2;margin:0 0 8px;overflow-wrap:anywhere}p{margin:8px 0}small{display:block;font-size:12px;margin-top:16px;color:inherit}
.eyebrow{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:0 0 12px}.body{display:grid;gap:18px;margin:20px 0}.photo{width:100%;max-height:280px;object-fit:contain;object-position:left;background:var(--missing-photo-surface,#e9ece5);border-radius:4px}.details{min-width:0}.meta{font-size:14px}.source{font-size:12px;overflow-wrap:anywhere}
a{color:inherit;text-underline-offset:4px}a:hover{text-decoration-thickness:2px}.action{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:10px 16px;background:var(--missing-action,#263c2d);color:var(--missing-action-ink,#fff);border-radius:4px;font-weight:650;text-decoration:none;line-height:1.4}
a:focus-visible,select:focus-visible{outline:3px solid var(--missing-focus,#348958);outline-offset:4px}label{display:flex;gap:12px;align-items:center;font-size:14px;border-top:1px solid var(--missing-border,#d3d9cf);margin-top:20px;padding-top:16px}select{min-height:44px;max-width:100%;flex:1;border:1px solid var(--missing-border,#d3d9cf);border-radius:4px;padding:8px;color:inherit;background:var(--missing-surface,#f7f8f4);font:inherit}.status{font-size:14px;min-height:21px}.directory{display:inline-flex;align-items:center;min-height:44px;font-size:14px}.note{font-size:12px;opacity:.85}
@media(min-width:520px){.body{grid-template-columns:180px minmax(0,1fr)}.body.no-photo{grid-template-columns:1fr}.photo{max-height:240px}section{padding:32px}}
@media(max-width:519px){section{padding:20px}.photo{max-height:250px}.action{width:100%}}
`

/** Explicit registration makes this module safe to import during SSR. */
export function registerMissingChild(tagName = 'missing-child'): void {
  if (typeof window === 'undefined' || !window.customElements || window.customElements.get(tagName)) return
  class MissingChildElement extends HTMLElement {
    static observedAttributes = ['endpoint', 'country', 'region']
    private root = this.attachShadow({ mode: 'open' })
    private abort?: AbortController
    private timer?: ReturnType<typeof setTimeout>
    private generation = 0
    private result: AppealResult | null = null
    private status!: HTMLParagraphElement
    private body!: HTMLDivElement
    private directory!: HTMLAnchorElement
    private select!: HTMLSelectElement
    private start = () => { if (document.visibilityState !== 'hidden') void this.refresh() }
    private hide = () => { this.clearAppeal(); this.abort?.abort(); clearTimeout(this.timer) }

    connectedCallback() {
      this.root.replaceChildren()
      const style = document.createElement('style'); style.textContent = styles
      const section = document.createElement('section'); section.setAttribute('aria-label', 'Missing-child appeals')
      const eyebrow = document.createElement('p'); eyebrow.className = 'eyebrow'; eyebrow.textContent = 'A moment to help'
      const title = document.createElement('h2'); title.textContent = 'Help bring a child home'
      this.status = document.createElement('p'); this.status.className = 'status'; this.status.setAttribute('role', 'status')
      this.body = document.createElement('div')
      this.directory = document.createElement('a'); this.directory.className = 'directory'; this.directory.rel = 'noopener noreferrer'; this.directory.target = '_blank'
      const label = document.createElement('label'); label.append('Show appeals in')
      this.select = document.createElement('select'); this.select.setAttribute('aria-label', 'Appeal country')
      const selected = this.country
      const countries = new Set(['GB', 'US', selected])
      for (const code of countries) { const option = document.createElement('option'); option.value = code; option.textContent = new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code; this.select.append(option) }
      this.select.value = selected
      this.select.addEventListener('change', () => { this.removeAttribute('region'); this.setAttribute('country', this.select.value) })
      label.append(this.select)
      const note = document.createElement('p'); note.className = 'note'; note.textContent = 'Choose an area to see its appeals. No precise location is collected.'
      section.append(eyebrow, title, this.status, this.body, this.directory, label, note)
      this.root.append(style, section)
      document.addEventListener('visibilitychange', this.start)
      window.addEventListener('pageshow', this.start)
      window.addEventListener('pagehide', this.hide)
      void this.refresh()
    }
    disconnectedCallback() {
      this.generation++; this.abort?.abort(); clearTimeout(this.timer)
      document.removeEventListener('visibilitychange', this.start)
      window.removeEventListener('pageshow', this.start)
      window.removeEventListener('pagehide', this.hide)
      this.result = null; this.root.replaceChildren()
    }
    attributeChangedCallback() { if (this.isConnected && this.status) { this.select.value = this.country; void this.refresh() } }
    private get country() { return countryCode(this.getAttribute('country') ?? 'GB') ?? 'GB' }
    private get endpoint() {
      const path = this.getAttribute('endpoint') ?? '/api/missing-children'
      if (!/^\/[a-zA-Z0-9/_-]+$/.test(path) || path.startsWith('//')) throw new Error('Use a same-origin API path')
      return path.replace(/\/$/, '')
    }
    private clearAppeal() {
      this.result = null
      this.body?.replaceChildren()
    }
    private fallback() {
      const link = directoryFor(this.country)
      this.directory.textContent = link.label; this.directory.href = link.url
    }
    private async refresh() {
      const generation = ++this.generation
      this.abort?.abort(); clearTimeout(this.timer); this.clearAppeal(); this.fallback()
      this.status.textContent = 'Checking current appeals…'
      const controller = new AbortController()
      this.abort = controller
      const timeout = setTimeout(() => controller.abort(), 12_000)
      try {
        const query = new URLSearchParams({ country: this.country })
        const region = this.getAttribute('region'); if (region) query.set('region', region)
        const response = await fetch(`${this.endpoint}/appeal?${query}`, { cache: 'no-store', credentials: 'same-origin', signal: this.abort.signal })
        if (!response.ok) throw new Error('Unavailable')
        const data: AppealResult = await response.json()
        if (generation !== this.generation || !this.isConnected) return
        if (data.version !== 1 || data.country !== this.country) throw new Error('Invalid response')
        this.result = data
        if (data.status !== 'ok' || !data.appeal) {
          this.status.textContent = data.reason === 'no-local-provider' ? 'Browse current appeals with the official organisation below.' : 'We cannot show a current appeal right now. You can still help below.'
          return
        }
        const appeal = data.appeal
        const remaining = Date.parse(appeal.expiresAt) - Date.now()
        const url = new URL(appeal.officialUrl)
        if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 60_000 || appeal.location.country !== this.country || url.protocol !== 'https:' || url.username || url.password) throw new Error('Expired or invalid appeal')
        this.renderAppeal()
        this.timer = setTimeout(() => { this.clearAppeal(); this.status.textContent = 'Checking current appeals…'; if (document.visibilityState !== 'hidden') void this.refresh() }, remaining)
      } catch {
        if (generation === this.generation && this.isConnected) { this.clearAppeal(); this.status.textContent = 'We cannot show a current appeal right now. You can still help below.' }
      } finally { clearTimeout(timeout) }
    }
    private renderAppeal() {
      const appeal = this.result?.appeal
      if (!appeal) return
      this.status.textContent = this.result?.match === 'region' ? 'An appeal from your selected region.' : 'An appeal from your selected country.'
      const body = document.createElement('div'); body.className = 'body no-photo'
      if (appeal.photoPath && /^[a-z0-9-]+$/i.test(appeal.provider) && /^[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)*$/.test(appeal.photoPath) && appeal.photoPath.length <= 200) {
        const image = document.createElement('img'); image.className = 'photo'; image.alt = `Official appeal photograph of ${appeal.name}`; image.referrerPolicy = 'no-referrer'
        image.src = `${this.endpoint}/photo/${appeal.provider}/${appeal.photoPath}`
        image.addEventListener('error', () => { image.remove(); body.classList.add('no-photo') })
        body.classList.remove('no-photo'); body.append(image)
      }
      const details = document.createElement('div'); details.className = 'details'
      const name = document.createElement('h3'); name.textContent = appeal.name
      const location = document.createElement('p'); location.className = 'meta'; location.textContent = ['Missing from', [appeal.location.city, appeal.location.region, appeal.location.country].filter(Boolean).join(', ')].join(' ')
      const date = document.createElement('p'); date.className = 'meta'
      const parsed = new Date(appeal.missingSince)
      date.textContent = Number.isNaN(parsed.getTime()) ? '' : `Missing since ${parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}`
      const age = document.createElement('p'); age.className = 'meta'; age.textContent = appeal.ageNow == null ? '' : `Age now: ${appeal.ageNow}`
      const action = document.createElement('a'); action.className = 'action'; action.textContent = 'View official appeal'; action.href = appeal.officialUrl; action.target = '_blank'; action.rel = 'noopener noreferrer'
      const source = document.createElement('p'); source.className = 'source'; source.textContent = `Source: ${appeal.attribution}`
      details.append(name, location, date, age); body.append(details)
      const help = document.createElement('p'); help.className = 'meta'; help.textContent = 'If you have information, use the reporting details on the official appeal.'
      this.body.replaceChildren(body, action, help, source)
    }
  }
  window.customElements.define(tagName, MissingChildElement)
}
