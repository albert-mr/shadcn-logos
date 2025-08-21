import pc from 'picocolors'
import { logger } from './logger.js'

export class EnhancedErrorHandler {
  static handleLogoNotFound(notFound: string[], allLogos: string[]) {
    logger.error(`Logos not found: ${notFound.join(', ')}`)
    
    // Suggest similar logos
    for (const missing of notFound) {
      const suggestions = this.findSimilar(missing, allLogos)
      if (suggestions.length > 0) {
        logger.log(pc.yellow('  Did you mean?'), suggestions.slice(0, 3).map(s => pc.cyan(s)).join(', '))
      }
    }
    
    logger.dim('\n  Use these commands to explore:')
    logger.highlight('    shadcn-logos list')
    logger.highlight('    shadcn-logos search <query>')
    
    return { code: 4, suggestions: notFound.flatMap(n => this.findSimilar(n, allLogos)) }
  }

  static handleNetworkError(error: Error) {
    logger.error('Network error occurred')
    logger.dim(`  ${error.message}`)
    
    logger.dim('\n  Troubleshooting steps:')
    logger.highlight('    1. Check your internet connection')
    logger.highlight('    2. Try again in a few moments')
    logger.highlight('    3. Use cached data: shadcn-logos cache --stats')
    
    return { code: 3, retry: true }
  }

  static handleConfigError(error: Error) {
    logger.error('Configuration error')
    logger.dim(`  ${error.message}`)
    
    logger.dim('\n  Recovery options:')
    logger.highlight('    1. Re-initialize: shadcn-logos init --force')
    logger.highlight('    2. Fix manually: edit logos.config.json')
    logger.highlight('    3. Use defaults: shadcn-logos init -y')
    
    return { code: 2, recovery: 'init' }
  }

  static handlePermissionError(error: Error, outputDir: string) {
    logger.error('Permission denied')
    logger.dim(`  Cannot write to: ${outputDir}`)
    
    logger.dim('\n  Solutions:')
    logger.highlight(`    1. Run with elevated permissions`)
    logger.highlight(`    2. Change output directory in config`)
    logger.highlight(`    3. Fix permissions: chmod 755 ${outputDir}`)
    
    return { code: 5, outputDir }
  }

  static handleGenericError(error: Error, context?: string) {
    logger.error(context ? `Error in ${context}` : 'An error occurred')
    logger.dim(`  ${error.message}`)
    
    if (error.stack && process.env.DEBUG) {
      logger.dim('\n  Stack trace:')
      logger.dim(error.stack)
    }
    
    logger.dim('\n  Get help:')
    logger.highlight('    shadcn-logos --help')
    logger.highlight('    Report issue: https://github.com/yourusername/shadcn-logos/issues')
    
    return { code: 1, error }
  }

  private static findSimilar(target: string, candidates: string[]): string[] {
    return candidates
      .map(candidate => ({
        name: candidate,
        distance: this.levenshteinDistance(target.toLowerCase(), candidate.toLowerCase())
      }))
      .filter(({ distance }) => distance <= 3)
      .sort((a, b) => a.distance - b.distance)
      .map(({ name }) => name)
      .slice(0, 5) // Limit suggestions
  }

  private static levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []
    const len1 = str1.length
    const len2 = str2.length

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[len2][len1]
  }
}

export enum ExitCode {
  SUCCESS = 0,
  GENERAL_ERROR = 1,
  CONFIG_ERROR = 2,
  NETWORK_ERROR = 3,
  NOT_FOUND = 4,
  PERMISSION_ERROR = 5,
}