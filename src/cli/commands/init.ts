import inquirer from 'inquirer'
import { logger } from '../utils/logger.js'
import { EnhancedErrorHandler, ExitCode } from '../utils/error-handler.js'
import { 
  configExists, 
  saveConfig, 
  detectFramework, 
  detectTypeScript,
  DEFAULT_CONFIG
} from '../utils/config.js'
import type { Config } from '../../types/index.js'

interface InitOptions {
  yes?: boolean
}

export async function initCommand(options: InitOptions) {
  logger.info('Initializing shadcn-logos configuration...')

  if (configExists()) {
    logger.warn('Configuration already exists.')
    
    if (!options.yes) {
      const { overwrite } = await inquirer.prompt([{
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite the existing configuration?',
        default: false
      }])

      if (!overwrite) {
        logger.info('Configuration unchanged.')
        return
      }
    }
  }

  let config: Config

  if (options.yes) {
    const detectedFramework = detectFramework()
    const detectedTypeScript = detectTypeScript()

    config = {
      ...DEFAULT_CONFIG,
      framework: detectedFramework,
      typescript: detectedTypeScript
    }

    logger.info(`Auto-detected framework: ${detectedFramework}`)
    logger.info(`Auto-detected TypeScript: ${detectedTypeScript ? 'Yes' : 'No'}`)
  } else {
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'framework',
        message: 'Which framework are you using?',
        choices: [
          { name: 'React', value: 'react' },
          { name: 'Vue', value: 'vue' },
          { name: 'Svelte', value: 'svelte' },
          { name: 'Raw SVG files', value: 'raw' }
        ],
        default: detectFramework()
      },
      {
        type: 'confirm',
        name: 'typescript',
        message: 'Are you using TypeScript?',
        default: detectTypeScript()
      },
      {
        type: 'input',
        name: 'outputDir',
        message: 'Where should we install the logos?',
        default: (answers: any) => {
          switch (answers.framework) {
            case 'react':
            case 'vue':
            case 'svelte':
              return './src/components/logos'
            case 'raw':
              return './assets/logos'
            default:
              return './src/components/logos'
          }
        }
      },
      {
        type: 'list',
        name: 'format',
        message: 'What format do you prefer?',
        choices: [
          { name: 'Components (recommended for frameworks)', value: 'component' },
          { name: 'SVG files only', value: 'svg' },
          { name: 'Both components and SVG files', value: 'both' }
        ],
        default: (answers: any) => answers.framework === 'raw' ? 'svg' : 'component'
      },
      {
        type: 'input',
        name: 'defaultSize',
        message: 'Default logo size (in pixels)?',
        default: '24',
        validate: (input: string) => {
          const num = parseInt(input)
          if (isNaN(num) || num <= 0) {
            return 'Please enter a valid positive number'
          }
          return true
        }
      },
      {
        type: 'list',
        name: 'colorMode',
        message: 'How should logo colors be handled?',
        choices: [
          { name: 'Use current text color (currentColor)', value: 'currentColor' },
          { name: 'Keep original colors', value: 'original' }
        ],
        default: 'currentColor'
      }
    ])

    config = {
      framework: answers.framework,
      typescript: answers.typescript,
      outputDir: answers.outputDir,
      format: answers.format,
      style: {
        defaultSize: answers.defaultSize,
        colorMode: answers.colorMode,
        cssVariables: true
      },
      registry: {
        source: 'svgl',
        cache: true
      }
    }
  }

  try {
    saveConfig(config)
    logger.success('Configuration saved to logos.config.json')
    
    logger.dim('\nYou can now add logos to your project:')
    logger.highlight('  shadcn-logos add vercel github')
    logger.highlight('  shadcn-logos list --category ai')
    logger.highlight('  shadcn-logos search database')
  } catch (error) {
    const result = EnhancedErrorHandler.handleConfigError(
      error instanceof Error ? error : new Error('Unknown error')
    )
    process.exit(result.code)
  }
}