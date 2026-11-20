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
    defaultSize: z.string().regex(/^\d+(\.\d+)?$/, 'must be a number, for example "24"'),
    colorMode: z.enum(['currentColor', 'original']),
    cssVariables: z.boolean()
  }),
  aliases: z.record(z.string(), z.string()).optional(),
  registry: z.object({
    source: z.literal('svgl'),
    cache: z.boolean()
  })
})

export const installOptionsSchema = z.object({
  logos: z.array(z.string()),
  force: z.boolean().optional(),
  dryRun: z.boolean().optional(),
  silent: z.boolean().optional(),
  dark: z.boolean().optional(),
  wordmark: z.boolean().optional()
})

// TypeScript types inferred from schemas
export type Logo = z.infer<typeof logoSchema>
export type Category = z.infer<typeof categorySchema>
export type Config = z.infer<typeof configSchema>
export type InstallOptions = z.infer<typeof installOptionsSchema>

export function isValidConfig(data: unknown): data is Config {
  return configSchema.safeParse(data).success
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