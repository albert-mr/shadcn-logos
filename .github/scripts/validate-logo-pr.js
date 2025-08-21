#!/usr/bin/env node

import { readFileSync, existsSync, statSync } from 'fs'
import { join, extname, basename } from 'path'
import { execSync } from 'child_process'

const MAX_SVG_SIZE = 50 * 1024 // 50KB
const MAX_LOGO_DIMENSIONS = 1000 // 1000px max width/height

class LogoValidator {
  constructor() {
    this.errors = []
    this.warnings = []
    this.changedFiles = process.env.CHANGED_FILES?.split(' ') || []
  }

  async validate() {
    console.log('🔍 Validating logo PR...')
    console.log('Changed files:', this.changedFiles)

    // Get logo files and data file changes
    const logoFiles = this.changedFiles.filter(f => f.startsWith('logos/') && f.endsWith('.svg'))
    const dataFileChanged = this.changedFiles.includes('data/logos.ts')

    if (logoFiles.length === 0) {
      this.addError('No logo files found in PR. Logo PRs should add SVG files to logos/ directory.')
      return this.getResult()
    }

    // Validate each logo file
    for (const logoFile of logoFiles) {
      await this.validateLogoFile(logoFile)
    }

    // Validate data file updates
    if (dataFileChanged) {
      await this.validateDataFile(logoFiles)
    } else if (logoFiles.length > 0) {
      this.addError('data/logos.ts must be updated when adding new logos')
    }

    // Check for duplicates
    await this.checkDuplicates(logoFiles)

    return this.getResult()
  }

  async validateLogoFile(filePath) {
    console.log(`🔍 Validating ${filePath}...`)

    if (!existsSync(filePath)) {
      this.addError(`Logo file ${filePath} does not exist`)
      return
    }

    // Check file extension
    if (extname(filePath) !== '.svg') {
      this.addError(`${filePath}: Logo must be an SVG file`)
      return
    }

    // Check file size
    const stats = statSync(filePath)
    if (stats.size > MAX_SVG_SIZE) {
      this.addError(`${filePath}: File size ${(stats.size/1024).toFixed(1)}KB exceeds maximum ${MAX_SVG_SIZE/1024}KB`)
    }

    // Check naming convention
    const filename = basename(filePath, '.svg')
    if (!/^[a-z0-9-]+$/.test(filename)) {
      this.addError(`${filePath}: Filename must be lowercase with hyphens only (a-z, 0-9, -)`)
    }

    // Validate SVG content
    try {
      const svgContent = readFileSync(filePath, 'utf-8')
      await this.validateSvgContent(filePath, svgContent)
    } catch (error) {
      this.addError(`${filePath}: Failed to read SVG content: ${error.message}`)
    }
  }

  async validateSvgContent(filePath, content) {
    // Check if it's valid XML/SVG
    if (!content.includes('<svg')) {
      this.addError(`${filePath}: File does not contain valid SVG content`)
      return
    }

    // Check for malicious content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i, // onclick, onload, etc.
      /<iframe/i,
      /<object/i,
      /<embed/i
    ]

    for (const pattern of dangerousPatterns) {
      if (pattern.test(content)) {
        this.addError(`${filePath}: SVG contains potentially malicious content`)
        return
      }
    }

