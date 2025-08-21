# shadcn-logos

Copy company logos into your project. Just like shadcn/ui, but for logos.

```bash
bunx shadcn-logos@latest add vercel github react
```

## What is this?

This is **NOT** a logo library. It's a way to copy logo components directly into your project. 

Just like [shadcn/ui](https://ui.shadcn.com) copies UI components, `shadcn-logos` copies logo components. You get the actual component code that you can customize however you want.

## Quick Start

### 1. Copy a logo into your project
```bash
bunx shadcn-logos@latest add vercel
```

### 2. Use it in your app
```tsx
import { VercelLogo } from './src/components/logos/vercel'

function Header() {
  return <VercelLogo size={32} />
}
```

### 3. Customize it (because you own the code!)
```tsx
// Edit ./src/components/logos/vercel.tsx
export function VercelLogo(props) {
  const { size = 24, className, ...otherProps } = props
  
  return (
    <svg 
      className={`my-custom-styles ${className}`} // ← Customize however you want
      width={size} 
      height={size} 
      {...otherProps}
    >
      {/* SVG content you can modify */}
    </svg>
  )
}
```

That's it! The logo is now **yours** to customize. ✨

## Installation

**No installation needed** - use with `bunx`:
```bash
bunx shadcn-logos@latest add [logo-name]
```

**Or install globally:**
```bash
npm install -g shadcn-logos
shadcn-logos add [logo-name]
```

## Commands

### `add` - Add logos to your project
```bash
# Add one logo
shadcn-logos add vercel

# Add multiple logos
shadcn-logos add vercel github react typescript

# See what would be added (dry run)
shadcn-logos add vercel --dry-run
```

### `list` - Browse available logos
```bash
# See all available logos
shadcn-logos list

# Filter by category  
shadcn-logos list --category ai
shadcn-logos list --category database
```

### `search` - Find specific logos
```bash
shadcn-logos search react
shadcn-logos search database
```

### `init` - First time setup
```bash
# Interactive setup
bunx shadcn-logos@latest init

# Quick setup with defaults  
bunx shadcn-logos@latest init -y
```

## Supported Frameworks

- ✅ **React** - TypeScript components with props
- ✅ **Vue** - Vue 3 components  
- ✅ **Svelte** - Svelte components
- ✅ **Raw SVG** - Just the SVG files

## Examples

### React Component
```tsx
import { VercelLogo, GitHubLogo } from './src/components/logos'

function MyApp() {
  return (
    <div>
      <VercelLogo size={24} />
      <GitHubLogo size={32} className="text-blue-500" />
    </div>
  )
}
```

### Vue Component
```vue
<template>
  <div>
    <VercelLogo :size="24" />
    <GitHubLogo :size="32" class="text-blue-500" />
  </div>
</template>

<script>
import { VercelLogo, GitHubLogo } from './src/components/logos'
</script>
```

### Raw SVG
When using `format: "svg"`, logos are saved as SVG files you can use anywhere.

## What You Get

🎨 **500+ logos** from top companies and tools  
📁 **Actual component code** - Copy, don't import  
⚡ **Optimized SVGs** - Small file sizes  
🌗 **Dark/light variants** - When available  
✨ **Fully customizable** - Edit the code however you want  
🔧 **TypeScript ready** - Full type definitions  

## Available Logos

Popular logos include:
- **Frameworks**: React, Vue, Svelte, Angular, Next.js
- **Tools**: GitHub, GitLab, VS Code, Figma, Notion
- **Cloud**: Vercel, Netlify, AWS, Google Cloud
- **Databases**: PostgreSQL, MongoDB, Redis, Supabase
- **And 500+ more...**

Use `bunx shadcn-logos@latest list` to see all available logos.

## Configuration

First run `bunx shadcn-logos@latest init` to configure:
- Framework (React, Vue, Svelte, or raw SVG)
- TypeScript support  
- Output directory
- Logo format preferences

Just like shadcn/ui, this creates a config file that remembers your preferences.

## Contributing Logos

Missing a logo? Add it directly to our repository! Since SVGL can take time to merge new logos, we maintain our own collection for faster additions.

### Quick logo contribution:
1. Add your SVG file to `logos/your-logo.svg`
2. Add the definition to `data/logos.ts`
3. Open a pull request

See [CONTRIBUTING_LOGOS.md](./CONTRIBUTING_LOGOS.md) for detailed instructions.

## Credits & Inspiration

- **Logo data**: [SVGL](https://svgl.app) - Beautiful SVG logos for popular brands
- **Inspired by**: [shadcn/ui](https://ui.shadcn.com) - The amazing component library that started it all
- **API**: [SVGL API](https://api.svgl.app) - Free logo API by [@pheralb](https://github.com/pheralb)

## License

MIT - Feel free to use in any project!