import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addCommand } from '../src/cli/commands/add.js'
import { DEFAULT_CONFIG, getConfigPath, saveConfig } from '../src/cli/utils/config.js'
import { svglApi } from '../src/core/api.js'
import { LogoInstaller } from '../src/core/installer.js'

const cwd = process.cwd()
let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'logos-add-'))
  process.chdir(dir)
  vi.spyOn(svglApi, 'findLogos').mockResolvedValue({
    found: [{ id: 1, title: 'Example', category: 'Custom', route: 'example', url: '' }],
    notFound: [],
    approximate: [],
  })
  vi.spyOn(svglApi, 'getLogoSvg').mockResolvedValue(
    '<svg viewBox="0 0 24 24"><path fill="#ff0000" d="M2 2h20v20H2z"/></svg>',
  )
})

afterEach(() => {
  process.chdir(cwd)
  vi.restoreAllMocks()
  rmSync(dir, { recursive: true, force: true })
})

it.each(['original', 'currentColor'] as const)('applies --color-mode %s to SVGs and components without saving it', async (colorMode) => {
  saveConfig({
    ...DEFAULT_CONFIG,
    outputDir: './out',
    format: 'both',
    style: { ...DEFAULT_CONFIG.style, colorMode: colorMode === 'original' ? 'currentColor' : 'original' },
  })
  const saved = readFileSync(getConfigPath(), 'utf8')

  await addCommand(['example'], { silent: true, colorMode })

  for (const extension of ['svg', 'tsx']) {
    const output = readFileSync(join(dir, 'out', `example.${extension}`), 'utf8')
    expect(output).toContain(colorMode === 'original' ? 'fill="red"' : 'fill="currentColor"')
  }
  expect(readFileSync(getConfigPath(), 'utf8')).toBe(saved)
})

// Console output of an addCommand run (the spy is restored in afterEach).
const output = async (logos: string[], options: Parameters<typeof addCommand>[1]) => {
  const log = vi.spyOn(console, 'log').mockImplementation(() => {})
  await addCommand(logos, options)
  const text = log.mock.calls.flat().join('\n')
  log.mockRestore()
  return text
}

it('dry run lists files and writes nothing', async () => {
  saveConfig({ ...DEFAULT_CONFIG, outputDir: './out', format: 'both' })

  const text = await output(['example'], { dryRun: true })

  expect(text).toContain('example.svg')
  expect(text).toContain('example.tsx')
  expect(existsSync(join(dir, 'out'))).toBe(false)
})

it('dry run flags existing files', async () => {
  saveConfig({ ...DEFAULT_CONFIG, outputDir: './out' })
  await addCommand(['example'], { silent: true })

  expect(await output(['example'], { dryRun: true })).toContain('needs --force')
})

it('Vue usage hint uses a default import', async () => {
  saveConfig({ ...DEFAULT_CONFIG, framework: 'vue', outputDir: './out' })

  expect(await output(['example'], {})).toContain("import ExampleLogo from './out/example.vue'")
})

// Call the installer directly: addCommand calls process.exit on failure.
const installer = () => new LogoInstaller({ ...DEFAULT_CONFIG, outputDir: './out' })
const example = { id: 1, title: 'Example', category: 'Custom', route: 'example', url: '' }

it('installs the same logo requested twice only once', async () => {
  vi.spyOn(svglApi, 'findLogos').mockResolvedValue({ found: [example, example], notFound: [], approximate: [] })

  await expect(installer().install({ logos: ['example', 'Example'], silent: true })).resolves.toHaveLength(1)
  expect(existsSync(join(dir, 'out', 'example.tsx'))).toBe(true)
})

it('refuses logos that would write the same file, before writing anything', async () => {
  vi.spyOn(svglApi, 'findLogos').mockResolvedValue({
    found: [
      { id: 1, title: 'A.B', category: 'Custom', route: 'r1', url: '' },
      { id: 2, title: 'A-B', category: 'Custom', route: 'r2', url: '' },
    ],
    notFound: [],
    approximate: [],
  })

  await expect(installer().install({ logos: ['A.B', 'A-B'], silent: true })).rejects.toThrow(
    'would write the same file',
  )
  expect(existsSync(join(dir, 'out'))).toBe(false)
})

it('refuses to overwrite an existing file unless forced', async () => {
  await installer().install({ logos: ['example'], silent: true })

  await expect(installer().install({ logos: ['example'], silent: true })).rejects.toThrow('already exists')
  await expect(installer().install({ logos: ['example'], silent: true, force: true })).resolves.toHaveLength(1)
})

it.skipIf(process.platform === 'win32')('accepts --color-mode without forcing ANSI into piped logs', () => {
  // A config error exercises CLI parsing and the real logger without a network call.
  writeFileSync(getConfigPath(), '{ invalid')
  const env = { ...process.env }
  for (const key of ['FORCE_COLOR', 'NO_COLOR', 'CI']) delete env[key]
  const result = spawnSync(process.execPath, [
    '--import', import.meta.resolve('tsx'), join(cwd, 'src/cli/index.ts'),
    'add', 'vercel', '--color-mode', 'original',
  ], { cwd: dir, env, encoding: 'utf8', timeout: 10000 })

  expect(result.status).toBe(2)
  expect(result.stdout).toContain('Configuration error')
  expect(result.stdout + result.stderr).not.toContain('\u001b[')
})
