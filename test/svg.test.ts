import { describe, it, expect } from 'vitest'
import { countPaintColors, optimizeSvg } from '../src/core/svg.js'

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

  it('inlines <style> rules and removes the element', () => {
    const out = optimizeSvg(
      '<svg viewBox="0 0 24 24"><style>.a{fill:#ff0000}</style><path class="a" d="M2 2h20v20H2z"/></svg>',
      { colorMode: 'original' },
    )
    expect(out).not.toContain('<style')
    expect(out).not.toContain('{')
    expect(out).toContain('fill="red"')
  })

  it('removes <script> elements and on* event handlers', () => {
    const out = optimizeSvg(
      '<svg viewBox="0 0 24 24"><script>alert(1)</script><path onclick="alert(1)" d="M2 2h20v20H2z"/></svg>',
      { colorMode: 'original' },
    )
    expect(out).not.toContain('<script')
    expect(out).not.toContain('onclick')
  })

  it('modernises xlink:href to href', () => {
    const out = optimizeSvg(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24"><defs><path id="p" d="M2 2h20v20H2z"/></defs><use xlink:href="#p"/></svg>',
      { colorMode: 'original' },
    )
    expect(out).not.toContain('xlink')
  })
})

const count = (svg: string) => countPaintColors(optimizeSvg(svg, { colorMode: 'original' }))

describe('countPaintColors', () => {
  it('counts an implicit black fill as one colour', () => {
    expect(count('<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z"/></svg>')).toBe(1)
    expect(count('<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="#000000"/><path d="M3 3h2v2H3z" fill="black"/></svg>')).toBe(1)
  })

  it('counts black + white as two colours', () => {
    expect(count('<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="#000"/><path d="M3 3h2v2H3z" fill="#fff"/></svg>')).toBe(2)
  })

  it('counts three fills as three colours', () => {
    expect(count('<svg viewBox="0 0 24 24"><path d="M2 2h6v6H2z" fill="#ea4335"/><path d="M9 9h6v6H9z" fill="#34a853"/><path d="M16 16h6v6h-6z" fill="#4285f4"/></svg>')).toBe(3)
  })

  it('counts strokes, ignores none / currentColor and inherits group fills', () => {
    expect(count('<svg viewBox="0 0 24 24" fill="none"><path d="M4 4 20 20" stroke="#ff0000"/><g fill="currentColor"><path d="M2 2h20v20H2z"/></g></svg>')).toBe(1)
  })

  it('ignores clipPath and mask content', () => {
    expect(count('<svg viewBox="0 0 24 24"><defs><clipPath id="c"><path d="M0 0h24v24H0z" fill="#fff"/></clipPath></defs><g clip-path="url(#c)"><path d="M2 2h20v20H2z" fill="#635bff"/><path d="M3 3h2v2H3z" fill="#635bff"/></g></svg>')).toBe(1)
  })

  it('treats gradients and images as more than one colour', () => {
    expect(count('<svg viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/><stop offset="1" stop-color="#f00"/></linearGradient></defs><path d="M2 2h20v20H2z" fill="url(#g)"/></svg>')).toBeGreaterThan(1)
    expect(count('<svg viewBox="0 0 24 24"><image href="data:image/png;base64,AAAA" width="24" height="24"/></svg>')).toBeGreaterThan(1)
  })
})

describe('optimizeSvg colorMode auto', () => {
  it('flattens a one-colour logo exactly like currentColor', () => {
    const svg = '<svg viewBox="0 0 24 24"><path d="M2 2h20v20H2z" fill="#635bff"/></svg>'
    const out = optimizeSvg(svg, { colorMode: 'auto', idPrefix: 'stripe' })
    expect(out).toContain('fill="currentColor"')
    expect(out).toBe(optimizeSvg(svg, { colorMode: 'currentColor', idPrefix: 'stripe' }))
  })

  it('keeps the colours of a multi-colour logo exactly like original', () => {
    const svg = '<svg viewBox="0 0 24 24"><path d="M2 2h6v6H2z" fill="#ea4335"/><path d="M9 9h6v6H9z" fill="#34a853"/><path d="M16 16h6v6h-6z" fill="#4285f4"/></svg>'
    const out = optimizeSvg(svg, { colorMode: 'auto' })
    expect(out).not.toContain('currentColor')
    expect(out).toContain('#ea4335')
    expect(out).toBe(optimizeSvg(svg, { colorMode: 'original' }))
  })

  it('never throws; returns a string for non-svg input', () => {
    expect(typeof optimizeSvg('<<<not svg', { colorMode: 'auto' })).toBe('string')
  })
})
