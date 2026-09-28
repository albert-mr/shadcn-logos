/**
 * Local logo definitions
 * Following SVGL structure for consistency
 */

export interface LocalLogo {
  id: string
  title: string
  category: string
  route: string
  url?: string
  wordmark?: string
}

export interface LocalCategory {
  category: string
  total: number
}

/**
 * Local logos - add new logos here
 * Keep the same structure as SVGL for consistency
 */
export const localLogos: LocalLogo[] = [
  {
    id: 'shadcn-logos',
    title: 'shadcn-logos',
    category: 'Community',
    route: 'shadcn-logos'
  }
]

/**
 * Local logo categories, counted from `localLogos` so they never drift
 */
export const localCategories: LocalCategory[] = [...new Set(localLogos.map(logo => logo.category))].map(category => ({
  category,
  total: localLogos.filter(logo => logo.category === category).length
}))

/**
 * Get all local logos
 */
export function getLocalLogos(): LocalLogo[] {
  return localLogos
}

/**
 * Get local logo by ID
 */
export function getLocalLogoById(id: string): LocalLogo | undefined {
  return localLogos.find(logo => logo.id === id)
}

/**
 * Search local logos
 */
export function searchLocalLogos(query: string): LocalLogo[] {
  const searchTerm = query.toLowerCase()
  return localLogos.filter(logo => 
    logo.title.toLowerCase().includes(searchTerm) ||
    logo.id.toLowerCase().includes(searchTerm)
  )
}