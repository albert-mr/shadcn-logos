import { describe, it, expect } from 'vitest'
import { optimizeSvg } from '../src/core/svg.js'

describe('optimizeSvg', () => {
  it('strips width/height when a viewBox is present', () => {
    const out = optimizeSvg(
      '<svg width="48" height="48" viewBox="0 0 24 24"><path d="M1 1h22v22H1z"/></svg>',
      { colorMode: 'original' },
    )
    expect(out).not.toContain('width="48"')
    expect(out).toContain('viewBox')
  })

  it('rewrites concrete colors to currentColor but preserves none', () => {
    const out = optimizeSvg(
      '<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="#ff0000"/><path d="M4 4 20 20" fill="none" stroke="#0000ff"/></svg>',
      { colorMode: 'currentColor' },
    )
    expect(out).toContain('currentColor')
    expect(out).toContain('fill="none"')
    expect(out).not.toMatch(/#ff0000|#0000ff|red|blue/)
  })

  it('keeps original colors when colorMode is original', () => {
    const out = optimizeSvg(
      '<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="#ff0000"/></svg>',
      { colorMode: 'original' },
    )
    expect(out).not.toContain('currentColor')
  })

  it('inherits text color when a black fill is implicit or removed by optimization', () => {
    for (const fill of ['', ' fill="#000"', ' fill="none"']) {
      const out = optimizeSvg(
        `<svg viewBox="0 0 24 24"${fill}><path d="M2 2h20v20H2z"/></svg>`,
        { colorMode: 'currentColor' },
      )
      expect(out).toMatch(fill.includes('none') ? /<svg[^>]*fill="none"/ : /<svg[^>]*fill="currentColor"/)
    }
  })

  it('never throws; returns a string for non-svg input', () => {
    expect(typeof optimizeSvg('<<<not svg', { colorMode: 'original' })).toBe('string')
  })

  it('prefixes ids and their references so inlined logos do not collide', () => {
    const out = optimizeSvg(
      '<svg viewBox="0 0 24 24"><defs><clipPath id="clip0_1"><path d="M0 0h24v24H0z"/></clipPath></defs><g clip-path="url(#clip0_1)"><path d="M2 2h20v20H2z"/><path d="M3 3h2v2H3z"/></g></svg>',
      { colorMode: 'original', idPrefix: 'vercel' },
    )
    expect(out).toMatch(/id="vercel-[^"]+"/)
    expect(out).toMatch(/url\(#vercel-[^)]+\)/)
    expect(out).not.toMatch(/id="(?!vercel-)/)
  })
})
