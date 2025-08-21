import { mkdir, writeFile, existsSync } from 'fs'
import { promisify } from 'util'
import { dirname, join } from 'path'
import * as cliProgress from 'cli-progress'
import pc from 'picocolors'
import { svglApi } from './api.js'
import { optimize } from 'svgo'
import type { Logo, Config, InstallOptions } from '../types/index.js'

const mkdirAsync = promisify(mkdir)
const writeFileAsync = promisify(writeFile)

export class LogoInstaller {
  constructor(private config: Config) {}

  async install(options: InstallOptions): Promise<void> {
    const { found, notFound } = await svglApi.findLogos(options.logos)

    if (notFound.length > 0) {
      const allLogos = await svglApi.getAllLogos()
      const logoNames = allLogos.map(logo => logo.title)
      
      const error = new Error(`Logos not found: ${notFound.join(', ')}`)
      ;(error as any).type = 'NOT_FOUND'
      ;(error as any).notFound = notFound
      ;(error as any).available = logoNames
      throw error
    }

    if (options.dryRun) {
      console.log('Dry run - would install:')
      for (const logo of found) {
        console.log(`  - ${logo.title}`)
      }
      return
    }

    const concurrencyLimit = 5
    
    if (!options.silent) {
      const progressBar = new cliProgress.SingleBar({
        format: `Installing logos |${pc.cyan('{bar}')}| {percentage}% | ETA: {eta}s | {value}/{total} logos | Current: {currentLogo}`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      })
      
      progressBar.start(found.length, 0, { currentLogo: 'Starting...' })
      
      const results = await this.installLogosInBatchesWithProgress(found, options, concurrencyLimit, progressBar)
      
      progressBar.stop()
      
      const errors = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
      if (errors.length > 0) {
        const errorMessages = errors.map(e => e.reason.message).join('\n')
        throw new Error(`Failed to install some logos:\n${errorMessages}`)
      }
    } else {
      const results = await this.installLogosInBatches(found, options, concurrencyLimit)
      
      const errors = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[]
      if (errors.length > 0) {
        const errorMessages = errors.map(e => e.reason.message).join('\n')
        throw new Error(`Failed to install some logos:\n${errorMessages}`)
      }
    }
  }

