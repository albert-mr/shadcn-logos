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
 * Never throws: on any svgo failure it returns the input unchanged.
 */
export function optimizeSvg(svgContent: string, opts: { colorMode: ColorMode }): string {
  try {
    const result = optimize(svgContent, { plugins: SVGO_PLUGINS })
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
