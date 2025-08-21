#!/usr/bin/env node

import { Command } from 'commander'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { initCommand } from './commands/init.js'
import { addCommand } from './commands/add.js'
import { listCommand } from './commands/list.js'
import { searchCommand } from './commands/search.js'
import { cacheCommand } from './commands/cache.js'
import { EnhancedErrorHandler, ExitCode } from './utils/error-handler.js'
import { logger } from './utils/logger.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getPackageInfo() {
  try {
    const packageJsonPath = join(__dirname, '../../package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description
    }
  } catch {
    return {
      name: 'shadcn-logos',
      version: '0.1.0',
      description: 'A CLI tool for adding company logos to your projects'
    }
  }
}

async function main() {
  const packageInfo = getPackageInfo()
  
  const program = new Command()
    .name(packageInfo.name)
    .description(packageInfo.description)
    .version(packageInfo.version)

  // Main commands
  program
    .command('init')
    .alias('i')
    .description('Initialize configuration for your project')
    .option('-y, --yes', 'Skip prompts and use defaults')
    .action(initCommand)

  program
    .command('add')
    .alias('a')
    .description('Add logos to your project')
    .argument('<logos...>', 'Logo names to add')
    .option('-f, --force', 'Overwrite existing files')
    .option('--dry-run', 'Show what would be installed without making changes')
    .option('-s, --silent', 'Minimal output')
    .action(addCommand)

  program
    .command('list')
    .alias('ls')
    .description('List available logos')
    .option('-c, --category <category>', 'Filter by category')
    .option('-s, --search <query>', 'Search logos by name')
    .option('--limit <number>', 'Limit number of results', '50')
    .action(listCommand)

  program
    .command('search')
    .alias('s')
    .description('Search for logos by name')
    .argument('<query>', 'Search query')
    .action(searchCommand)

  program
    .command('cache')
    .description('Manage cache')
    .option('--clear', 'Clear all cached data')
    .option('--stats', 'Show cache statistics')
    .action(cacheCommand)

  // Global options
  program
    .option('--no-cache', 'Disable caching for this command')
    .option('--verbose', 'Enable verbose output')
    .option('-C, --config <path>', 'Specify config file path')

  // Global error handler
  process.on('uncaughtException', (error: Error) => {
    const result = EnhancedErrorHandler.handleGenericError(error, 'uncaught exception')
    process.exit(result.code)
  })

  process.on('unhandledRejection', (reason: any) => {
    const error = reason instanceof Error ? reason : new Error(String(reason))
    const result = EnhancedErrorHandler.handleGenericError(error, 'unhandled rejection')
    process.exit(result.code)
  })

  // Handle SIGINT (Ctrl+C) gracefully
  process.on('SIGINT', () => {
    logger.dim('\n\nOperation cancelled by user')
    process.exit(130) // Standard exit code for Ctrl+C
  })

  try {
    await program.parseAsync(process.argv)
    process.exit(ExitCode.SUCCESS)
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('config')) {
        const result = EnhancedErrorHandler.handleConfigError(error)
        process.exit(result.code)
      } else {
        const result = EnhancedErrorHandler.handleGenericError(error, 'CLI execution')
        process.exit(result.code)
      }
    } else {
      const result = EnhancedErrorHandler.handleGenericError(new Error('Unknown error'), 'CLI execution')
      process.exit(result.code)
    }
  }
}

main().catch((error) => {
  const result = EnhancedErrorHandler.handleGenericError(
    error instanceof Error ? error : new Error(String(error)), 
    'main function'
  )
  process.exit(result.code)
})