import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { addCommand } from '../src/cli/commands/add.js'
import { DEFAULT_CONFIG, getConfigPath, saveConfig } from '../src/cli/utils/config.js'
import { svglApi } from '../src/core/api.js'

const cwd = process.cwd()
let dir: string

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'logos-add-'))
  process.chdir(dir)
  vi.spyOn(svglApi, 'findLogos').mockResolvedValue({
    found: [{ id: 1, title: 'Example', category: 'Custom', route: 'example', url: '' }],
    notFound: [],
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
