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

  it('keeps width/height on inner elements', () => {
    const out = applySvgProps(
      '<svg width="100" height="100" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>',
      'width={size}',
    )
    expect(out).toContain('<rect width="18" height="18"')
    expect(out).not.toContain('width="100"')
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

  it('converts any hyphenated or namespaced attribute but leaves data-* and aria-*', () => {
    const out = reactifyAttrs(
      '<feFlood flood-opacity="0" color-interpolation-filters="sRGB" xml:space="preserve" data-name="x" aria-label="y"/>',
    )
    expect(out).toContain('floodOpacity="0"')
    expect(out).toContain('colorInterpolationFilters="sRGB"')
    expect(out).toContain('xmlSpace="preserve"')
    expect(out).toContain('data-name="x"')
    expect(out).toContain('aria-label="y"')
  })

  it('converts a style string to an object', () => {
    const out = reactifyAttrs('<mask style="mask-type:luminance;fill-opacity:.5"/>')
    expect(out).toContain('style={{ "maskType": "luminance", "fillOpacity": ".5" }}')
    expect(out).not.toContain('style="')
  })
})

const STYLED =
  '<svg viewBox="0 0 24 24"><mask id="m" style="mask-type:luminance"><path d="M0 0h24v24H0z" fill="#fff"/></mask><path mask="url(#m)" d="M2 2h20v20H2z"/></svg>'

describe('generateComponent — style attribute', () => {
  it('Vue keeps the string style', () => {
    expect(generateComponent(cfg({ framework: 'vue' }), logo, STYLED)).toContain('style="mask-type:luminance"')
  })

  it('Svelte keeps the string style', () => {
    expect(generateComponent(cfg({ framework: 'svelte' }), logo, STYLED)).toContain('style="mask-type:luminance"')
  })

  it('React emits a style object, never a string style', () => {
    const out = generateComponent(cfg(), logo, STYLED)
    expect(out).not.toContain('style="')
    expect(out).toContain('style={{')
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

  it('wordmarks bind size to height only so the aspect ratio survives', () => {
    const out = generateComponent(cfg(), logo, RAW, { wordmark: true })
    expect(out).toContain('<svg height={size} {...otherProps}')
    expect(out).not.toContain('width=')
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
