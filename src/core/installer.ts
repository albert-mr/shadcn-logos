import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import * as cliProgress from 'cli-progress'
import pc from 'picocolors'
import { svglApi } from './api.js'
import { optimizeSvg } from './svg.js'
import { generateComponent } from './component-generator.js'
import { sanitizeFileName } from './naming.js'
import type { Logo, Config, InstallOptions } from '../types/index.js'

export class LogoInstaller {
  constructor(private config: Config) {}

  async install(options: InstallOptions): Promise<Logo[]> {
    const { found, notFound } = await svglApi.findLogos(options.logos)

    if (notFound.length > 0) {
      const allLogos = await svglApi.getAllLogos()
      const logoNames = allLogos.map((logo) => logo.title)

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
      return found
    }

    const concurrencyLimit = 5

    if (!options.silent) {
      const progressBar = new cliProgress.SingleBar({
        format: `Installing logos |${pc.cyan('{bar}')}| {percentage}% | ETA: {eta}s | {value}/{total} logos | Current: {currentLogo}`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
      })

      progressBar.start(found.length, 0, { currentLogo: 'Starting...' })

      const results = await this.installLogosInBatchesWithProgress(found, options, concurrencyLimit, progressBar)

      progressBar.stop()

      this.throwOnErrors(results)
    } else {
      const results = await this.installLogosInBatches(found, options, concurrencyLimit)
      this.throwOnErrors(results)
    }

    return found
  }

  private throwOnErrors(results: PromiseSettledResult<void>[]): void {
    const errors = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
    if (errors.length > 0) {
      const errorMessages = errors.map((e) => e.reason?.message ?? String(e.reason)).join('\n')
      throw new Error(`Failed to install some logos:\n${errorMessages}`)
    }
  }

  private async installLogosInBatches(
    logos: Logo[],
    options: InstallOptions,
    concurrencyLimit: number,
  ): Promise<PromiseSettledResult<void>[]> {
    const results: PromiseSettledResult<void>[] = []

    for (let i = 0; i < logos.length; i += concurrencyLimit) {
      const batch = logos.slice(i, i + concurrencyLimit)
      const batchPromises = batch.map((logo) => this.installLogo(logo, options))
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  private async installLogosInBatchesWithProgress(
    logos: Logo[],
    options: InstallOptions,
    concurrencyLimit: number,
    progressBar: cliProgress.SingleBar,
  ): Promise<PromiseSettledResult<void>[]> {
    const results: PromiseSettledResult<void>[] = []
    let completed = 0

    for (let i = 0; i < logos.length; i += concurrencyLimit) {
      const batch = logos.slice(i, i + concurrencyLimit)

      const batchPromises = batch.map(async (logo) => {
        progressBar.update(completed, { currentLogo: logo.title })

        try {
          await this.installLogo(logo, options)
          completed++
          progressBar.update(completed, { currentLogo: `✓ ${logo.title}` })
        } catch (error) {
          completed++
          progressBar.update(completed, { currentLogo: `✗ ${logo.title}` })
          throw error
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
      await mkdir(outputDir, { recursive: true })
    }

    if (this.config.format === 'svg' || this.config.format === 'both') {
      await this.installSvgFile(logo, outputDir, options)
    }

    if (this.config.format === 'component' || this.config.format === 'both') {
      await this.installComponent(logo, outputDir, options)
    }
  }

  private logoRoute(logo: Logo): string {
    return typeof logo.route === 'string' ? logo.route : logo.route.light
  }

  private async installSvgFile(logo: Logo, outputDir: string, options: InstallOptions): Promise<void> {
    const svgContent = await svglApi.getLogoSvg(this.logoRoute(logo))
    const optimizedSvg = optimizeSvg(svgContent, { colorMode: this.config.style.colorMode })
    const fileName = `${sanitizeFileName(logo.title)}.svg`
    const filePath = join(outputDir, fileName)

    if (existsSync(filePath) && !options.force) {
      throw new Error(`File ${fileName} already exists. Use --force to overwrite.`)
    }

    await writeFile(filePath, optimizedSvg)
  }

  private async installComponent(logo: Logo, outputDir: string, options: InstallOptions): Promise<void> {
    const svgContent = await svglApi.getLogoSvg(this.logoRoute(logo))
    const componentContent = generateComponent(this.config, logo, svgContent)
    const fileName = `${sanitizeFileName(logo.title)}${this.componentExtension()}`
    const filePath = join(outputDir, fileName)

    if (existsSync(filePath) && !options.force) {
      throw new Error(`Component ${fileName} already exists. Use --force to overwrite.`)
    }

    await writeFile(filePath, componentContent)
  }

  /** Correct file extension per framework (Vue/Svelte have their own, not .tsx/.jsx). */
  private componentExtension(): string {
    switch (this.config.framework) {
      case 'vue':
        return '.vue'
      case 'svelte':
        return '.svelte'
      case 'react':
      default:
        return this.config.typescript ? '.tsx' : '.jsx'
    }
  }
}
