import { logoCache } from '../../core/cache/file-cache.js'
import { logger } from '../utils/logger.js'

interface CacheOptions {
  clear?: boolean
  stats?: boolean
}

export async function cacheCommand(options: CacheOptions) {
  if (options.clear) {
    try {
      logoCache.clear()
      logger.success('Cache cleared successfully')
    } catch (error) {
      logger.error(`Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
    return
  }

  if (options.stats) {
    try {
      const stats = logoCache.stats()
      
      logger.info('📊 Cache Statistics:')
      logger.log(`  Entries: ${stats.entries}`)
      logger.log(`  Total Size: ${(stats.totalSize / 1024).toFixed(2)} KB`)
      
      if (stats.entries > 0) {
        const oldestAge = Math.floor((Date.now() - stats.oldestEntry) / 60000)
        const newestAge = Math.floor((Date.now() - stats.newestEntry) / 60000)
        logger.log(`  Oldest Entry: ${oldestAge} minutes ago`)
        logger.log(`  Newest Entry: ${newestAge} minutes ago`)
      }
    } catch (error) {
      logger.error(`Failed to get cache stats: ${error instanceof Error ? error.message : 'Unknown error'}`)
      process.exit(1)
    }
    return
  }

  logger.info('Cache Management Commands:')
  logger.highlight('  shadcn-logos cache --stats    Show cache statistics')
  logger.highlight('  shadcn-logos cache --clear    Clear all cached data')
}