import { countryCode, directoryFor, type Appeal, type AppealResult, type Area } from './index.js'
export type { Appeal, AppealResult, Area } from './index.js'

const BASE = 'https://posterapi.ncmec.org'
const HEADERS = { 'cache-control': 'no-store, max-age=0', 'x-robots-tag': 'noindex, nofollow', 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' }
const MAX_TTL = 60_000
const text = (x: unknown, max = 200): string => typeof x === 'string' ? x.trim().slice(0, max) : ''
const record = (x: unknown): Record<string, unknown> => x && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : {}
const list = (x: unknown): unknown[] => Array.isArray(x) ? x : []
const safeHttps = (x: string): boolean => { try { const u = new URL(x); return u.protocol === 'https:' && !u.username && !u.password } catch { return false } }

/** Providers are trusted server-side code, not user-supplied URLs. No personal data belongs in logs. */
export type Provider = {
  id: string
  countries: readonly string[]
  getAppeals(area: Area): Promise<Appeal[]>
  getPhoto?(path: string): Promise<Response>
}

export type StoredToken = { accessToken: string; expiresAt: number; retryAfter?: number }
/** Store tokens only, never case data. withLock must serialize across workers. */
export type TokenStore = {
  read(): Promise<StoredToken | null>
  write(token: StoredToken): Promise<void>
  withLock<T>(operation: () => Promise<T>): Promise<T>
}

export function normalizeNcmec(raw: unknown, now = Date.now(), ttl = MAX_TTL): Appeal[] {
  const p = record(raw)
  if (p.unidentified === true) return []
  const org = text(p.organizationCode)
  const caseNumber = String(p.caseNumber ?? '')
  if (!/^[A-Z0-9]{2,12}$/.test(org) || !/^\d{1,20}$/.test(caseNumber)) return []
  return list(p.children).flatMap((value, index) => {
    const c = record(value)
    const name = [text(c.firstName), text(c.middleName), text(c.lastName)].filter(Boolean).join(' ')
    const rawCountry = text(c.missingCountry).toUpperCase()
    const country = ['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(rawCountry) ? 'US' : countryCode(rawCountry)
    if (!name || !country) return []
    const photo = list(c.photos).map(record).find(p => /^[a-f0-9]{32}$/i.test(text(p.md5)))
    const age = c.ageNow === '' || c.ageNow == null ? NaN : Number(c.ageNow)
    return [{
      id: `${org}-${caseNumber}-${index}`, provider: 'ncmec', name,
      ageNow: Number.isFinite(age) && age >= 0 && age <= 130 ? age : null,
      missingSince: text(c.missingSince),
      location: { country, region: text(c.missingState, 80).toUpperCase(), city: text(c.missingCity, 100) },
      officialUrl: `https://www.missingkids.org/poster/${org}/${caseNumber}`,
      photoPath: photo ? `${org}/${caseNumber}/${text(photo.md5)}` : null,
      attribution: 'National Center for Missing & Exploited Children',
      checkedAt: new Date(now).toISOString(), expiresAt: new Date(now + Math.min(ttl, MAX_TTL)).toISOString(),
    }]
  })
}

export function createNcmecProvider(options: { clientId: string; clientSecret: string; tokenStore?: TokenStore; fetch?: typeof fetch; now?: () => number; ttlMs?: number; timeoutMs?: number }): Provider {
  const request = options.fetch ?? fetch
  const now = options.now ?? Date.now
  const ttl = Math.max(1_000, Math.min(options.ttlMs ?? MAX_TTL, MAX_TTL))
  const timeout = Math.max(100, Math.min(options.timeoutMs ?? 6_000, 10_000))
  const clientId = options.clientId.trim()
  const clientSecret = options.clientSecret.trim()
  let token = ''
  let tokenExpiry = 0
  let tokenFlight: Promise<string> | null = null
  let rejectedToken = ''
  let authRetryAfter = 0
  let appeals: Appeal[] = []
  let batchExpiry = 0
  let retryAfter = 0
  let batchFlight: Promise<Appeal[]> | null = null

  async function auth(): Promise<string> {
    if (!clientId || !clientSecret) throw new Error('Provider not configured')
    if (token && tokenExpiry > now()) return token
    if (authRetryAfter > now()) throw new Error('Provider authentication cooling down')
    if (tokenFlight) return tokenFlight
    const getToken = async () => {
      const saved = await options.tokenStore?.read()
      if (saved?.retryAfter && saved.retryAfter > now()) {
        authRetryAfter = saved.retryAfter
        throw new Error('Provider authentication cooling down')
      }
      if (saved && typeof saved.accessToken === 'string' && saved.accessToken !== rejectedToken && Number.isFinite(saved.expiresAt) && saved.expiresAt > now()) {
        token = saved.accessToken; tokenExpiry = saved.expiresAt
        return token
      }
      const start = now()
      const r = await request(`${BASE}/Auth/Token`, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeout), headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId, clientSecret }) })
      if (r.status === 429) {
        const body = record(await r.json().catch(() => ({})))
        const hours = /after ([\d.]+) hour/i.exec(text(body.message, 1000))?.[1]
        const seconds = Number(r.headers.get('retry-after')) || (hours ? Number(hours) * 3600 : 3600)
        authRetryAfter = now() + Math.min(86_400_000, Math.max(60_000, Number.isFinite(seconds) ? seconds * 1000 : 3_600_000))
        await options.tokenStore?.write({ accessToken: '', expiresAt: 0, retryAfter: authRetryAfter })
        throw new Error('Provider authentication cooling down')
      }
      if (!r.ok) throw new Error('Provider authentication unavailable')
      const data = record(await r.json())
      const expiry = Number(data.expiresIn)
      if (!text(data.accessToken, 32_768) || !Number.isFinite(expiry) || expiry <= 0) throw new Error('Invalid provider authentication')
      token = text(data.accessToken, 32_768)
      tokenExpiry = start + Math.max(0, expiry * 1000 - Math.min(60_000, expiry * 100))
      await options.tokenStore?.write({ accessToken: token, expiresAt: tokenExpiry })
      return token
    }
    tokenFlight = options.tokenStore ? options.tokenStore.withLock(getToken) : getToken()
    try { return await tokenFlight } finally { tokenFlight = null }
  }

  async function authorised(path: string): Promise<Response> {
    for (let attempt = 0; attempt < 2; attempt++) {
      const bearer = await auth()
      const r = await request(`${BASE}${path}`, { redirect: 'error', signal: AbortSignal.timeout(timeout), headers: { Authorization: `Bearer ${bearer}` } })
      if (r.status !== 401 || attempt) return r
      rejectedToken = bearer; token = ''; tokenExpiry = 0
      await r.body?.cancel()
    }
    throw new Error('Provider unavailable')
  }

  async function batch(): Promise<Appeal[]> {
    if (batchExpiry > now()) return appeals
    // Never return expired data, including on empty results and upstream outages.
    appeals = []
    if (retryAfter > now()) throw new Error('Provider unavailable')
    if (batchFlight) return batchFlight
    batchFlight = (async () => {
      const started = now()
      try {
        const r = await authorised('/Posters?limit=100')
        if (!r.ok) throw new Error('Provider unavailable')
        const data = record(await r.json())
        if (!Array.isArray(data.posters)) throw new Error('Invalid provider response')
        appeals = data.posters.flatMap(p => normalizeNcmec(p, started, ttl))
        batchExpiry = started + ttl
        return appeals.filter(a => Date.parse(a.expiresAt) > now())
      } catch {
        appeals = []; batchExpiry = 0; retryAfter = now() + 60_000
        throw new Error('Provider unavailable')
      }
    })()
    try { return await batchFlight } finally { batchFlight = null }
  }

  return {
    id: 'ncmec', countries: ['US'],
    async getAppeals() { return batch() },
    async getPhoto(path) {
      if (!/^[A-Z0-9]{2,12}\/\d{1,20}\/[a-f0-9]{32}$/i.test(path)) return new Response(null, { status: 400, headers: HEADERS })
      try {
        // The path must still belong to a current appeal. This is not an open proxy.
        if (!(await batch()).some(a => a.photoPath === path && Date.parse(a.expiresAt) > now())) return new Response(null, { status: 404, headers: HEADERS })
        const [org, id, md5] = path.split('/')
        const r = await authorised(`/Poster/${org}/${id}/Photo/${md5}`)
        const mime = r.headers.get('content-type')?.split(';')[0] ?? ''
        if (!r.ok || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(mime)) { await r.body?.cancel(); return new Response(null, { status: 404, headers: HEADERS }) }
        return new Response(r.body, { headers: { ...HEADERS, 'content-type': mime } })
      } catch { return new Response(null, { status: 503, headers: HEADERS }) }
    },
  }
}

