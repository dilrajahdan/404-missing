import type { StoredToken, TokenStore } from './server.js'

type CasOptions = { onlyIfNew: true } | { onlyIfMatch: string }
type BlobStore = {
  get(key: string, options: { type: 'json'; consistency: 'strong' }): Promise<unknown>
  getWithMetadata(key: string, options: { type: 'json'; consistency: 'strong' }): Promise<{ data: unknown; etag?: string } | null>
  setJSON(key: string, value: unknown, options?: CasOptions): Promise<{ modified: boolean; etag?: string }>
}

/** Pass a private, site-wide Netlify getStore, not a deploy store or a public URL. */
export function createNetlifyTokenStore(store: BlobStore, key = 'ncmec-token-v1'): TokenStore {
  return {
    async read() { return await store.get(key, { type: 'json', consistency: 'strong' }) as StoredToken | null },
    async write(value) { await store.setJSON(key, value) },
    async withLock(operation) {
      const lock = `${key}-lock`
      const deadline = Date.now() + 10_000
      while (Date.now() < deadline) {
        const old = await store.getWithMetadata(lock, { type: 'json', consistency: 'strong' })
        if (old && !old.etag) throw new Error('Token store metadata unavailable')
        const until = old && typeof old.data === 'object' && old.data !== null ? Number((old.data as { until?: number }).until) : 0
        if (until <= Date.now()) {
          const acquired = await store.setJSON(lock, { until: Date.now() + 60_000 }, old ? { onlyIfMatch: old.etag! } : { onlyIfNew: true })
          if (acquired.modified && acquired.etag) {
            try { return await operation() }
            finally { await store.setJSON(lock, { until: 0 }, { onlyIfMatch: acquired.etag }) }
          }
        }
        await new Promise(resolve => setTimeout(resolve, 150))
      }
      throw new Error('Token refresh in progress')
    },
  }
}
