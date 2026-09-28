import type { Logo, Category } from '../types/index.js'
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

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, { signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${FETCH_TIMEOUT_MS / 1000}s: ${url}`, { cause: error })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json() as Promise<T>
}

async function fetchText(url: string): Promise<string> {
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.text()
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
      const svglLogos = await fetchJson<Logo[]>(this.baseURL)
      
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
      const svglResults = await fetchJson<Logo[]>(`${this.baseURL}?search=${encodeURIComponent(query)}`)
      
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
      const svglCategories = await fetchJson<Category[]>(`${this.baseURL}/categories`)
      
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

  async findLogos(names: string[]): Promise<{ found: Logo[]; notFound: string[] }> {
    const allLogos = await this.getAllLogos()
    return findLogosInList(allLogos, names)
  }
}

export const svglApi = new SvglApiClient()