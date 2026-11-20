/**
 * Framework component generation — pure functions that turn an (already
 * optimized) SVG string into React / Vue / Svelte component source.
 *
 * Extracted from the installer so the generated output (especially that the
 * `size` prop actually drives the rendered width/height) is unit-testable.
 */
import type { Config, Logo } from '../types/index.js'
import { optimizeSvg } from './svg.js'
import { toComponentName, sanitizeFileName } from './naming.js'

/**
 * Inject attributes into the root `<svg>` tag, first stripping any baked-in
 * width/height from the root tag. This is the load-bearing fix for the `size` prop: svgo's
 * `removeDimensions` strips width/height, so the previous approach of
 * string-replacing an existing `width="…"` matched nothing and the size prop
 * was inert. Adding the attributes unconditionally guarantees they take effect.
 */
export function applySvgProps(svg: string, attrs: string): string {
  return svg
    .trim()
    // Only the root tag: inner <rect>/<mask>/<image> need their own width/height.
    .replace(/^<svg[^>]*>/, (root) => root.replace(/\s+(width|height)="[^"]*"/g, ''))
    // Function replacer: a string replacement would interpret `$$`/`$&` in `attrs`
    // (e.g. Svelte's `{...$$restProps}` would collapse to `{...$restProps}`).
    .replace(/^<svg/, () => `<svg ${attrs}`)
}

/**
 * Convert SVG attribute names to their JSX equivalents so the embedded markup is
 * valid React (raw SVG uses `fill-rule`, `class`, etc. which React rejects /
 * drops with a warning). Any hyphenated or namespaced name is camelCased
 * (`data-*` / `aria-*` are left as written) and `class` becomes `className`.
 * A string `style` attribute is also converted to a style object, since React
 * throws on string styles. Otherwise only names are rewritten, never values.
 */
const camelCase = (name: string): string => name.replace(/[-:]([a-zA-Z])/g, (_, c: string) => c.toUpperCase())

/** `style="a-b:c;d:e"` → `style={{ "aB": "c", "d": "e" }}` (React rejects string styles). */
function styleObject(css: string): string {
  const pairs = css
    .split(';')
    .map((decl) => decl.trim())
    .filter(Boolean)
    .map((decl) => {
      const i = decl.indexOf(':')
      return `${JSON.stringify(camelCase(decl.slice(0, i).trim()))}: ${JSON.stringify(decl.slice(i + 1).trim())}`
    })
  return `{{ ${pairs.join(', ')} }}`
}

export function reactifyAttrs(svg: string): string {
  return svg
    // Any hyphenated or namespaced attribute name → camelCase (fill-rule → fillRule,
    // xml:space → xmlSpace). data-* and aria-* are valid JSX as written.
    .replace(/(\s)([a-zA-Z]+(?:[-:][a-zA-Z]+)+)=/g, (match, ws: string, name: string) =>
      /^(data|aria)-/.test(name) ? match : `${ws}${camelCase(name)}=`,
    )
    .replace(/(\s)class=/g, '$1className=')
    .replace(/\sstyle="([^"]*)"/g, (_, css: string) => ` style=${styleObject(css)}`)
}

/**
 * `wordmark`: size drives height only; width follows the viewBox aspect ratio.
 * A 5:1 wordmark forced into a size x size square would render tiny.
 */
export function generateComponent(
  config: Config,
  logo: Logo,
  rawSvg: string,
  opts: { wordmark?: boolean } = {},
): string {
  const svg = optimizeSvg(rawSvg, { colorMode: config.style.colorMode, idPrefix: sanitizeFileName(logo.title) })
  const name = toComponentName(logo.title)
  const dims = opts.wordmark ? ['height'] : ['width', 'height']

  switch (config.framework) {
    case 'react':
      return reactComponent(name, svg, config, dims)
    case 'vue':
      return vueComponent(name, svg, config, dims)
    case 'svelte':
      return svelteComponent(name, svg, config, dims)
    default:
      return svg
  }
}

function reactComponent(name: string, svg: string, config: Config, dims: string[]): string {
  const body = applySvgProps(reactifyAttrs(svg), `${dims.map((d) => `${d}={size}`).join(' ')} {...otherProps}`)
  const iface = config.typescript
    ? `\ninterface ${name}Props extends React.SVGProps<SVGSVGElement> {\n  size?: string | number\n}\n`
    : ''
  const propsParam = config.typescript ? `props: ${name}Props` : 'props'

  return `import React from 'react'
${iface}
export function ${name}(${propsParam}) {
  const { size = ${config.style.defaultSize}, ...otherProps } = props

  return (
    ${body}
  )
}

export default ${name}
`
}

function vueComponent(name: string, svg: string, config: Config, dims: string[]): string {
  const body = applySvgProps(svg, `${dims.map((d) => `:${d}="size"`).join(' ')} v-bind="$attrs"`)
  const scriptLang = config.typescript ? ' lang="ts"' : ''

  return `<template>
  ${body}
</template>

<script${scriptLang}>
import { defineComponent } from 'vue'

export default defineComponent({
  name: '${name}',
  inheritAttrs: false,
  props: {
    size: {
      type: [String, Number],
      default: ${config.style.defaultSize}
    }
  }
})
</script>
`
}

function svelteComponent(name: string, svg: string, config: Config, dims: string[]): string {
  const body = applySvgProps(svg, `${dims.map((d) => `${d}={size}`).join(' ')} {...$$restProps}`)
  const scriptLang = config.typescript ? ' lang="ts"' : ''

  return `<script${scriptLang}>
  export let size${config.typescript ? ': string | number' : ''} = ${config.style.defaultSize}
</script>

${body}
`
}