export function createMissingService(options: { providers?: Provider[]; defaultCountry?: string; now?: () => number; random?: () => number }) {
  const providers = options.providers ?? []
  const now = options.now ?? Date.now
  const defaultCountry = countryCode(options.defaultCountry ?? 'GB')
  if (!defaultCountry) throw new Error('Invalid default country')
  return {
    async getAppeal(area: Partial<Area> = {}): Promise<AppealResult> {
      const country = countryCode(area.country ?? defaultCountry!)
      if (!country) throw new Error('Invalid country')
      const region = area.region?.trim().toUpperCase()
      if (region && !/^[\p{L}\p{N} .'-]{1,80}$/u.test(region)) throw new Error('Invalid region')
      const base: AppealResult = { version: 1, status: 'unavailable', country, ...(region ? { region } : {}), match: 'none', appeal: null, fallback: directoryFor(country) }
      const local = providers.filter(p => p.countries.includes(country))
      if (!local.length) return { ...base, reason: 'no-local-provider' }
      let failed = false
      const all = (await Promise.all(local.map(async p => {
        try { return await p.getAppeals({ country, region }) } catch { failed = true; return [] }
      }))).flat().filter(a => a.location.country === country && Date.parse(a.expiresAt) > now() && Date.parse(a.checkedAt) <= now() && Date.parse(a.expiresAt) - Date.parse(a.checkedAt) <= MAX_TTL && safeHttps(a.officialUrl))
      const regional = region ? all.filter(a => a.location.region.toUpperCase() === region) : []
      const candidates = regional.length ? regional : all
      if (!candidates.length) return { ...base, reason: failed ? 'provider-unavailable' : 'no-current-appeal' }
      const index = Math.min(candidates.length - 1, Math.max(0, Math.floor((options.random?.() ?? Math.random()) * candidates.length)))
      return { ...base, status: 'ok', match: regional.length ? 'region' : 'country', appeal: candidates[index]! }
    },
    async photo(provider: string, path: string): Promise<Response> {
      const selected = providers.find(p => p.id === provider)
      if (!selected?.getPhoto) return new Response(null, { status: 404, headers: HEADERS })
      try {
        const r = await selected.getPhoto(path)
        for (const [k,v] of Object.entries(HEADERS)) r.headers.set(k,v)
        return r
      } catch { return new Response(null, { status: 503, headers: HEADERS }) }
    },
  }
}

/** One handler for Nuxt/H3, Next, Astro, Workers or an ordinary Fetch-based server. */
export function createFetchHandler(service: ReturnType<typeof createMissingService>, basePath = '/api/missing-children') {
  if (!/^\/[a-zA-Z0-9/_-]+$/.test(basePath)) throw new Error('Invalid API base path')
  return async (request: Request): Promise<Response> => {
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { ...HEADERS, allow: 'GET, HEAD' } })
    const url = new URL(request.url)
    let response: Response
    if (url.pathname === `${basePath}/appeal`) {
      try {
        const result = await service.getAppeal({ country: url.searchParams.get('country') ?? undefined, region: url.searchParams.get('region') ?? undefined })
        response = Response.json(result, { headers: HEADERS })
      } catch { response = Response.json({ error: 'Invalid area' }, { status: 400, headers: HEADERS }) }
    } else if (url.pathname.startsWith(`${basePath}/photo/`)) {
      const rest = url.pathname.slice(`${basePath}/photo/`.length)
      const slash = rest.indexOf('/')
      response = slash < 1 ? new Response(null, { status: 404, headers: HEADERS }) : await service.photo(rest.slice(0, slash), rest.slice(slash + 1))
    } else response = new Response(null, { status: 404, headers: HEADERS })
    return request.method === 'HEAD' ? new Response(null, { status: response.status, headers: response.headers }) : response
  }
}
