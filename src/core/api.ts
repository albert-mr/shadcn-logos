import type { Logo, Category } from '../types/index.js'
import { logoSchema, categorySchema } from '../types/index.js'
import { logoCache } from './cache/file-cache.js'
import { getLocalLogos, searchLocalLogos, localCategories } from '../../data/logos.js'
import type { LocalLogo } from '../../data/logos.js'
import { findLogosInList, filterByCategory } from './logo-match.js'
import { readFile } from 'fs/promises'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const SVGL_API_BASE = 'https://api.svgl.app'
const CACHE_TTL = 3600000 // 1 hour
const FETCH_TIMEOUT_MS = 15000

const MODULE_DIR = dirname(fileURLToPath(import.meta.url))

/** Local logos use a string id and may omit a url; normalize to the Logo shape
 *  so they combine cleanly with SVGL results. (id is unused for name matching.) */
function normalizeLocalLogo(local: LocalLogo): Logo {
  return {
    id: 0,
    title: local.title,
    category: local.category,
    route: local.route,
    url: local.url ?? '',
    wordmark: local.wordmark,
  }
}

async function request<T>(url: string, read: (response: Response) => Promise<T>): Promise<T> {
  try {
    // The signal stays armed while the body is read, not just until headers arrive.
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    return await read(response)
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s: ${url}`, { cause: error })
    }
    throw error
  }
}

const fetchJson = (url: string): Promise<unknown> => request(url, (r) => r.json())
const fetchText = (url: string): Promise<string> => request(url, (r) => r.text())

/** Keep entries that match the schema; fail clearly if the payload is not a list. */
function parseList<T>(data: unknown, schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, what: string): T[] {
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected response from SVGL: expected a list of ${what}`)
  }
  return data.flatMap((item) => {
    const parsed = schema.safeParse(item)
    return parsed.success ? [parsed.data as T] : []
  })
}

export class SvglApiClient {
  private baseURL: string

  constructor(baseURL = SVGL_API_BASE) {
    this.baseURL = baseURL
  }

  async getAllLogos(): Promise<Logo[]> {
    const cacheKey = 'all-logos'
    
    const cached = await logoCache.get<Logo[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Get local logos first
      const localLogos = getLocalLogos().map(normalizeLocalLogo)

      // Get SVGL logos
      const svglLogos = parseList<Logo>(await fetchJson(this.baseURL), logoSchema, 'logos')
      
      // Combine both sources (local first)
      const allLogos = [...localLogos, ...svglLogos]
      
      await logoCache.set(cacheKey, allLogos, CACHE_TTL)
      return allLogos
    } catch (error) {
      throw new Error(`Failed to fetch logos: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error })
    }
  }

  /** SVGL's /category endpoint is case-sensitive ("ai" 404s), so filter the
   *  cached full list instead. */
  async getLogosByCategory(category: string): Promise<Logo[]> {
    return filterByCategory(await this.getAllLogos(), category)
  }

  async searchLogos(query: string): Promise<Logo[]> {
    try {
      // Search local logos first
      const localResults = searchLocalLogos(query).map(normalizeLocalLogo)
      
      // Search SVGL logos
      const svglResults = parseList<Logo>(await fetchJson(`${this.baseURL}?search=${encodeURIComponent(query)}`), logoSchema, 'logos')
      
      // Combine results (local first)
      return [...localResults, ...svglResults]
    } catch (error) {
      throw new Error(`Failed to search logos for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error })
    }
  }

  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories'
    
    const cached = await logoCache.get<Category[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Get SVGL categories
      const svglCategories = parseList<Category>(await fetchJson(`${this.baseURL}/categories`), categorySchema, 'categories')
      
      // Combine with local categories
      const allCategories = [...localCategories, ...svglCategories]
      
      await logoCache.set(cacheKey, allCategories, CACHE_TTL)
      return allCategories
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error })
    }
  }

  async getLogoSvg(logoRoute: string): Promise<string> {
    try {
      // Bundled/local logo: try known on-disk locations before the network.
      if (!logoRoute.startsWith('http') && !logoRoute.includes('/')) {
        const local = await this.readLocalLogo(logoRoute)
        if (local !== null) return local
      }

      const svgUrl = logoRoute.startsWith('http') ? logoRoute : `${this.baseURL}/svg/${logoRoute}.svg`
      return await fetchText(svgUrl)
    } catch (error) {
      throw new Error(`Failed to fetch SVG for "${logoRoute}": ${error instanceof Error ? error.message : 'Unknown error'}`, { cause: error })
    }
  }

  /**
   * Read a bundled logo SVG from any location it may live at: the user's repo
   * (`./logos`), the bundled package (`dist/../logos`), or the dev tree
   * (`src/core/../../logos`). Returns null if not found locally so the caller
   * falls through to the network. The previous version only looked in
   * `process.cwd()/logos`, so bundled logos were unreachable for end users.
   */
  private async readLocalLogo(name: string): Promise<string | null> {
    const candidates = [
      join(process.cwd(), 'logos', `${name}.svg`),
      join(MODULE_DIR, '..', 'logos', `${name}.svg`),
      join(MODULE_DIR, '..', '..', 'logos', `${name}.svg`),
    ]
    for (const path of candidates) {
      try {
        return await readFile(path, 'utf-8')
      } catch {
        // not here — try the next candidate
      }
    }
    return null
  }

  async findLogos(names: string[]): Promise<ReturnType<typeof findLogosInList>> {
    const allLogos = await this.getAllLogos()
    return findLogosInList(allLogos, names)
  }
}

export const svglApi = new SvglApiClient()