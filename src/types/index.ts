import { z } from 'zod'

// Zod schemas for runtime validation
export const logoSchema = z.object({
  id: z.number(),
  title: z.string(),
  category: z.union([z.string(), z.array(z.string())]),
  route: z.union([
    z.string(),
    z.object({
      light: z.string(),
      dark: z.string()
    })
  ]),
  url: z.string(),
  wordmark: z.union([
    z.string(),
    z.object({
      light: z.string(),
      dark: z.string()
    })
  ]).optional(),
  brandUrl: z.string().optional()
})

export const categorySchema = z.object({
  category: z.string(),
  total: z.number()
})

export const configSchema = z.object({
  $schema: z.string().optional(),
  framework: z.enum(['react', 'vue', 'svelte', 'raw']),
  typescript: z.boolean(),
  outputDir: z.string(),
  format: z.enum(['component', 'svg', 'both']),
  style: z.object({
    defaultSize: z.string(),
    colorMode: z.enum(['currentColor', 'original']),
    cssVariables: z.boolean()
  }),
  aliases: z.record(z.string()).optional(),
  registry: z.object({
    source: z.literal('svgl'),
    cache: z.boolean()
  })
})

export const installOptionsSchema = z.object({
  logos: z.array(z.string()),
  force: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  silent: z.boolean().optional()
})

export const searchResultSchema = z.object({
  logos: z.array(logoSchema),
  total: z.number(),
  query: z.string()
})

// TypeScript types inferred from schemas
export type Logo = z.infer<typeof logoSchema>
export type Category = z.infer<typeof categorySchema>
export type Config = z.infer<typeof configSchema>
export type InstallOptions = z.infer<typeof installOptionsSchema>
export type SearchResult = z.infer<typeof searchResultSchema>

// Utility type guards
export function isValidLogo(data: unknown): data is Logo {
  return logoSchema.safeParse(data).success
}

export function isValidCategory(data: unknown): data is Category {
  return categorySchema.safeParse(data).success
}

export function isValidConfig(data: unknown): data is Config {
  return configSchema.safeParse(data).success
}

export function isValidInstallOptions(data: unknown): data is InstallOptions {
  return installOptionsSchema.safeParse(data).success
}

// Branded types for better type safety
export type LogoName = string & { readonly _brand: 'LogoName' }
export type FilePath = string & { readonly _brand: 'FilePath' }
export type DirectoryPath = string & { readonly _brand: 'DirectoryPath' }

export function createLogoName(name: string): LogoName {
  return name as LogoName
}

export function createFilePath(path: string): FilePath {
  return path as FilePath
}

export function createDirectoryPath(path: string): DirectoryPath {
  return path as DirectoryPath
}

// Custom error types
export class LogoNotFoundError extends Error {
  constructor(
    public readonly logoNames: string[],
    public readonly suggestions: string[] = []
  ) {
    super(`Logos not found: ${logoNames.join(', ')}`)
    this.name = 'LogoNotFoundError'
  }
}

export class ConfigurationError extends Error {
  constructor(
    message: string,
    public readonly configPath?: string
  ) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public readonly url?: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class InstallationError extends Error {
  constructor(
    message: string,
    public readonly logoName?: string,
    public readonly outputPath?: string
  ) {
    super(message)
    this.name = 'InstallationError'
  }
}