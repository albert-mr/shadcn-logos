/**
 * Naming helpers shared by the installer, the `add` command, and the tests.
 *
 * Kept pure (no I/O) so the file/component naming rules are unit-testable and
 * consistent everywhere a name is shown or written.
 */

/** Symbols that distinguish brands ("C" vs "C++" vs "C#") become words so the
 *  names stay distinct after non-alphanumerics are dropped. */
const spellSymbols = (title: string): string =>
  title.replace(/\+/g, ' Plus ').replace(/#/g, ' Sharp ').replace(/&/g, ' And ')

/** Turn a logo title into a safe, lowercase, hyphenated file basename. */
export function sanitizeFileName(title: string): string {
  const name = spellSymbols(title)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return name || 'logo'
}

/**
 * Turn a logo title into a PascalCase component name suffixed with `Logo`.
 *
 * Guarantees a valid JS identifier that React will treat as a component:
 * titles that start with a digit (e.g. "1Password", "100ms") are prefixed so
 * the result never starts with a number.
 */
export function toComponentName(title: string): string {
  const pascal = spellSymbols(title)
    .split(/[^a-zA-Z0-9]/)
    .filter(Boolean)
    // Capitalize each word's first letter but preserve the rest so brand casing
    // survives ("GitHub" → "GitHub", not "Github"; "1Password" → "1Password").
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')

  if (!pascal) return 'Logo'
  // A component name must not start with a digit (invalid identifier + React
  // would not treat it as a component). Prefix and skip the trailing suffix.
  if (/^[0-9]/.test(pascal)) return `Logo${pascal}`
  return `${pascal}Logo`
}
