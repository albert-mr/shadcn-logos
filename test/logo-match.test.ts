import { describe, it, expect } from 'vitest'
import { matchLogo, findLogosInList } from '../src/core/logo-match.js'
import type { Logo } from '../src/types/index.js'

const L = (title: string): Logo => ({ id: 1, title, category: 'x', route: title.toLowerCase(), url: 'u' })
const list = [L('React'), L('Next.js'), L('Vue'), L('TypeScript')]

describe('matchLogo', () => {
  it('matches exact title case-insensitively', () => {
    expect(matchLogo(list, 'react')?.title).toBe('React')
  })
  it('matches ignoring punctuation (next.js → nextjs)', () => {
    expect(matchLogo(list, 'nextjs')?.title).toBe('Next.js')
  })
  it('falls back to a substring match', () => {
    expect(matchLogo(list, 'type')?.title).toBe('TypeScript')
  })
  it('returns null when nothing matches', () => {
    expect(matchLogo(list, 'svelte')).toBeNull()
  })
  it('prefers an exact match over a substring match', () => {
    const l = [L('Vue'), L('Vuetify')]
    expect(matchLogo(l, 'vue')?.title).toBe('Vue')
  })
})

describe('findLogosInList', () => {
  it('partitions into found and notFound preserving order', () => {
    const r = findLogosInList(list, ['react', 'nope', 'vue'])
    expect(r.found.map((l) => l.title)).toEqual(['React', 'Vue'])
    expect(r.notFound).toEqual(['nope'])
  })
})
