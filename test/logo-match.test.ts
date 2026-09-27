import { describe, it, expect } from 'vitest'
import { matchLogo, findLogosInList, resolveVariant, filterByCategory } from '../src/core/logo-match.js'
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

describe('resolveVariant', () => {
  const vercel: Logo = {
    id: 1,
    title: 'Vercel',
    category: 'Hosting',
    url: 'https://vercel.com',
    route: { light: 'icon-light.svg', dark: 'icon-dark.svg' },
    wordmark: { light: 'wm-light.svg', dark: 'wm-dark.svg' },
  }
  const plain: Logo = { id: 2, title: 'Plain', category: 'x', url: '', route: 'plain.svg' }

  it('defaults to the light icon under the plain title', () => {
    expect(resolveVariant(vercel, {})).toEqual({ title: 'Vercel', route: 'icon-light.svg' })
  })

  it('picks dark and wordmark variants and names them apart', () => {
    expect(resolveVariant(vercel, { dark: true })).toEqual({ title: 'Vercel Dark', route: 'icon-dark.svg' })
    expect(resolveVariant(vercel, { wordmark: true, dark: true })).toEqual({
      title: 'Vercel Wordmark Dark',
      route: 'wm-dark.svg',
    })
  })

  it('falls back to the single route when there is no dark variant', () => {
    expect(resolveVariant(plain, { dark: true })).toEqual({ title: 'Plain', route: 'plain.svg' })
  })

  it('returns null when a wordmark is requested but missing', () => {
    expect(resolveVariant(plain, { wordmark: true })).toBeNull()
  })
})

describe('filterByCategory', () => {
  it('matches case-insensitively and across multi-category logos', () => {
    const logos: Logo[] = [
      { id: 1, title: 'LangChain', category: ['AI', 'Framework'], route: 'l', url: '' },
      { id: 2, title: 'Granola', category: 'AI', route: 'g', url: '' },
      { id: 3, title: 'Vue', category: 'Framework', route: 'v', url: '' },
    ]
    expect(filterByCategory(logos, 'ai').map((l) => l.title)).toEqual(['LangChain', 'Granola'])
  })
})
