import { describe, it, expect } from 'vitest'
import { generateComponent, applySvgProps, reactifyAttrs } from '../src/core/component-generator.js'
import type { Config, Logo } from '../src/types/index.js'

const RAW =
  '<svg width="100" height="100" viewBox="0 0 24 24"><path fill-rule="evenodd" class="a" d="M2 2h20v20H2z" fill="#000"/></svg>'
const logo: Logo = { id: 1, title: 'React', category: 'framework', route: 'react', url: 'https://x' }

function cfg(over: Partial<Config> = {}): Config {
  return {
    framework: 'react',
    typescript: true,
    outputDir: './out',
    format: 'component',
    style: { defaultSize: '24', colorMode: 'original', cssVariables: true },
    registry: { source: 'svgl', cache: true },
    ...over,
  } as Config
}

describe('applySvgProps', () => {
  it('strips baked-in width/height and injects attrs into the root <svg>', () => {
    const out = applySvgProps('<svg width="100" height="100" viewBox="0 0 1 1"></svg>', 'width={size} {...p}')
    expect(out).toContain('width={size}')
    expect(out).not.toContain('width="100"')
    expect(out.startsWith('<svg width={size} {...p}')).toBe(true)
  })
})

describe('reactifyAttrs', () => {
  it('converts hyphenated and class attrs to JSX names without touching values', () => {
    const out = reactifyAttrs('<path class="a" fill-rule="evenodd" stroke-width="2"/>')
    expect(out).toContain('className="a"')
    expect(out).toContain('fillRule="evenodd"')
    expect(out).toContain('strokeWidth="2"')
    expect(out).not.toContain('fill-rule=')
  })
})

describe('generateComponent — React', () => {
  it('REGRESSION: wires the size prop to width/height (it used to be inert)', () => {
    const out = generateComponent(cfg(), logo, RAW)
    expect(out).toContain('width={size}')
    expect(out).toContain('height={size}')
    expect(out).toContain('{...otherProps}')
    expect(out).toContain('size = 24')
    expect(out).not.toContain('width="100"')
    expect(out).toContain('export function ReactLogo')
    expect(out).toContain('interface ReactLogoProps')
  })

  it('emits valid JSX attribute names', () => {
    const out = generateComponent(cfg(), logo, RAW)
    expect(out).toContain('fillRule=')
    expect(out).toContain('className=')
    expect(out).not.toContain('fill-rule=')
    expect(out).not.toContain(' class=')
  })

  it('omits the TS interface in JS mode but still wires size', () => {
    const out = generateComponent(cfg({ typescript: false }), logo, RAW)
    expect(out).not.toContain('interface')
    expect(out).toContain('width={size}')
  })
})

describe('generateComponent — Vue', () => {
  it('binds size to width/height and forwards $attrs', () => {
    const out = generateComponent(cfg({ framework: 'vue' }), logo, RAW)
    expect(out).toContain(':width="size"')
    expect(out).toContain(':height="size"')
    expect(out).toContain('v-bind="$attrs"')
    expect(out).toContain("name: 'ReactLogo'")
    expect(out).toContain('default: 24')
  })
})

describe('generateComponent — Svelte', () => {
  it('binds size to width/height and spreads restProps', () => {
    const out = generateComponent(cfg({ framework: 'svelte' }), logo, RAW)
    expect(out).toContain('width={size}')
    expect(out).toContain('height={size}')
    expect(out).toContain('{...$$restProps}')
    expect(out).toContain('export let size')
  })
})
