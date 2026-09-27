/**
 * Logo name matching — pure resolution of user-typed names against a logo list.
 * Extracted from the API client so the matching precedence is unit-testable
 * without any network access.
 */
import type { Logo } from '../types/index.js'

const normalize = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/**
 * Resolve a single typed name against the list, in precedence order:
 *   1. exact title (case-insensitive)
 *   2. exact title ignoring non-alphanumerics ("next.js" → "nextjs")
 *   3. substring match on title
 * Returns the matched Logo, or null.
 */
export function matchLogo(allLogos: Logo[], name: string): Logo | null {
  const nameLower = name.toLowerCase()
  const nameNorm = normalize(name)

  const exact = allLogos.find((l) => l.title.toLowerCase() === nameLower)
  if (exact) return exact

  const clean = allLogos.find((l) => normalize(l.title) === nameNorm)
  if (clean) return clean

  const partial = allLogos.find((l) => l.title.toLowerCase().includes(nameLower))
  return partial ?? null
}

/** Logos in a category, case-insensitively; a logo may list several categories. */
export function filterByCategory(allLogos: Logo[], category: string): Logo[] {
  const want = category.toLowerCase()
  return allLogos.filter((l) => [l.category].flat().some((c) => c.toLowerCase() === want))
}

/** Resolve many names, partitioning into found logos and not-found names. */
export function findLogosInList(
  allLogos: Logo[],
  names: string[],
): { found: Logo[]; notFound: string[] } {
  const found: Logo[] = []
  const notFound: string[] = []

  for (const name of names) {
    const logo = matchLogo(allLogos, name)
    if (logo) found.push(logo)
    else notFound.push(name)
  }

  return { found, notFound }
}

/**
 * Pick which SVG to fetch for a logo: icon or wordmark, light or dark. The
 * returned title carries the variant ("Vercel Wordmark Dark") so file and
 * component names don't collide when several variants of one logo are added.
 * Returns null when a wordmark is requested but the logo has none. A missing
 * dark variant falls back to the only one available.
 */
export function resolveVariant(
  logo: Logo,
  opts: { dark?: boolean; wordmark?: boolean },
): { title: string; route: string } | null {
  const source = opts.wordmark ? logo.wordmark : logo.route
  if (!source) return null

  let title = opts.wordmark ? `${logo.title} Wordmark` : logo.title
  if (typeof source === 'string') return { title, route: source }
  if (opts.dark) title += ' Dark'
  return { title, route: opts.dark ? source.dark : source.light }
}
