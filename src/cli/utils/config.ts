import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { configSchema, type Config, ConfigurationError, isValidConfig } from '../../types/index.js'

export const DEFAULT_CONFIG: Config = {
  framework: 'react',
  typescript: true,
  outputDir: './src/components/logos',
  format: 'component',
  style: {
    defaultSize: '24',
    colorMode: 'currentColor',
    cssVariables: true
  },
  registry: {
    source: 'svgl',
    cache: true
  }
}

export function getConfigPath(cwd: string = process.cwd()): string {
  return join(cwd, 'logos.config.json')
}

export function configExists(cwd: string = process.cwd()): boolean {
  return existsSync(getConfigPath(cwd))
}

export function loadConfig(cwd: string = process.cwd()): Config {
  const configPath = getConfigPath(cwd)
  
  if (!existsSync(configPath)) {
    throw new ConfigurationError(
      'Configuration file not found. Run "shadcn-logos init" first.',
      configPath
    )
  }

  try {
    const configContent = readFileSync(configPath, 'utf8')
    const rawConfig = JSON.parse(configContent)
    
    if (!isValidConfig(rawConfig)) {
      const validation = configSchema.safeParse(rawConfig)
      if (!validation.success) {
        const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        throw new ConfigurationError(`Invalid configuration: ${errors}`, configPath)
      }
    }
    
    return rawConfig as Config
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error
    }
    if (error instanceof SyntaxError) {
      throw new ConfigurationError(`Invalid JSON in configuration file: ${error.message}`, configPath)
    }
    throw new ConfigurationError(
      `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      configPath
    )
  }
}

export function saveConfig(config: Config, cwd: string = process.cwd()): void {
  const configPath = getConfigPath(cwd)
  
  try {
    if (!isValidConfig(config)) {
      const validation = configSchema.safeParse(config)
      if (!validation.success) {
        const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        throw new ConfigurationError(`Invalid configuration: ${errors}`, configPath)
      }
    }
    
    writeFileSync(configPath, JSON.stringify(config, null, 2))
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error
    }
    throw new ConfigurationError(
      `Failed to save configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
      configPath
    )
  }
}

export function detectFramework(cwd: string = process.cwd()): Config['framework'] {
  const packageJsonPath = join(cwd, 'package.json')
  
  if (!existsSync(packageJsonPath)) {
    return 'raw'
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }

    if (dependencies.react || dependencies['@types/react']) {
      return 'react'
    }
    if (dependencies.vue || dependencies['@vue/cli-service']) {
      return 'vue'
    }
    if (dependencies.svelte || dependencies['@sveltejs/kit']) {
      return 'svelte'
    }

    return 'raw'
  } catch {
    return 'raw'
  }
}

export function detectTypeScript(cwd: string = process.cwd()): boolean {
  const tsconfigPath = join(cwd, 'tsconfig.json')
  const packageJsonPath = join(cwd, 'package.json')
  
  if (existsSync(tsconfigPath)) {
    return true
  }

  if (existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      }
      return Boolean(dependencies.typescript || dependencies['@types/node'])
    } catch {
      return false
    }
  }

  return false
}