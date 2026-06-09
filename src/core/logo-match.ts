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
