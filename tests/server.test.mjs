import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createNcmecProvider, createMissingService, createFetchHandler, normalizeNcmec } from '../dist/server.js'
import { countryCode } from '../dist/index.js'

// Synthetic records test failure handling without retaining a child's case data.
const poster = (extra = {}) => ({ organizationCode: 'NCMC', caseNumber: '123', unidentified: false, children: [{ firstName: 'Test', lastName: 'Record', missingCountry: 'United States', missingState: 'OH', missingCity: 'Test city', ageNow: '17', photos: [{ md5: 'a'.repeat(32) }], missingSince: '2026-01-01' }], ...extra })
function harness(options = {}) {
  let time = Date.parse('2026-09-30T12:00:00Z')
  let rows = [poster()]
  let fail = false
  let auths = 0
  let batches = 0
  let photos = 0
  let unauthorized = false
  const requests = []
  const fetch = async (url, init) => {
    requests.push({url, init})
    if (url.endsWith('/Auth/Token')) { auths++; return Response.json({ accessToken: 'synthetic-bearer', expiresIn: 3600 }) }
    if (unauthorized) { unauthorized = false; return new Response(null, { status: 401 }) }
    if (fail) throw new Error('secret-should-never-escape')
    if (url.includes('/Posters?')) { batches++; return Response.json({ posters: rows }) }
    photos++; return new Response(new Uint8Array([0xff,0xd8,0xff]), { headers: { 'content-type': 'image/jpeg' } })
  }
  const provider = createNcmecProvider({ clientId: 'test-id', clientSecret: 'test-secret', fetch, now: () => time, ...options })
  const service = createMissingService({ providers: [provider], now: () => time, random: () => 0 })
  return { provider, service, requests, handler: createFetchHandler(service), advance: ms => time += ms, rows: v => rows = v, fail: () => fail = true, unauthorized: () => unauthorized = true, counts: () => ({ auths, batches, photos }) }
}
test('SSR imports do not access browser globals', async () => { await import('../dist/widget.js'); await import('../dist/react.js') })
test('normalizes UK alias and rejects special/invalid country codes', () => { assert.equal(countryCode(' uk '), 'GB'); assert.equal(countryCode('XX'), null); assert.equal(countryCode('United Kingdom'), null) })
test('all children are preserved and unknown ages are not zero', () => {
  const raw = poster(); raw.children.push({ ...raw.children[0], firstName:'Second', ageNow:'' })
  const rows = normalizeNcmec(raw)
  assert.equal(rows.length, 2); assert.equal(rows[1].ageNow, null); assert.notEqual(rows[0].id, rows[1].id)
  assert.deepEqual(normalizeNcmec(poster({ unidentified:true })), [])
  assert.deepEqual(normalizeNcmec(poster({ organizationCode:'../../evil' })), [])
})
test('GB never falls through to a US child', async () => {
  const h = harness(); const d = await h.service.getAppeal({country:'UK'})
  assert.equal(d.appeal,null); assert.equal(d.reason,'no-local-provider'); assert.equal(d.fallback.url,'https://www.missingpeople.org.uk/appeal-search'); assert.equal(h.counts().auths,0)
})
test('country and region selection returns a declared match', async () => {
  const h=harness(); const d=await h.service.getAppeal({country:'US',region:'OH'})
  assert.equal(d.status,'ok'); assert.equal(d.match,'region'); assert.equal(d.appeal.provider,'ncmec')
  assert.equal((await h.service.getAppeal({country:'US',region:'CA'})).match,'country')
})
test('concurrent fetches coalesce and secrets never enter public responses', async () => {
  const h=harness(); const results=await Promise.all(Array.from({length:25},()=>h.service.getAppeal({country:'US'})))
  assert.equal(h.counts().auths,1); assert.equal(h.counts().batches,1)
  assert.ok(results.every(r=>r.status==='ok'))
  for(const secret of ['test-secret','test-id','synthetic-bearer'])assert.ok(!JSON.stringify(results).includes(secret))
  assert.ok(h.requests.every(r=>r.init.redirect==='error' && r.init.signal))
})
test('withdrawal removes both metadata and photo after bounded cache', async () => {
  const h=harness(); const old=(await h.service.getAppeal({country:'US'})).appeal
  assert.equal((await h.provider.getPhoto(old.photoPath)).status,200)
  h.rows([]);h.advance(60_001)
  assert.equal((await h.service.getAppeal({country:'US'})).appeal,null)
  assert.equal((await h.provider.getPhoto(old.photoPath)).status,404)
  assert.equal(h.counts().photos,1)
})
test('outage never serves an expired backup and errors do not expose inputs', async () => {
  const h=harness(); const old=(await h.service.getAppeal({country:'US'})).appeal
  h.advance(60_001);h.fail()
  const result=await h.service.getAppeal({country:'US'})
  assert.equal(result.appeal,null);assert.equal(result.reason,'provider-unavailable');assert.ok(!JSON.stringify(result).includes('secret'))
  assert.equal((await h.service.photo('ncmec',old.photoPath)).status,503)
})
test('401 refreshes authentication once', async () => { const h=harness();h.unauthorized();assert.equal((await h.service.getAppeal({country:'US'})).status,'ok');assert.equal(h.counts().auths,2) })
test('photo endpoint rejects arbitrary paths and requires current membership', async () => {
  const h=harness();for(const path of ['https://evil.test','../../file','NCMC/123/not-a-hash'])assert.equal((await h.provider.getPhoto(path)).status,400)
  assert.equal((await h.provider.getPhoto(`NCMC/999/${'a'.repeat(32)}`)).status,404)
  assert.equal(h.counts().photos,0)
})
test('wire API has no-store, noindex, validated queries and method restrictions', async () => {
  const h=harness()
  const r=await h.handler(new Request('https://test.local/api/missing-children/appeal?country=US'))
  assert.equal(r.status,200);assert.equal((await r.json()).status,'ok');assert.match(r.headers.get('cache-control'),/no-store/);assert.match(r.headers.get('x-robots-tag'),/noindex/)
  assert.equal((await h.handler(new Request('https://test.local/api/missing-children/appeal?country=garbage'))).status,400)
  assert.equal((await h.handler(new Request('https://test.local/api/missing-children/appeal',{method:'POST'}))).status,405)
  const head=await h.handler(new Request('https://test.local/api/missing-children/appeal?country=US',{method:'HEAD'}));assert.equal(await head.text(),'')
})
test('unconfigured provider produces an explicit usable fallback', async () => { const h=harness({clientSecret:''});const result=await h.service.getAppeal({country:'US'});assert.equal(result.status,'unavailable');assert.ok(result.fallback.url.startsWith('https://'));assert.equal(h.requests.length,0) })
test('deployment whitespace in credentials is removed before authentication', async () => { const h=harness({clientId:' test-id\n',clientSecret:'test-secret\r\n'});await h.service.getAppeal({country:'US'});assert.deepEqual(JSON.parse(h.requests[0].init.body),{clientId:'test-id',clientSecret:'test-secret'}) })
test('a future provider cannot extend freshness or inject unsafe links', async () => {
  const now=Date.now();const appeals=normalizeNcmec(poster(),now)
  const provider={id:'test',countries:['US'],getAppeals:async()=>appeals}
  const service=createMissingService({providers:[provider],now:()=>now})
  assert.equal((await service.getAppeal({country:'US'})).status,'ok')
  appeals[0].officialUrl='javascript:alert(1)';assert.equal((await service.getAppeal({country:'US'})).appeal,null)
  appeals[0].officialUrl='https://example.org';appeals[0].expiresAt=new Date(now+120000).toISOString();assert.equal((await service.getAppeal({country:'US'})).appeal,null)
})
