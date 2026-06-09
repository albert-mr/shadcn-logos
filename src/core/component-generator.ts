/**
 * Framework component generation — pure functions that turn an (already
 * optimized) SVG string into React / Vue / Svelte component source.
 *
 * Extracted from the installer so the generated output (especially that the
 * `size` prop actually drives the rendered width/height) is unit-testable.
 */
import type { Config, Logo } from '../types/index.js'
import { optimizeSvg } from './svg.js'
import { toComponentName } from './naming.js'

/**
 * Inject attributes into the root `<svg>` tag, first stripping any baked-in
 * width/height. This is the load-bearing fix for the `size` prop: svgo's
 * `removeDimensions` strips width/height, so the previous approach of
 * string-replacing an existing `width="…"` matched nothing and the size prop
 * was inert. Adding the attributes unconditionally guarantees they take effect.
 */
export function applySvgProps(svg: string, attrs: string): string {
  return svg
    .trim()
    .replace(/\s+(width|height)="[^"]*"/g, '')
    // Function replacer: a string replacement would interpret `$$`/`$&` in `attrs`
    // (e.g. Svelte's `{...$$restProps}` would collapse to `{...$restProps}`).
    .replace(/^<svg/, () => `<svg ${attrs}`)
}

/**
 * Convert SVG attribute names to their JSX equivalents so the embedded markup is
 * valid React (raw SVG uses `fill-rule`, `class`, etc. which React rejects /
 * drops with a warning). Only attribute names are rewritten, never values.
 */
const JSX_ATTR_MAP: Record<string, string> = {
  class: 'className',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'clip-path': 'clipPath',
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-opacity': 'strokeOpacity',
  'fill-opacity': 'fillOpacity',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
}

export function reactifyAttrs(svg: string): string {
  let out = svg
  for (const [from, to] of Object.entries(JSX_ATTR_MAP)) {
    out = out.replace(new RegExp(`(\\s)${from}=`, 'g'), `$1${to}=`)
  }
  return out
}

export function generateComponent(config: Config, logo: Logo, rawSvg: string): string {
  const svg = optimizeSvg(rawSvg, { colorMode: config.style.colorMode })
  const name = toComponentName(logo.title)

  switch (config.framework) {
    case 'react':
      return reactComponent(name, svg, config)
    case 'vue':
      return vueComponent(name, svg, config)
    case 'svelte':
      return svelteComponent(name, svg, config)
    default:
      return svg
  }
}

function reactComponent(name: string, svg: string, config: Config): string {
  const body = applySvgProps(reactifyAttrs(svg), 'width={size} height={size} {...otherProps}')
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

function vueComponent(name: string, svg: string, config: Config): string {
  const body = applySvgProps(svg, ':width="size" :height="size" v-bind="$attrs"')
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

function svelteComponent(name: string, svg: string, config: Config): string {
  const body = applySvgProps(svg, 'width={size} height={size} {...$$restProps}')
  const scriptLang = config.typescript ? ' lang="ts"' : ''

  return `<script${scriptLang}>
  export let size${config.typescript ? ': string | number' : ''} = ${config.style.defaultSize}
</script>

${body}
`
}