    // Extract dimensions
    const viewBoxMatch = content.match(/viewBox\s*=\s*["']([^"']+)["']/i)
    const widthMatch = content.match(/width\s*=\s*["']?(\d+)/i)
    const heightMatch = content.match(/height\s*=\s*["']?(\d+)/i)

    if (viewBoxMatch) {
      const [, , width, height] = viewBoxMatch[1].split(/\s+/).map(Number)
      if (width > MAX_LOGO_DIMENSIONS || height > MAX_LOGO_DIMENSIONS) {
        this.addWarning(`${filePath}: Large dimensions (${width}x${height}). Consider optimizing for smaller sizes.`)
      }
    } else if (widthMatch && heightMatch) {
      const width = parseInt(widthMatch[1])
      const height = parseInt(heightMatch[1])
      if (width > MAX_LOGO_DIMENSIONS || height > MAX_LOGO_DIMENSIONS) {
        this.addWarning(`${filePath}: Large dimensions (${width}x${height}). Consider optimizing.`)
      }
    }

    // Check for optimization opportunities
    if (content.includes('<!--') || content.includes('\n\n')) {
      this.addWarning(`${filePath}: SVG could be optimized (remove comments/whitespace)`)
    }
  }

  async validateDataFile(logoFiles) {
    console.log('🔍 Validating data/logos.ts updates...')

    try {
      const dataContent = readFileSync('data/logos.ts', 'utf-8')
      
      // Check if new logos are added to the data file
      for (const logoFile of logoFiles) {
        const logoId = basename(logoFile, '.svg')
        
        // Simple check if logo ID appears in the file
        if (!dataContent.includes(`'${logoId}'`) && !dataContent.includes(`"${logoId}"`)) {
          this.addError(`Logo "${logoId}" must be added to data/logos.ts`)
        }
      }

      // Validate TypeScript syntax by attempting to parse imports
      const logoMatches = dataContent.match(/{\s*id:\s*['"]([^'"]+)['"]/g)
      if (logoMatches) {
        for (const logoFile of logoFiles) {
          const logoId = basename(logoFile, '.svg')
          const foundInData = logoMatches.some(match => match.includes(logoId))
          if (!foundInData) {
            this.addError(`Logo "${logoId}" not properly defined in localLogos array`)
          }
        }
      }

    } catch (error) {
      this.addError(`Failed to validate data/logos.ts: ${error.message}`)
    }
  }

  async checkDuplicates(logoFiles) {
    console.log('🔍 Checking for duplicate logos...')

    try {
      // Load existing logo data
      const dataContent = readFileSync('data/logos.ts', 'utf-8')
      const existingIds = [...dataContent.matchAll(/id:\s*['"]([^'"]+)['"]/g)].map(m => m[1])

      // Also check SVGL API for duplicates
      console.log('Checking against SVGL API...')
      try {
        const response = await fetch('https://api.svgl.app')
        const svglLogos = await response.json()
        const svglIds = svglLogos.map(logo => logo.title.toLowerCase().replace(/[^a-z0-9]/g, '-'))

        for (const logoFile of logoFiles) {
          const logoId = basename(logoFile, '.svg')
          
          // Check against existing local logos
          if (existingIds.includes(logoId)) {
            this.addError(`Logo "${logoId}" already exists in local repository`)
          }

          // Check against SVGL logos
          const logoTitle = logoId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          const svglMatch = svglLogos.find(logo => 
            logo.title.toLowerCase() === logoTitle.toLowerCase() ||
            logo.title.toLowerCase().replace(/[^a-z0-9]/g, '') === logoId.replace(/-/g, '')
          )

          if (svglMatch) {
            this.addWarning(`Logo "${logoTitle}" already exists in SVGL. Consider if local version is needed.`)
          }
        }
      } catch (error) {
        this.addWarning(`Could not check SVGL API for duplicates: ${error.message}`)
      }
    } catch (error) {
      this.addError(`Failed to check for duplicates: ${error.message}`)
    }
  }

  addError(message) {
    this.errors.push(`❌ ${message}`)
    console.error(`ERROR: ${message}`)
  }

  addWarning(message) {
    this.warnings.push(`⚠️ ${message}`)
    console.warn(`WARNING: ${message}`)
  }

  getResult() {
    const isValid = this.errors.length === 0
    
    const summary = [
      `**Files validated:** ${this.changedFiles.length}`,
      `**Errors:** ${this.errors.length}`,
      `**Warnings:** ${this.warnings.length}`
    ].join('\\n')

    const allIssues = [...this.errors, ...this.warnings].join('\\n')

    // Set GitHub Actions outputs
    console.log(`::set-output name=valid::${isValid}`)
    console.log(`::set-output name=validation_summary::${summary}`)
    console.log(`::set-output name=validation_errors::${allIssues}`)

    return {
      valid: isValid,
      errors: this.errors,
      warnings: this.warnings,
      summary
    }
  }
}

// Run validation
const validator = new LogoValidator()
validator.validate().then(result => {
  if (result.valid) {
    console.log('✅ Logo validation passed!')
  } else {
    console.log('❌ Logo validation failed!')
    process.exit(1)
  }
}).catch(error => {
  console.error('💥 Validation script failed:', error)
  process.exit(1)
})