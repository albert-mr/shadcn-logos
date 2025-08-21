import ora from 'ora'
import { logger } from '../utils/logger.js'
import { loadConfig } from '../utils/config.js'
import { LogoInstaller } from '../../core/installer.js'
import { EnhancedErrorHandler, ExitCode } from '../utils/error-handler.js'
import type { InstallOptions } from '../../types/index.js'

export async function addCommand(logos: string[], options: Partial<InstallOptions>) {
  if (logos.length === 0) {
    logger.error('Please specify at least one logo to add.')
    logger.highlight('  Example: shadcn-logos add vercel github')
    process.exit(ExitCode.GENERAL_ERROR)
  }

  let config
  try {
    config = loadConfig()
  } catch (error) {
    const result = EnhancedErrorHandler.handleConfigError(
      error instanceof Error ? error : new Error('Failed to load configuration')
    )
    process.exit(result.code)
  }

  const installer = new LogoInstaller(config)
  const installOptions: InstallOptions = {
    logos,
    force: options.force || false,
    dryRun: options.dryRun || false,
    silent: options.silent || false
  }

  if (installOptions.dryRun) {
    logger.info('Running in dry-run mode...')
  }

  const spinner = ora({
    text: `${installOptions.dryRun ? 'Checking' : 'Installing'} logos...`,
    spinner: 'dots'
  }).start()

  try {
    await installer.install(installOptions)
    
    if (installOptions.dryRun) {
      spinner.succeed('Dry run completed successfully')
    } else {
      spinner.succeed(`Successfully installed ${logos.length} logo${logos.length === 1 ? '' : 's'}`)
      
      if (!installOptions.silent) {
        logger.info('Installed logos:')
        for (const logo of logos) {
          logger.dim(`  ✓ ${logo}`)
        }
        
        logger.dim('\nUsage examples:')
        if (config.framework === 'react') {
          const exampleName = logos[0]?.charAt(0).toUpperCase() + logos[0]?.slice(1) + 'Logo'
          logger.highlight(`  import { ${exampleName} } from '${config.outputDir}/${logos[0]}'`)
          logger.highlight(`  <${exampleName} size={32} />`)
        } else if (config.format === 'svg') {
          logger.highlight(`  Check your logos in: ${config.outputDir}`)
        }
      }
    }
  } catch (error) {
    spinner.fail('Installation failed')
    
    if (error instanceof Error) {
      const errorType = (error as any).type
      
      if (errorType === 'NOT_FOUND') {
        const result = EnhancedErrorHandler.handleLogoNotFound(
          (error as any).notFound,
          (error as any).available
        )
        process.exit(result.code)
      } else if (error.message.includes('EACCES') || error.message.includes('permission')) {
        const result = EnhancedErrorHandler.handlePermissionError(error, config.outputDir)
        process.exit(result.code)
      } else if (error.message.includes('fetch') || error.message.includes('network')) {
        const result = EnhancedErrorHandler.handleNetworkError(error)
        process.exit(result.code)
      } else {
        const result = EnhancedErrorHandler.handleGenericError(error, 'logo installation')
        process.exit(result.code)
      }
    } else {
      const result = EnhancedErrorHandler.handleGenericError(new Error('Unknown error'), 'logo installation')
      process.exit(result.code)
    }
  }
}