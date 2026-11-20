import ora from 'ora'
import { existsSync } from 'fs'
import { logger } from '../utils/logger.js'
import { loadConfig } from '../utils/config.js'
import { LogoInstaller } from '../../core/installer.js'
import { toComponentName, sanitizeFileName } from '../../core/naming.js'
import { EnhancedErrorHandler, ExitCode } from '../utils/error-handler.js'
import type { Config, InstallOptions } from '../../types/index.js'

export async function addCommand(logos: string[], options: Partial<InstallOptions> & { colorMode?: Config['style']['colorMode'] }) {
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

  const installer = new LogoInstaller({
    ...config,
    style: { ...config.style, colorMode: options.colorMode ?? config.style.colorMode },
  })
  const installOptions: InstallOptions = {
    logos,
    force: options.force || false,
    dryRun: options.dryRun || false,
    silent: options.silent || false,
    dark: options.dark || false,
    wordmark: options.wordmark || false
  }

  if (installOptions.dryRun) {
    logger.info('Running in dry-run mode...')
  }

  const spinner = ora({
    text: `${installOptions.dryRun ? 'Checking' : 'Installing'} logos...`,
    spinner: 'dots'
  }).start()

  try {
    const installed = await installer.install(installOptions, (done, total, title) => {
      spinner.text = `Installing logos... ${done}/${total} (${title})`
    })

    spinner.succeed(
      installOptions.dryRun
        ? 'Dry run completed successfully'
        : `Successfully installed ${installed.length} logo${installed.length === 1 ? '' : 's'}`
    )

    if (!installOptions.silent) {
      for (const { name, title } of installer.lastApproximate) {
        logger.warn(`"${name}" matched "${title}"`)
      }
    }

    if (installOptions.dryRun) {
      for (const logo of installed) {
        for (const path of installer.targetPaths(logo)) {
          const clash = existsSync(path) && !installOptions.force
          logger.dim(`  ${logo.title} → ${path}${clash ? '  (exists, needs --force)' : ''}`)
        }
      }
    } else {
      if (!installOptions.silent) {
        logger.info('Installed logos:')
        for (const logo of installed) {
          logger.dim(`  ✓ ${logo.title}`)
        }

        const first = installed[0]
        if (first) {
          logger.dim('\nUsage examples:')
          if (config.format !== 'svg' && (config.framework === 'react' || config.framework === 'vue' || config.framework === 'svelte')) {
            const name = toComponentName(first.title)
            const file = sanitizeFileName(first.title)
            if (config.framework === 'react') {
              logger.highlight(`  import { ${name} } from '${config.outputDir}/${file}'`)
              logger.highlight(`  <${name} size={32} />`)
            } else {
              // Vue and Svelte components have a default export and need their extension.
              logger.highlight(`  import ${name} from '${config.outputDir}/${file}.${config.framework}'`)
            }
          } else {
            logger.highlight(`  Check your logos in: ${config.outputDir}`)
          }
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