  private async installLogosInBatches(
    logos: Logo[], 
    options: InstallOptions, 
    concurrencyLimit: number
  ): Promise<PromiseSettledResult<void>[]> {
    const results: PromiseSettledResult<void>[] = []
    
    for (let i = 0; i < logos.length; i += concurrencyLimit) {
      const batch = logos.slice(i, i + concurrencyLimit)
      const batchPromises = batch.map(logo => this.installLogo(logo, options))
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  private async installLogosInBatchesWithProgress(
    logos: Logo[], 
    options: InstallOptions, 
    concurrencyLimit: number,
    progressBar: cliProgress.SingleBar
  ): Promise<PromiseSettledResult<void>[]> {
    const results: PromiseSettledResult<void>[] = []
    let completed = 0
    
    for (let i = 0; i < logos.length; i += concurrencyLimit) {
      const batch = logos.slice(i, i + concurrencyLimit)
      
      const batchPromises = batch.map(async (logo, batchIndex) => {
        const globalIndex = i + batchIndex
        progressBar.update(completed, { currentLogo: logo.title })
        
        try {
          await this.installLogo(logo, options)
          completed++
          progressBar.update(completed, { currentLogo: `✓ ${logo.title}` })
          return Promise.resolve()
        } catch (error) {
          completed++
          progressBar.update(completed, { currentLogo: `✗ ${logo.title}` })
          return Promise.reject(error)
        }
      })
      
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults)
    }
    
    return results
  }

  private async installLogo(logo: Logo, options: InstallOptions): Promise<void> {
    const outputDir = this.config.outputDir
    
    if (!existsSync(outputDir)) {
      await mkdirAsync(outputDir, { recursive: true })
    }

    if (this.config.format === 'svg' || this.config.format === 'both') {
      await this.installSvgFile(logo, outputDir, options)
    }

    if (this.config.format === 'component' || this.config.format === 'both') {
      await this.installComponent(logo, outputDir, options)
    }
  }

  private async installSvgFile(logo: Logo, outputDir: string, options: InstallOptions): Promise<void> {
    const route = typeof logo.route === 'string' ? logo.route : logo.route.light
    const svgContent = await svglApi.getLogoSvg(route)
    
    const optimizedSvg = this.optimizeSvg(svgContent)
    const fileName = `${this.sanitizeFileName(logo.title)}.svg`
    const filePath = join(outputDir, fileName)

    if (existsSync(filePath) && !options.force) {
      throw new Error(`File ${fileName} already exists. Use --force to overwrite.`)
    }

    await writeFileAsync(filePath, optimizedSvg)
  }

  private async installComponent(logo: Logo, outputDir: string, options: InstallOptions): Promise<void> {
    const route = typeof logo.route === 'string' ? logo.route : logo.route.light
    const svgContent = await svglApi.getLogoSvg(route)
    
    const componentContent = this.generateComponent(logo, svgContent)
    const extension = this.config.typescript ? '.tsx' : '.jsx'
    const fileName = `${this.sanitizeFileName(logo.title)}${extension}`
    const filePath = join(outputDir, fileName)

    if (existsSync(filePath) && !options.force) {
      throw new Error(`Component ${fileName} already exists. Use --force to overwrite.`)
    }

    await writeFileAsync(filePath, componentContent)
  }

  private optimizeSvg(svgContent: string): string {
    try {
      const result = optimize(svgContent, {
        plugins: [
          'removeDoctype',
          'removeXMLProcInst',
          'removeComments',
          'removeMetadata',
          'removeUselessDefs',
          'removeEditorsNSData',
          'removeEmptyAttrs',
          'removeHiddenElems',
          'removeEmptyText',
          'removeEmptyContainers',
          'cleanupEnableBackground',
          'convertStyleToAttrs',
          'convertColors',
          'convertPathData',
          'convertTransform',
          'removeUnknownsAndDefaults',
          'removeUselessStrokeAndFill',
          'removeUnusedNS',
          'cleanupIDs',
          'cleanupNumericValues',
          'moveElemsAttrsToGroup',
          'moveGroupAttrsToElems',
          'collapseGroups',
          'mergePaths',
          'convertShapeToPath',
          'sortAttrs',
          'removeDimensions'
        ]
      })

      let optimized = result.data

      if (this.config.style.colorMode === 'currentColor') {
        optimized = optimized.replace(/fill="[^"]*"/g, 'fill="currentColor"')
        optimized = optimized.replace(/stroke="[^"]*"/g, 'stroke="currentColor"')
      }

      return optimized
    } catch {
      return svgContent
    }
  }

  private generateComponent(logo: Logo, svgContent: string): string {
    const componentName = this.toComponentName(logo.title)
    const optimizedSvg = this.optimizeSvg(svgContent)

    if (this.config.framework === 'react') {
      return this.generateReactComponent(componentName, optimizedSvg, logo)
    } else if (this.config.framework === 'vue') {
      return this.generateVueComponent(componentName, optimizedSvg, logo)
    } else if (this.config.framework === 'svelte') {
      return this.generateSvelteComponent(componentName, optimizedSvg, logo)
    }

    return svgContent
  }

  private generateReactComponent(componentName: string, svgElement: string, logo: Logo): string {
    const tsInterface = this.config.typescript ? `
interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  size?: string | number
}
` : ''

    const propsType = this.config.typescript ? `: ${componentName}Props` : ''

    const svgWithProps = svgElement
      .replace('<svg', '<svg {...otherProps}')
      .replace(/width="[^"]*"/, 'width={size}')
      .replace(/height="[^"]*"/, 'height={size}')

    return `import React from 'react'

${tsInterface}export function ${componentName}(${this.config.typescript ? `props${propsType}` : 'props'}) {
  const { size = ${this.config.style.defaultSize}, ...otherProps } = props

  return (
    ${svgWithProps}
  )
}

export default ${componentName}
`
  }

  private generateVueComponent(componentName: string, svgElement: string, logo: Logo): string {
    const scriptLang = this.config.typescript ? ' lang="ts"' : ''
    
    return `<template>
  ${svgElement.replace('size={size}', ':width="size" :height="size"').replace('{...props}', 'v-bind="$attrs"')}
</template>

<script${scriptLang}>
import { defineComponent } from 'vue'

export default defineComponent({
  name: '${componentName}',
  props: {
    size: {
      type: [String, Number],
      default: ${this.config.style.defaultSize}
    }
  }
})
</script>
`
  }

  private generateSvelteComponent(componentName: string, svgElement: string, logo: Logo): string {
    const scriptLang = this.config.typescript ? ' lang="ts"' : ''
    
    return `<script${scriptLang}>
  export let size${this.config.typescript ? ': string | number' : ''} = ${this.config.style.defaultSize}
</script>

${svgElement.replace('size={size}', '{size}').replace('{...props}', '{...$$restProps}')}
`
  }

  private sanitizeFileName(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
  }

  private toComponentName(title: string): string {
    return title
      .split(/[^a-zA-Z0-9]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '') + 'Logo'
  }
}