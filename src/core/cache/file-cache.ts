import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import type { Logo, Category } from '../../types/index.js'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  version: string
}

interface CacheStats {
  entries: number
  totalSize: number
  oldestEntry: number
  newestEntry: number
}

export class FileCache {
  private cacheDir: string
  private readonly version = '1.0.0'

  constructor() {
    this.cacheDir = join(homedir(), '.shadcn-logos', 'cache')
    this.ensureCacheDir()
  }

  private ensureCacheDir(): void {
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true })
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const cachePath = join(this.cacheDir, `${this.sanitizeKey(key)}.json`)
    
    if (!existsSync(cachePath)) return null

    try {
      const content = readFileSync(cachePath, 'utf8')
      const entry: CacheEntry<T> = JSON.parse(content)
      
      if (entry.version !== this.version) {
        this.delete(key)
        return null
      }
      
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.delete(key)
        return null
      }
      
      return entry.data
    } catch (error) {
      this.delete(key)
      return null
    }
  }

  async set<T>(key: string, data: T, ttl = 3600000): Promise<void> { // 1 hour default
    this.ensureCacheDir()
    
    const cachePath = join(this.cacheDir, `${this.sanitizeKey(key)}.json`)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: this.version
    }
    
    try {
      writeFileSync(cachePath, JSON.stringify(entry))
    } catch (error) {
      console.warn('Failed to write to cache:', error)
    }
  }

  delete(key: string): void {
    const cachePath = join(this.cacheDir, `${this.sanitizeKey(key)}.json`)
    try {
      if (existsSync(cachePath)) {
        rmSync(cachePath)
      }
    } catch (error) {
      console.warn('Failed to delete cache entry:', error)
    }
  }

  clear(): void {
    try {
      if (existsSync(this.cacheDir)) {
        rmSync(this.cacheDir, { recursive: true, force: true })
      }
      this.ensureCacheDir()
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  stats(): CacheStats {
    const stats: CacheStats = {
      entries: 0,
      totalSize: 0,
      oldestEntry: Date.now(),
      newestEntry: 0
    }

    try {
      if (!existsSync(this.cacheDir)) return stats

      const files = readdirSync(this.cacheDir).filter(f => f.endsWith('.json'))
      stats.entries = files.length

      for (const file of files) {
        const filePath = join(this.cacheDir, file)
        const content = readFileSync(filePath, 'utf8')
        const entry: CacheEntry<any> = JSON.parse(content)
        
        stats.totalSize += content.length
        stats.oldestEntry = Math.min(stats.oldestEntry, entry.timestamp)
        stats.newestEntry = Math.max(stats.newestEntry, entry.timestamp)
      }
    } catch (error) {
      console.warn('Failed to get cache stats:', error)
    }

    return stats
  }

  private sanitizeKey(key: string): string {
    return key.replace(/[^a-zA-Z0-9-_]/g, '_')
  }
}

export const logoCache = new FileCache()