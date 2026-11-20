import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { SvglApiClient } from '../src/core/api.js'

const validLogo = {
  id: 1,
  title: 'Acme',
  category: 'Software',
  route: 'https://svgl.app/library/acme.svg',
  url: 'https://acme.test',
}

let dir: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-api-'))
  process.env.SHADCN_LOGOS_CACHE_DIR = dir
})
afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.SHADCN_LOGOS_CACHE_DIR
  fs.rmSync(dir, { recursive: true, force: true })
})

const client = () => new SvglApiClient('https://example.test')

describe('SvglApiClient', () => {
  it('drops malformed logo entries', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([validLogo, { title: 5 }]))))
    const logos = await client().getAllLogos()
    expect(logos.some((l) => l.title === 'Acme')).toBe(true)
    expect(logos.every((l) => (l.title as unknown) !== 5)).toBe(true)
  })

  it('rejects a payload that is not a list', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'x' }))))
    await expect(client().getAllLogos()).rejects.toThrow(/expected a list/)
  })

  it('rejects a non-OK status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 500, statusText: 'Server Error' })))
    await expect(client().getAllLogos()).rejects.toThrow(/HTTP 500/)
  })

  it('maps a timeout to a clear message', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw Object.assign(new Error('timed out'), { name: 'TimeoutError' })
    }))
    await expect(client().getLogoSvg('https://svgl.app/library/acme.svg')).rejects.toThrow(/timed out after 15s/)
  })
})
