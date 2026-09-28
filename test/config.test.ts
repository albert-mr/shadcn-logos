import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import {
  DEFAULT_CONFIG,
  loadConfig,
  saveConfig,
  configExists,
  getConfigPath,
  detectFramework,
  detectTypeScript,
} from '../src/cli/utils/config.js'
import { isValidConfig } from '../src/types/index.js'

let dir: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'logos-cfg-'))
})
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true })
})

describe('config load/save', () => {
  it('DEFAULT_CONFIG passes schema validation', () => {
    expect(isValidConfig(DEFAULT_CONFIG)).toBe(true)
  })
  it('uses raw SVG defaults without config or a framework', () => {
    expect(loadConfig(dir)).toMatchObject({
      framework: 'raw', typescript: false, format: 'svg', outputDir: './assets/logos',
    })
    expect(configExists(dir)).toBe(false)
  })
  it.each(['react', 'vue', 'svelte'])('detects %s for a first run without saving config', (framework) => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ dependencies: { [framework]: '*' } }))
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}')
    expect(loadConfig(dir)).toMatchObject({
      framework, typescript: true, format: 'component', outputDir: './src/components/logos',
    })
    expect(configExists(dir)).toBe(false)
  })
  it('saves then loads back the same config', () => {
    saveConfig(DEFAULT_CONFIG, dir)
    expect(configExists(dir)).toBe(true)
    expect(loadConfig(dir)).toEqual(DEFAULT_CONFIG)
  })
  it('rejects invalid JSON', () => {
    fs.writeFileSync(getConfigPath(dir), '{ not json')
    expect(() => loadConfig(dir)).toThrow(/JSON/i)
  })
  it('rejects a structurally invalid config', () => {
    fs.writeFileSync(getConfigPath(dir), JSON.stringify({ framework: 'angular' }))
    expect(() => loadConfig(dir)).toThrow(/Invalid configuration/i)
  })
})

describe('framework / typescript detection', () => {
  it('detects the framework from dependencies', () => {
    fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ dependencies: { vue: '^3' } }))
    expect(detectFramework(dir)).toBe('vue')
  })
  it('returns "raw" when there is no package.json', () => {
    expect(detectFramework(dir)).toBe('raw')
  })
  it('detects TypeScript from a tsconfig.json', () => {
    fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}')
    expect(detectTypeScript(dir)).toBe(true)
  })
  it('reports no TypeScript for a bare directory', () => {
    expect(detectTypeScript(dir)).toBe(false)
  })
})
