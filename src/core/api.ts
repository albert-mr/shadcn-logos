import type { Logo, Category } from '../types/index.js'
import { logoCache } from './cache/file-cache.js'
import { getLocalLogos, searchLocalLogos, getLocalLogosByCategory, localCategories } from '../../data/logos.js'
import { readFile } from 'fs/promises'
import { join } from 'path'

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
      // Get local logos first
      const localLogos = getLocalLogos()
      
      // Get SVGL logos
      const url = limit ? `${this.baseURL}?limit=${limit}` : this.baseURL
      const svglLogos = await fetchJson<Logo[]>(url)
      
      // Combine both sources (local first)
      const allLogos = [...localLogos, ...svglLogos]
      
      await logoCache.set(cacheKey, allLogos, CACHE_TTL)
      return allLogos
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
      // Get local logos for this category
      const localLogos = getLocalLogosByCategory(category)
      
      // Get SVGL logos for this category
      const svglLogos = await fetchJson<Logo[]>(`${this.baseURL}/category/${encodeURIComponent(category)}`)
      
      // Combine both sources
      const allLogos = [...localLogos, ...svglLogos]
      
      await logoCache.set(cacheKey, allLogos, CACHE_TTL)
      return allLogos
    } catch (error) {
      throw new Error(`Failed to fetch logos for category "${category}": ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async searchLogos(query: string): Promise<Logo[]> {
    try {
      // Search local logos first
      const localResults = searchLocalLogos(query)
      
      // Search SVGL logos
      const svglResults = await fetchJson<Logo[]>(`${this.baseURL}?search=${encodeURIComponent(query)}`)
      
      // Combine results (local first)
      return [...localResults, ...svglResults]
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
      // Get SVGL categories
      const svglCategories = await fetchJson<Category[]>(`${this.baseURL}/categories`)
      
      // Combine with local categories
      const allCategories = [...localCategories, ...svglCategories]
      
      await logoCache.set(cacheKey, allCategories, CACHE_TTL)
      return allCategories
    } catch (error) {
      throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getLogoSvg(logoRoute: string): Promise<string> {
    try {
      // Check if it's a local logo first
      if (!logoRoute.startsWith('http') && !logoRoute.includes('/')) {
        try {
          const localSvgPath = join(process.cwd(), 'logos', `${logoRoute}.svg`)
          const localSvg = await readFile(localSvgPath, 'utf-8')
          return localSvg
        } catch {
          // Local logo not found, continue to SVGL
        }
      }
      
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