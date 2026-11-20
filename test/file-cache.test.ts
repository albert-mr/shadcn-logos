import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { FileCache } from '../src/core/cache/file-cache.js'

let dir: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-cache-'))
  process.env.SHADCN_LOGOS_CACHE_DIR = dir
})
afterEach(() => {
  delete process.env.SHADCN_LOGOS_CACHE_DIR
  vi.restoreAllMocks()
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('FileCache', () => {
  it('does not create the cache directory on construction', () => {
    const sub = path.join(dir, 'sub')
    process.env.SHADCN_LOGOS_CACHE_DIR = sub
    new FileCache()
    expect(fs.existsSync(sub)).toBe(false)
  })

  it('round-trips a value through set and get', async () => {
    const cache = new FileCache()
    await cache.set('k', { a: 1 })
    expect(await cache.get('k')).toEqual({ a: 1 })
  })

  it('treats an expired entry as missing', async () => {
    const cache = new FileCache()
    await cache.set('k', 1, -1)
    expect(await cache.get('k')).toBeNull()
  })

  it('returns null for a corrupt file and skips it in stats', async () => {
    const cache = new FileCache()
    fs.writeFileSync(path.join(dir, 'bad.json'), 'not json')
    await cache.set('good', 1)
    expect(cache.stats().entries).toBe(1)
    expect(await cache.get('bad')).toBeNull()
  })

  it('does not throw when the cache location is unwritable', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    fs.writeFileSync(path.join(dir, 'f'), '')
    process.env.SHADCN_LOGOS_CACHE_DIR = path.join(dir, 'f', 'cache')
    const cache = new FileCache()
    await expect(cache.set('k', 1)).resolves.toBeUndefined()
  })
})
