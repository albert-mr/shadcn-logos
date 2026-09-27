# Getting started

This walks you from nothing to a logo rendering in your app in about a minute.

## Requirements

- Node.js 20 or newer.
- Any project (React, Vue, Svelte, or plain HTML). No framework is required for raw SVG output.

## 1. Run it (no install needed)

The fastest path uses `bunx` (or `npx`), which downloads and runs the latest version on demand:

```bash
bunx shadcn-logos@latest add vercel
```

Prefer a global install?

```bash
npm install -g shadcn-logos
shadcn-logos add vercel
```

## 2. Create a config (recommended)

`init` writes a `logos.config.json` to your project root. It remembers your framework,
output folder, and style preferences so every later `add` does the right thing.

```bash
# Interactive: answer a few questions
bunx shadcn-logos@latest init

# Non-interactive: accept smart defaults (auto-detects your framework and TypeScript)
bunx shadcn-logos@latest init -y
```

If you skip this step, `add` falls back to the defaults: a React + TypeScript component
written to `./src/components/logos`. See [Configuration](./configuration.md) for every option.

## 3. Add logos

```bash
# One logo
shadcn-logos add vercel

# Several at once
shadcn-logos add vercel github react typescript

# See what would be written, without touching disk
shadcn-logos add vercel --dry-run
```

Names are matched loosely, so `nextjs`, `next.js`, and `Next.js` all resolve to the same
logo. If a name cannot be found, the CLI suggests close matches.

## 4. Use it in your app

The default React output gives you a component you import and drop in. The `size` prop
sets both width and height:

```tsx
import { VercelLogo } from './src/components/logos/vercel'

export function Header() {
  return <VercelLogo size={32} className="text-black dark:text-white" />
}
```

With the default `currentColor` color mode, the logo inherits the surrounding text color,
so `text-black` / `dark:text-white` above just works.

## 5. Customize it (you own the code)

The generated file is plain source in your repo. Open it and change anything: add classes,
hard-code a color, tweak the viewBox, wrap it in another component. There is no library to
fight and no import from `node_modules` to override.

## Next steps

- Browse everything that is available: `shadcn-logos list`
- Find a specific logo: `shadcn-logos search supabase`
- Read the full [command reference](./commands.md) and [configuration guide](./configuration.md).
- Working in Vue or Svelte? See [Frameworks and output](./frameworks.md).
