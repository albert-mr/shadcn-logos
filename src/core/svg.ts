/**
 * SVG optimization — pure wrapper around svgo so it can be unit-tested without
 * the installer's filesystem/network machinery.
 */
import { optimize, type PluginConfig } from 'svgo'

const SVGO_PLUGINS: PluginConfig[] = [
  'removeDoctype',
  'removeXMLProcInst',
  'removeComments',
  'removeMetadata',
  'removeUselessDefs',
  'removeEditorsNSData',
  'removeEmptyAttrs',
  'removeHiddenElems',
  'removeEmptyText',
  'removeEmptyContainers',
  'cleanupEnableBackground',
  // Inline <style> rules, then drop the element: CSS braces are not valid inside
  // JSX or Svelte markup. Rules that cannot be inlined (@media, @keyframes) are lost.
  { name: 'inlineStyles', params: { onlyMatchedOnce: false } },
  'removeStyleElement',
  // Remote SVG is untrusted: no <script>, no on* handlers, no javascript: links.
  'removeScripts',
  // xlink:href → href; React and TSX reject namespaced attributes.
  'removeXlink',
  'convertStyleToAttrs',
  'convertColors',
  'convertPathData',
  'convertTransform',
  'removeUnknownsAndDefaults',
  'removeUselessStrokeAndFill',
  'removeUnusedNS',
  'cleanupIds',
  'cleanupNumericValues',
  'moveElemsAttrsToGroup',
  'moveGroupAttrsToElems',
  'collapseGroups',
  'mergePaths',
  'convertShapeToPath',
  'sortAttrs',
  'removeDimensions',
]

/**
 * `auto` (prototype, not yet in the config schema or CLI) behaves like
 * `currentColor` for one-colour logos and like `original` for everything else.
 */
export type ColorMode = 'currentColor' | 'original' | 'auto'

// Elements whose area is painted with the inherited fill when they set none.
const FILLED_SHAPES = new Set(['path', 'rect', 'circle', 'ellipse', 'polygon', 'polyline', 'text'])
// Their content is geometry or a luminance mask, never visible colour.
const UNPAINTED_SUBTREES = new Set(['clipPath', 'mask'])
const MULTI_TONE_ELEMENTS = new Set(['linearGradient', 'radialGradient', 'image'])
const IGNORED_PAINTS = new Set(['none', 'currentcolor', 'transparent', 'inherit'])

function paintValue(attributes: Record<string, string>, name: string): string | undefined {
  const style = attributes.style?.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;!]+)`))
  return (style?.[1] ?? attributes[name])?.trim().toLowerCase()
}

/**
 * Count the distinct paint colours of an svgo-optimized SVG: `fill`, `stroke` and
 * `stop-color` values, ignoring `none`, `currentColor`, `transparent` and `url(#…)`.
 * A shape with no fill on itself or any ancestor counts as black. Content of
 * `<clipPath>` and `<mask>` is ignored. Returns `Infinity` when the SVG contains a
 * gradient or an `<image>`, which can never be flattened to one colour.
 *
 * Expects svgo output (colours already normalised by `convertColors`). Throws on
 * unparseable input.
 */
export function countPaintColors(optimizedSvg: string): number {
  const colors = new Set<string>()
  let multiTone = false
  const stack: { fill?: string; unpainted: boolean }[] = []
  const add = (value: string | undefined) => {
    if (value && !IGNORED_PAINTS.has(value) && !value.startsWith('url(')) colors.add(value)
  }
  const collector: PluginConfig = {
    name: 'countPaintColors',
    fn: () => ({
      element: {
        enter(node) {
          const parent = stack.at(-1)
          if (MULTI_TONE_ELEMENTS.has(node.name)) multiTone = true
          const unpainted = (parent?.unpainted ?? false) || UNPAINTED_SUBTREES.has(node.name)
          const ownFill = paintValue(node.attributes, 'fill')
          const fill = ownFill ?? parent?.fill
          if (!unpainted) {
            add(ownFill)
            add(paintValue(node.attributes, 'stroke'))
            add(paintValue(node.attributes, 'stop-color'))
            if (fill === undefined && FILLED_SHAPES.has(node.name)) add('#000')
          }
          stack.push({ fill, unpainted })
        },
        exit() {
          stack.pop()
        },
      },
    }),
  }
  optimize(optimizedSvg, { plugins: [collector] })
  return multiTone ? Number.POSITIVE_INFINITY : colors.size
}

/**
 * Optimize an SVG string. When `colorMode` is `currentColor`, concrete fill/stroke
 * colors are rewritten to `currentColor` so the logo inherits text color — but
 * `fill="none"` / `stroke="none"` are preserved (turning them into `currentColor`
 * would paint shapes that are meant to be unpainted). `auto` picks `currentColor`
 * when `countPaintColors` finds at most one colour, otherwise `original`.
 *
 * `idPrefix` namespaces ids (and their `url(#…)` references) so logos inlined
 * side by side don't collide.
 *
 * Never throws: on any svgo failure it returns the input unchanged.
 */
export function optimizeSvg(svgContent: string, opts: { colorMode: ColorMode; idPrefix?: string }): string {
  if (opts.colorMode === 'auto') {
    const original = optimizeSvg(svgContent, { ...opts, colorMode: 'original' })
    try {
      if (countPaintColors(original) > 1) return original
    } catch {
      return original
    }
    return optimizeSvg(svgContent, { ...opts, colorMode: 'currentColor' })
  }
  try {
    // cleanupIds minifies ids to `a`, `b`, ... so two inlined logos on one page
    // would share `#a` and clip/mask each other. Prefix them per logo.
    const plugins: PluginConfig[] = opts.idPrefix
      ? [...SVGO_PLUGINS, { name: 'prefixIds', params: { prefix: opts.idPrefix, delim: '-' } }]
      : [...SVGO_PLUGINS]
    if (opts.colorMode === 'currentColor') {
      // Black fills may be implicit or removed by SVGO. Supply an inherited fill
      // after optimization; this plugin leaves existing fills (including none) alone.
      plugins.push({ name: 'addAttributesToSVGElement', params: { attributes: [{ fill: 'currentColor' }] } })
    }
    const result = optimize(svgContent, { plugins })
    let optimized = result.data

    if (opts.colorMode === 'currentColor') {
      optimized = optimized
        .replace(/fill="(?!none")[^"]*"/g, 'fill="currentColor"')
        .replace(/stroke="(?!none")[^"]*"/g, 'stroke="currentColor"')
    }

    return optimized
  } catch {
    return svgContent
  }
}
