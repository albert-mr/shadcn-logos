# shadcn-logos

A CLI tool for adding company logos to your projects, inspired by shadcn/ui. Easily install high-quality SVG logos from [SVGL](https://svgl.app) as React components or raw SVG files.

## Features

- 🎨 **500+ High-quality logos** from top tech companies and tools
- ⚡ **Framework support** for React, Vue, Svelte, and raw SVG files
- 🎯 **TypeScript support** with full type definitions
- 🎨 **Component generation** with customizable props
- 📦 **Zero configuration** with smart framework detection
- 🔍 **Search and browse** logos by category
- ⚙️ **SVG optimization** for smaller file sizes
- 🌗 **Dark/light mode** support for logos with variants

## Installation

```bash
# Install globally
npm install -g shadcn-logos

# Or use directly with npx/bunx
bunx shadcn-logos@latest add vercel
```

## Quick Start

1. **Initialize your project**
   ```bash
   shadcn-logos init
   ```

2. **Add logos to your project**
   ```bash
   shadcn-logos add vercel github react
   ```

3. **Use in your components**
   ```tsx
   import { VercelLogo } from './src/components/logos/vercel'
   
   function MyComponent() {
     return <VercelLogo size={32} />
   }
   ```

## Commands

### `init`
Initialize configuration for your project:
```bash
shadcn-logos init
# or skip prompts with defaults
shadcn-logos init -y
```

### `add`
Add logos to your project:
```bash
# Add specific logos
shadcn-logos add vercel github react

# Force overwrite existing files
shadcn-logos add vercel --force

# Dry run to see what would be installed
shadcn-logos add vercel --dry-run
```

### `list`
Browse available logos:
```bash
# List all logos (limited to 50)
shadcn-logos list

# Filter by category
shadcn-logos list --category ai

# Search within results
shadcn-logos list --search database

# Show more results
shadcn-logos list --limit 100
```

### `search`
Search for specific logos:
```bash
shadcn-logos search database
shadcn-logos search "machine learning"
```

## Configuration

The CLI creates a `logos.config.json` file in your project root:

```json
{
  "framework": "react",
  "typescript": true,
  "outputDir": "./src/components/logos",
  "format": "component",
  "style": {
    "defaultSize": "24",
    "colorMode": "currentColor",
    "cssVariables": true
  },
  "registry": {
    "source": "svgl",
    "cache": true
  }
}
```

### Configuration Options

- **framework**: Target framework (`react`, `vue`, `svelte`, `raw`)
- **typescript**: Generate TypeScript components
- **outputDir**: Where to install logo files
- **format**: Output format (`component`, `svg`, `both`)
- **style.defaultSize**: Default logo size in pixels
- **style.colorMode**: Color handling (`currentColor`, `original`)

## Generated Components

### React
```tsx
import React from 'react'

interface VercelLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: string | number
}

export function VercelLogo(props: VercelLogoProps) {
  const { size = 24, ...otherProps } = props
  return <svg {...otherProps}>...</svg>
}
```

### Vue
```vue
<template>
  <svg :width="size" :height="size" v-bind="$attrs">...</svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VercelLogo',
  props: {
    size: { type: [String, Number], default: 24 }
  }
})
</script>
```

## Development

```bash
# Install dependencies
bun install

# Build the CLI
bun run build

# Run in development
bun run dev --help

# Test installation
bun run dev init -y
bun run dev add vercel
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## Credits

- Logo data provided by [SVGL](https://svgl.app)
- Inspired by [shadcn/ui](https://ui.shadcn.com)

## License

MIT License - see [LICENSE](LICENSE) file for details.