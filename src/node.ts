import { mkdir, readFile, writeFile, rename, open, unlink, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { TokenStore, StoredToken } from './server.js'

/** Private on-disk token store for a Node server. Use an absolute path outside public/build directories. */
export function createFileTokenStore(filename: string): TokenStore {
  const file = resolve(filename)
  const lock = `${file}.lock`
  return {
    async read() {
      try { return JSON.parse(await readFile(file, 'utf8')) as StoredToken }
      catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null; throw new Error('Token store unavailable') }
    },
    async write(value) {
      await mkdir(dirname(file), { recursive: true, mode: 0o700 })
      const temporary = `${file}.${randomUUID()}.tmp`
      try { await writeFile(temporary, JSON.stringify(value), { mode: 0o600, flag: 'wx' }); await rename(temporary, file) }
      finally { await unlink(temporary).catch(() => {}) }
    },
    async withLock(operation) {
      await mkdir(dirname(file), { recursive: true, mode: 0o700 })
      const deadline = Date.now() + 10_000
      while (Date.now() < deadline) {
        let handle
        try { handle = await open(lock, 'wx', 0o600) }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw new Error('Token store unavailable')
          // Locks are held for one timed authentication request. Recover abandoned locks.
          const existing = await stat(lock).catch(() => null)
          if (existing && Date.now() - existing.mtimeMs > 60_000) await unlink(lock).catch(() => {})
          await new Promise(resolve => setTimeout(resolve, 100))
          continue
        }
        try { return await operation() }
        finally { await handle.close(); await unlink(lock).catch(() => {}) }
      }
      throw new Error('Token refresh in progress')
    },
  }
}
