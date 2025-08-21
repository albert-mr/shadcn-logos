import ora from 'ora'
import pc from 'picocolors'
import { logger } from '../utils/logger.js'
import { svglApi } from '../../core/api.js'

export async function searchCommand(query: string) {
  if (!query || query.trim().length === 0) {
    logger.error('Please provide a search query.')
    process.exit(1)
  }

  const spinner = ora(`Searching for "${query}"...`).start()

  try {
    const logos = await svglApi.searchLogos(query)
    
    if (logos.length === 0) {
      spinner.fail(`No logos found for "${query}"`)
      logger.info('Try a different search term or use "shadcn-logos list" to browse all logos.')
      return
    }

    spinner.succeed(`Found ${logos.length} logo${logos.length === 1 ? '' : 's'} matching "${query}"`)

    logger.info('\n🎨 Search results:')
    
    for (const logo of logos) {
      const hasVariants = typeof logo.route === 'object'
      const variantInfo = hasVariants ? pc.gray(' (light/dark)') : ''
      const category = pc.blue(`[${logo.category}]`)
      const url = logo.url ? pc.gray(` - ${logo.url}`) : ''
      
      logger.log(`  ${pc.green('✓')} ${pc.bold(logo.title)} ${category}${variantInfo}${url}`)
    }

    logger.dim('\n💡 Usage:')
    const exampleLogos = logos.slice(0, 3).map(logo => logo.title.toLowerCase().replace(/[^a-z0-9]/g, '-')).join(' ')
    logger.highlight(`  shadcn-logos add ${exampleLogos}`)

  } catch (error) {
    spinner.fail('Search failed')
    logger.error(error instanceof Error ? error.message : 'Unknown error')
    process.exit(1)
  }
}