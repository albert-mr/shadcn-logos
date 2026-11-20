import { mkdir, writeFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import { svglApi } from './api.js'
import { optimizeSvg } from './svg.js'
import { generateComponent } from './component-generator.js'
import { sanitizeFileName } from './naming.js'
import { resolveVariant } from './logo-match.js'
import type { Logo, Config, InstallOptions } from '../types/index.js'

export class LogoInstaller {
  /** Names the last `install` call matched only approximately (substring match). */
  lastApproximate: Array<{ name: string; title: string }> = []

  constructor(private config: Config) {}

  async install(
    options: InstallOptions,
    onProgress?: (done: number, total: number, title: string) => void,
  ): Promise<Logo[]> {
    const { found: matched, notFound, approximate } = await svglApi.findLogos(options.logos)
    this.lastApproximate = approximate ?? []

    if (notFound.length > 0) {
      const allLogos = await svglApi.getAllLogos()
      const logoNames = allLogos.map((logo) => logo.title)

      const error = new Error(`Logos not found: ${notFound.join(', ')}`)
      ;(error as any).type = 'NOT_FOUND'
      ;(error as any).notFound = notFound
      ;(error as any).available = logoNames
      throw error
    }

    // Swap in the requested variant's route/title so everything downstream
    // (fetch, file name, component name) works on a plain string route.
    const resolved: Logo[] = []
    const noWordmark: string[] = []
    for (const logo of matched) {
      const variant = resolveVariant(logo, options)
      if (variant) resolved.push({ ...logo, ...variant })
      else noWordmark.push(logo.title)
    }
    if (noWordmark.length > 0) {
      throw new Error(`No wordmark available for: ${noWordmark.join(', ')}`)
    }

    // The same logo requested twice ("react React") is installed once, and
    // distinct logos whose titles map to one file name would overwrite each
    // other, so refuse before anything is written.
    const found: Logo[] = []
    const routes = new Set<string>()
    const byFileName = new Map<string, string[]>()
    for (const logo of resolved) {
      const route = logo.route as string
      if (routes.has(route)) continue
      routes.add(route)
      found.push(logo)
      const fileName = sanitizeFileName(logo.title)
      byFileName.set(fileName, [...(byFileName.get(fileName) ?? []), logo.title])
    }
    for (const [fileName, titles] of byFileName) {
      if (titles.length > 1) {
        throw new Error(
          `These logos would write the same file "${fileName}": ${titles.join(', ')}. Add them in separate commands.`,
        )
      }
    }

    if (options.dryRun) return found

    const concurrencyLimit = 5
    const results = await this.installLogosInBatches(found, options, concurrencyLimit, onProgress)
    this.throwOnErrors(results)

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
    onProgress?: (done: number, total: number, title: string) => void,
  ): Promise<PromiseSettledResult<void>[]> {
    const results: PromiseSettledResult<void>[] = []
    let completed = 0

    for (let i = 0; i < logos.length; i += concurrencyLimit) {
      const batch = logos.slice(i, i + concurrencyLimit)
      const batchPromises = batch.map((logo) =>
        this.installLogo(logo, options).finally(() => onProgress?.(++completed, logos.length, logo.title)),
      )
      const batchResults = await Promise.allSettled(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  /** Paths `install` would write for this logo (same rules as installLogo). */
  targetPaths(logo: Logo): string[] {
    const base = sanitizeFileName(logo.title)
    const raw = this.config.framework === 'raw'
    const paths: string[] = []
    if (raw || this.config.format === 'svg' || this.config.format === 'both') {
      paths.push(join(this.config.outputDir, `${base}.svg`))
    }
    if (!raw && (this.config.format === 'component' || this.config.format === 'both')) {
      paths.push(join(this.config.outputDir, `${base}${this.componentExtension()}`))
    }
    return paths
  }

  private async installLogo(logo: Logo, options: InstallOptions): Promise<void> {
    const outputDir = this.config.outputDir

    if (!existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true })
    }

    // framework "raw" has no component form: always write a plain .svg, once.
    const raw = this.config.framework === 'raw'

    if (raw || this.config.format === 'svg' || this.config.format === 'both') {
      await this.installSvgFile(logo, outputDir, options)
    }

    if (!raw && (this.config.format === 'component' || this.config.format === 'both')) {
      await this.installComponent(logo, outputDir, options)
    }
  }

  private async installSvgFile(logo: Logo, outputDir: string, options: InstallOptions): Promise<void> {
    const svgContent = await svglApi.getLogoSvg(logo.route as string)
    const optimizedSvg = optimizeSvg(svgContent, {
      colorMode: this.config.style.colorMode,
      idPrefix: sanitizeFileName(logo.title),
    })
    const fileName = `${sanitizeFileName(logo.title)}.svg`
    const filePath = join(outputDir, fileName)

    try {
      await writeFile(filePath, optimizedSvg, { flag: options.force ? 'w' : 'wx' })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error(`File ${fileName} already exists. Use --force to overwrite.`, { cause: error })
      }
      throw error
    }
  }

  private async installComponent(logo: Logo, outputDir: string, options: InstallOptions): Promise<void> {
    const svgContent = await svglApi.getLogoSvg(logo.route as string)
    const componentContent = generateComponent(this.config, logo, svgContent, { wordmark: options.wordmark })
    const fileName = `${sanitizeFileName(logo.title)}${this.componentExtension()}`
    const filePath = join(outputDir, fileName)

    try {
      await writeFile(filePath, componentContent, { flag: options.force ? 'w' : 'wx' })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new Error(`Component ${fileName} already exists. Use --force to overwrite.`, { cause: error })
      }
      throw error
    }
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
