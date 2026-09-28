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

export type ColorMode = 'currentColor' | 'original'

/**
 * Optimize an SVG string. When `colorMode` is `currentColor`, concrete fill/stroke
 * colors are rewritten to `currentColor` so the logo inherits text color — but
 * `fill="none"` / `stroke="none"` are preserved (turning them into `currentColor`
 * would paint shapes that are meant to be unpainted).
 *
 * `idPrefix` namespaces ids (and their `url(#…)` references) so logos inlined
 * side by side don't collide.
 *
 * Never throws: on any svgo failure it returns the input unchanged.
 */
export function optimizeSvg(svgContent: string, opts: { colorMode: ColorMode; idPrefix?: string }): string {
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
