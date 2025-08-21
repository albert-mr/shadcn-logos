import type { Logo, Category } from '../types/index.js'
import { logoCache } from './cache/file-cache.js'

const SVGL_API_BASE = 'https://api.svgl.app'
const CACHE_TTL = 3600000 // 1 hour

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  return response.json()
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
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

  async getAllLogos(limit?: number): Promise<Logo[]> {
    const cacheKey = `all-logos${limit ? `-${limit}` : ''}`
    
    const cached = await logoCache.get<Logo[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const url = limit ? `${this.baseURL}?limit=${limit}` : this.baseURL
      const data = await fetchJson<Logo[]>(url)
      
      await logoCache.set(cacheKey, data, CACHE_TTL)
      return data
    } catch (error) {
      throw new Error(`Failed to fetch logos: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getLogosByCategory(category: string): Promise<Logo[]> {
    const cacheKey = `category-${category}`
    
    const cached = await logoCache.get<Logo[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await fetchJson<Logo[]>(`${this.baseURL}/category/${encodeURIComponent(category)}`)
      
      await logoCache.set(cacheKey, data, CACHE_TTL)
      return data
    } catch (error) {
      throw new Error(`Failed to fetch logos for category "${category}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async searchLogos(query: string): Promise<Logo[]> {
    try {
      const data = await fetchJson<Logo[]>(`${this.baseURL}?search=${encodeURIComponent(query)}`)
      return data
    } catch (error) {
      throw new Error(`Failed to search logos for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getCategories(): Promise<Category[]> {
    const cacheKey = 'categories'
    
    const cached = await logoCache.get<Category[]>(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const data = await fetchJson<Category[]>(`${this.baseURL}/categories`)
      
      await logoCache.set(cacheKey, data, CACHE_TTL)
      return data
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getLogoSvg(logoRoute: string): Promise<string> {
    try {
      let svgUrl: string
      
      if (logoRoute.startsWith('http')) {
        svgUrl = logoRoute
      } else {
        svgUrl = `${this.baseURL}/svg/${logoRoute}.svg`
      }
      
      const data = await fetchText(svgUrl)
      return data
    } catch (error) {
      throw new Error(`Failed to fetch SVG for "${logoRoute}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async findLogos(names: string[]): Promise<{ found: Logo[]; notFound: string[] }> {
    const allLogos = await this.getAllLogos()
    const found: Logo[] = []
    const notFound: string[] = []

    for (const name of names) {
      const nameLower = name.toLowerCase()
      
      const exactMatch = allLogos.find(logo => 
        logo.title.toLowerCase() === nameLower
      )
      
      const cleanMatch = !exactMatch ? allLogos.find(logo => 
        logo.title.toLowerCase().replace(/[^a-z0-9]/g, '') === nameLower.replace(/[^a-z0-9]/g, '')
      ) : null
      
      const partialMatch = !exactMatch && !cleanMatch ? allLogos.find(logo => 
        logo.title.toLowerCase().includes(nameLower)
      ) : null
      
      const logo = exactMatch || cleanMatch || partialMatch
      
      if (logo) {
        found.push(logo)
      } else {
        notFound.push(name)
      }
    }

    return { found, notFound }
  }
}

export const svglApi = new SvglApiClient()