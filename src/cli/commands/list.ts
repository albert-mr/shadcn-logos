import ora from 'ora'
import pc from 'picocolors'
import { logger } from '../utils/logger.js'
import { svglApi } from '../../core/api.js'
import type { Logo, Category } from '../../types/index.js'

interface ListOptions {
  category?: string
  search?: string
  limit: string
}

export async function listCommand(options: ListOptions) {
  const limit = parseInt(options.limit) || 50
  const spinner = ora('Fetching logos...').start()

  try {
    let logos: Logo[] = []
    let categories: Category[] = []

    if (options.search) {
      logos = await svglApi.searchLogos(options.search)
      spinner.succeed(`Found ${logos.length} logos matching "${options.search}"`)
    } else if (options.category) {
      logos = await svglApi.getLogosByCategory(options.category)
      spinner.succeed(`Found ${logos.length} logos in category "${options.category}"`)
    } else {
      [logos, categories] = await Promise.all([
        svglApi.getAllLogos(limit),
        svglApi.getCategories()
      ])
      spinner.succeed(`Showing ${Math.min(logos.length, limit)} of ${logos.length} available logos`)
    }

    if (logos.length === 0) {
      logger.warn('No logos found.')
      return
    }

    if (!options.search && !options.category) {
      logger.info('\n📁 Categories:')
      const sortedCategories = categories.sort((a, b) => b.total - a.total)
      
      for (const category of sortedCategories.slice(0, 10)) {
        logger.dim(`  ${category.category} (${category.total})`)
      }
      
      if (categories.length > 10) {
        logger.dim(`  ... and ${categories.length - 10} more`)
      }
      
      logger.dim('\nUse --category <name> to filter by category')
    }

    logger.info('\n🎨 Available logos:')
    
    const displayLogos = logos.slice(0, limit)
    const groupedByCategory = groupLogosByCategory(displayLogos)
    
    for (const [category, categoryLogos] of Object.entries(groupedByCategory)) {
      if (!options.category && !options.search) {
        logger.log(`\n${pc.bold(pc.cyan(category))}:`)
      }
      
      for (const logo of categoryLogos) {
        const hasVariants = typeof logo.route === 'object'
        const variantInfo = hasVariants ? pc.gray(' (light/dark)') : ''
        const url = logo.url ? pc.gray(` - ${logo.url}`) : ''
        
        logger.log(`  ${pc.green('✓')} ${pc.bold(logo.title)}${variantInfo}${url}`)
      }
    }

    if (logos.length > limit) {
      logger.dim(`\n... and ${logos.length - limit} more logos`)
      logger.dim(`Use --limit ${logos.length} to see all results`)
    }

    logger.dim('\n💡 Usage:')
    logger.highlight('  shadcn-logos add vercel github')
    logger.highlight('  shadcn-logos search database')
    logger.highlight('  shadcn-logos list --category ai')

  } catch (error) {
    spinner.fail('Failed to fetch logos')
    logger.error(error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}

function groupLogosByCategory(logos: Logo[]): Record<string, Logo[]> {
  return logos.reduce((groups, logo) => {
    const category = logo.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category]!.push(logo)
    return groups
  }, {} as Record<string, Logo[]>)
}