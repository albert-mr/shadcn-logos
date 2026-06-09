import { describe, it, expect } from 'vitest'
import { sanitizeFileName, toComponentName } from '../src/core/naming.js'

describe('sanitizeFileName', () => {
  it('lowercases and hyphenates punctuation', () => {
    expect(sanitizeFileName('Next.js')).toBe('next-js')
  })
  it('collapses repeated separators and trims edges', () => {
    expect(sanitizeFileName('  Google   Cloud  ')).toBe('google-cloud')
  })
})

describe('toComponentName', () => {
  it('PascalCases and adds a Logo suffix', () => {
    expect(toComponentName('vercel')).toBe('VercelLogo')
  })
  it('splits on separators', () => {
    expect(toComponentName('Next.js')).toBe('NextJsLogo')
    expect(toComponentName('google cloud')).toBe('GoogleCloudLogo')
  })
  it('produces a valid identifier for digit-leading titles', () => {
    expect(toComponentName('1Password')).toBe('Logo1Password')
    expect(/^[A-Za-z]/.test(toComponentName('100ms'))).toBe(true)
  })
  it('falls back to "Logo" for empty/punctuation-only titles', () => {
    expect(toComponentName('—')).toBe('Logo')
  })
})
