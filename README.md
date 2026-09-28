# shadcn-logos

> Copy company logo components into your project. Like [shadcn/ui](https://ui.shadcn.com), but for logos.

[![npm version](https://img.shields.io/npm/v/shadcn-logos.svg?color=cb3837&label=npm)](https://www.npmjs.com/package/shadcn-logos)
[![npm downloads](https://img.shields.io/npm/dm/shadcn-logos.svg?color=cb3837)](https://www.npmjs.com/package/shadcn-logos)
[![CI](https://github.com/albert-mr/shadcn-logos/actions/workflows/ci.yml/badge.svg)](https://github.com/albert-mr/shadcn-logos/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/shadcn-logos.svg?color=blue)](./LICENSE)
[![node](https://img.shields.io/node/v/shadcn-logos.svg)](https://nodejs.org)

```bash
bunx shadcn-logos@latest add vercel github react
```

`shadcn-logos` is **not** a logo library. Just like shadcn/ui copies UI components into your
project, this copies logo components into your project. You get the actual code, so you own it
and can style or change it however you like. Logos come from the [SVGL](https://svgl.app)
registry (650+ brands) plus a small bundled set.

## Why

- **Copy, don't import.** The component lives in your repo. No dependency in `node_modules` to fight, no version lock-in.
- **A `size` prop that works.** `<VercelLogo size={32} />` drives width and height. Extra props (`className`, `style`, events) forward to the `<svg>`.
- **Your stack.** React, Vue, Svelte, or raw optimized SVG.
- **Dark mode by default.** `currentColor` mode makes monochrome logos inherit your text color; `fill="none"` is preserved.
- **Clean output.** SVGs are minified with [svgo](https://github.com/svg/svgo); React markup is valid JSX (`fill-rule` becomes `fillRule`, and so on).
- **Typed.** TypeScript components with a typed props interface, validated config, and a tested core.

### Why not `shadcn add` straight from SVGL?

SVGL now publishes its own shadcn registry (`npx shadcn@latest add https://svgl.app/r/vercel.json`).
If you are on React and want each brand's original colors, that works well. `shadcn-logos`
adds Vue, Svelte, and raw SVG output; a `size` prop; `currentColor` theming so monochrome
logos follow your text color; svgo-minified markup; and fuzzy names
(`add nextjs github stripe`) instead of exact registry slugs.

## Quick start

### 1. Add a logo

No install needed, run it on demand:

```bash
bunx shadcn-logos@latest add vercel
```

Or set up a config once and add many:

```bash
bunx shadcn-logos@latest init -y      # detect framework + TypeScript, write logos.config.json
shadcn-logos add vercel github react  # add several at once
shadcn-logos add vercel --dry-run     # preview without writing files
shadcn-logos add vercel --wordmark --dark  # wordmark, dark-theme variant
```

### 2. Use it

```tsx
import { VercelLogo } from './src/components/logos/vercel'

export function Header() {
  return <VercelLogo size={32} className="text-black dark:text-white" />
}
```

### 3. Customize it (you own the code)

Open the generated file and change anything: add classes, hard-code a color, tweak the
viewBox, wrap it in your own component. There is no library to override.

## Documentation

Full documentation lives in [`docs/`](./docs/):

- **[Getting started](./docs/getting-started.md)** — install, configure, add your first logo.
- **[Commands](./docs/commands.md)** — every command, flag, and exit code.
- **[Configuration](./docs/configuration.md)** — the `logos.config.json` file, field by field.
- **[Frameworks and output](./docs/frameworks.md)** — React, Vue, Svelte, and raw SVG, plus the `size` prop and `currentColor`.
- **[Troubleshooting](./docs/troubleshooting.md)** — common errors and fixes.
- **[Architecture](./docs/architecture.md)** — how it works, for contributors.

## Commands

| Command | What it does |
| --- | --- |
| `init` | Create `logos.config.json` (use `-y` for defaults). |
| `add <logos...>` | Add logos. `--dark` / `--wordmark` for variants, `--dry-run` to preview, `--force` to overwrite. |
| `list` | Browse the catalog. `--category`, `--search`, `--limit`. |
| `search <query>` | Find logos by name. |
| `cache` | Manage the response cache. `--stats`, `--clear`. |

Full reference: [docs/commands.md](./docs/commands.md).

## Supported frameworks

| Framework | Output | `size` prop |
| --- | --- | --- |
| React | `.tsx` / `.jsx` component | `width`/`height` bound to `size` |
| Vue | `.vue` component | `:width`/`:height` bound to `size` |
| Svelte | `.svelte` component | `width`/`height` bound to `size` |
| Raw SVG | optimized `.svg` file | n/a |

See [docs/frameworks.md](./docs/frameworks.md) for real output examples.

## What you get

🎨 650+ logos from top companies and tools
📁 Actual component code, copy not import
⚡ Optimized SVGs, small file sizes
🌗 Dark variants and wordmarks when available (`--dark`, `--wordmark`)
✨ Fully customizable, edit the code however you want
🔧 TypeScript-ready with full type definitions

## Contributing

- **Add a logo:** drop an SVG in `logos/`, add a definition to `data/logos.ts`, open a PR. See [CONTRIBUTING_LOGOS.md](./CONTRIBUTING_LOGOS.md).
- **Contribute code:** see [CONTRIBUTING.md](./CONTRIBUTING.md). The short version:

```bash
bun install
bun run check   # lint + type-check + test + build
```

## Credits

- **Logo data:** [SVGL](https://svgl.app) and the free [SVGL API](https://api.svgl.app) by [@pheralb](https://github.com/pheralb).
- **Inspired by:** [shadcn/ui](https://ui.shadcn.com), which made copying components into your project the norm.

## License

[MIT](./LICENSE) — use it in any project.
