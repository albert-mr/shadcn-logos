# shadcn-logos: Company Logo CLI Tool

## Project Overview
Build a CLI tool similar to shadcn/ui but for company logos, allowing developers to easily add high-quality SVG logos to their projects.

**Command Example:**
```bash
bunx --bun shadcn-logos@latest add vercel neon
```

## Core Architecture

### 1. Data Source
- Use SVGL API (https://api.svgl.app) as primary logo source
- 500+ tech company/tool logos available
- SVG format with dark/light variants support
- 27 categories for organization

### 2. CLI Structure

```
shadcn-logos/
├── src/
│   ├── cli/
│   │   ├── index.ts           # Main CLI entry point
│   │   ├── commands/
│   │   │   ├── init.ts        # Initialize config
│   │   │   ├── add.ts         # Add logos command
│   │   │   ├── list.ts        # List available logos
│   │   │   └── search.ts      # Search logos
│   │   └── utils/
│   │       ├── config.ts      # Config management
│   │       ├── logger.ts      # CLI output formatting
│   │       └── prompts.ts     # Interactive prompts
│   ├── core/
│   │   ├── api.ts            # SVGL API client
│   │   ├── registry.ts       # Logo registry management
│   │   ├── installer.ts      # Logo installation logic
│   │   └── transformer.ts    # SVG processing
│   └── types/
│       └── index.ts           # TypeScript definitions
├── package.json
├── tsconfig.json
├── README.md
└── logos.config.json          # Default config template
```

## Implementation Phases

### Phase 1: Foundation (Core CLI)
1. **Setup Project**
   - Initialize TypeScript project with Bun
   - Setup build tooling (tsup for bundling)
   - Configure ESLint/Prettier
   - Setup package.json for NPM publishing

2. **Basic CLI Framework**
   - Use Commander.js for CLI structure
   - Implement basic command routing
   - Add colored output with chalk
   - Setup global error handling

3. **Configuration System**
   - Create logos.config.json schema
   - Config initialization (`init` command)
   - Config validation and defaults
   - Project type detection (React, Vue, etc.)

### Phase 2: API Integration
1. **SVGL API Client**
   - Fetch all logos endpoint
   - Search functionality
   - Category filtering
   - Direct SVG retrieval
   - Caching mechanism for offline support

2. **Registry Management**
   - Local registry cache
   - Logo metadata storage
   - Version tracking
   - Update checking

### Phase 3: Core Commands
1. **`init` Command**
   ```bash
   shadcn-logos init
   ```
   - Detect project framework
   - Create logos.config.json
   - Setup default paths
   - Configure output preferences

2. **`add` Command**
   ```bash
   shadcn-logos add vercel neon stripe
   ```
   - Fetch logos from API
   - Handle multiple logos
   - Support wildcards (e.g., `add @category/ai`)
   - Interactive mode for selection
   - Progress indicators

3. **`list` Command**
   ```bash
   shadcn-logos list
   shadcn-logos list --category ai
   ```
   - Display available logos
   - Category filtering
   - Pagination support
   - Show installed logos

4. **`search` Command**
   ```bash
   shadcn-logos search "database"
   ```
   - Fuzzy search implementation
   - Display matching results
   - Interactive selection

### Phase 4: Installation Logic
1. **SVG Processing**
   - Size optimization
   - Color customization
   - Dark/light variant handling
   - React/Vue component generation option

2. **File Installation**
   - Determine target directory
   - Handle naming conflicts
   - Create necessary directories
   - Copy/transform SVG files

3. **Framework Integration**
   - React: Generate JSX components
   - Vue: Generate Vue components
   - Next.js: App/pages router support
   - Raw SVG: Direct file copy

### Phase 5: Advanced Features
1. **Component Generation**
   ```typescript
   // Generated React component example
   export const VercelLogo = (props) => (
     <svg {...props}>
       {/* SVG content */}
     </svg>
   );
   ```

2. **Customization Options**
   - Size presets (sm, md, lg, xl)
   - Color theming
   - CSS variable integration
   - Tailwind class support

3. **Batch Operations**
   - Install from package.json list
   - Category-based installation
   - Update all installed logos

### Phase 6: Developer Experience
1. **Interactive Mode**
   - Logo preview in terminal
   - Multi-select interface
   - Category browsing
   - Search as you type

2. **Documentation**
   - Comprehensive README
   - API documentation
   - Examples and recipes
   - Migration guides

3. **Testing**
   - Unit tests for core logic
   - Integration tests for CLI
   - E2E tests for installations
   - Cross-platform testing

## Configuration Schema

```json
{
  "$schema": "https://shadcn-logos.dev/schema.json",
  "framework": "react",
  "typescript": true,
  "outputDir": "./src/components/logos",
  "format": "component",
  "style": {
    "defaultSize": "24",
    "colorMode": "currentColor",
    "cssVariables": true
  },
  "aliases": {
    "@logos": "./src/components/logos"
  },
  "registry": {
    "source": "svgl",
    "cache": true
  }
}
```

## Key Features

### 1. Smart Detection
- Auto-detect framework and configuration
- Infer TypeScript usage
- Detect existing logo directories
- Recognize design system patterns

### 2. Flexible Output
- Raw SVG files
- Framework components (React/Vue/Svelte)
- Sprite sheets
- Icon fonts

### 3. Performance
- Local caching of API responses
- Parallel downloads
- Optimized SVG output
- Tree-shaking friendly exports

### 4. Developer Friendly
- Clear error messages
- Progress indicators
- Verbose mode for debugging
- Dry-run option

## Technical Decisions

### Dependencies
- **Commander.js**: CLI framework
- **Chalk**: Terminal styling
- **Ora**: Spinners and progress
- **Inquirer**: Interactive prompts
- **SVGO**: SVG optimization
- **Axios**: HTTP client
- **Zod**: Schema validation

### Build & Distribution
- **Bun**: Runtime and package manager
- **tsup**: Build tool
- **Changesets**: Version management
- **NPM**: Package distribution

### Code Quality
- **TypeScript**: Type safety
- **ESLint**: Linting
- **Prettier**: Formatting
- **Vitest**: Testing

## Success Metrics
1. Installation time < 2 seconds per logo
2. Zero-config for common frameworks
3. < 100KB CLI size
4. Works offline with cached logos
5. Cross-platform compatibility

## Future Enhancements
1. Custom logo sources/registries
2. Logo submission workflow
3. Brand guideline compliance checks
4. Figma/Sketch plugin
5. VS Code extension
6. Web-based logo browser
7. CI/CD integration
8. Logo usage analytics

## Marketing & Launch
1. Create demo video
2. Write launch blog post
3. Submit to:
   - Product Hunt
   - Hacker News
   - Reddit (r/webdev, r/reactjs)
   - Twitter/X announcement
4. Create documentation site
5. Build interactive playground

## MVP Scope (Phase 1-3)
Focus on delivering:
- Basic CLI with init, add, list commands
- SVGL API integration
- Simple SVG file installation
- React component generation
- Configuration system
- Good error handling

This will provide immediate value while laying foundation for advanced features.