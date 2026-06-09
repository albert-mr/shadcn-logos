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

  it('never throws; returns a string for non-svg input', () => {
    expect(typeof optimizeSvg('<<<not svg', { colorMode: 'original' })).toBe('string')
  })
})
