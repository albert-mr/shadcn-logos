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
 * Local logo categories
 */
export const localCategories: LocalCategory[] = [
  { category: 'Community', total: 1 },
  { category: 'Startup', total: 1 },
  { category: 'Custom', total: 0 }
]

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
  },
  {
    id: 'example-company',
    title: 'Example Company',
    category: 'Startup',
    route: 'example-company'
  }
]

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
 * Get local logos by category
 */
export function getLocalLogosByCategory(category: string): LocalLogo[] {
  return localLogos.filter(logo => logo.category === category)
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