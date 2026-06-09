# Architecture

This is a map of how the CLI works, for anyone who wants to change it. The codebase is
small and split into a thin command layer over a set of pure, testable core modules.

## High level

```
shadcn-logos add vercel
        |
        v
  src/cli/index.ts            commander setup, global error handling, exit codes
        |
        v
  src/cli/commands/add.ts     loads config, drives the installer, prints results
        |
        v
  src/core/installer.ts       resolves names, fetches, optimizes, generates, writes
     |        |        |
     v        v        v
   api.ts   svg.ts   component-generator.ts
  (fetch)  (svgo)    (react / vue / svelte source)
     |
     v
  data/logos.ts + SVGL API    the logo catalog (local set + https://api.svgl.app)
```

## Modules

### Command layer (`src/cli/`)

| File | Responsibility |
| --- | --- |
| `index.ts` | Defines commands and options with [commander](https://github.com/tj/commander.js), installs global error/`SIGINT` handlers, and maps failures to [exit codes](./commands.md#exit-codes). The executable shebang comes from the tsup banner, not this file. |
| `commands/init.ts` | Interactive and `-y` config creation, with framework/TypeScript auto-detection. |
| `commands/add.ts` | Loads config, runs the installer, and prints accurate usage examples from the resolved logos. |
| `commands/list.ts` | Browses the catalog, grouped by category. |
| `commands/search.ts` | Name search with a ready-to-run `add` suggestion. |
| `commands/cache.ts` | `--stats` and `--clear` for the response cache. |
| `utils/config.ts` | Load / save / validate `logos.config.json`; `detectFramework` and `detectTypeScript`. |
| `utils/logger.ts` | Small colorized console wrapper. |
| `utils/error-handler.ts` | User-facing error messages, close-match suggestions (Levenshtein), and the `ExitCode` enum. |

### Core (`src/core/`)

These are mostly pure functions, which is what makes them easy to unit-test.

| File | Responsibility |
| --- | --- |
| `api.ts` | `SvglApiClient`: fetches the catalog and individual SVGs from SVGL, merges in the bundled local logos, and caches responses. Network calls have a 15s timeout. |
| `logo-match.ts` | Pure name resolution: exact, then punctuation-insensitive, then substring. |
| `svg.ts` | Pure svgo wrapper. Optimizes the SVG and applies the `currentColor` color mode (while preserving `fill="none"`). |
| `component-generator.ts` | Pure framework code generation for React / Vue / Svelte, including the `size` prop wiring and React JSX attribute conversion. |
| `naming.ts` | Pure `sanitizeFileName` (file names) and `toComponentName` (component names). |
| `installer.ts` | Orchestrates resolve, fetch, optimize, generate, and write, with bounded concurrency and a progress bar. |
| `cache/file-cache.ts` | On-disk JSON cache (see [Caching](#caching)). |

### Types and data

| File | Responsibility |
| --- | --- |
| `src/types/index.ts` | Zod schemas (`Logo`, `Category`, `Config`, ...) and the inferred TypeScript types, plus typed error classes. |
| `data/logos.ts` | The bundled local logo definitions and helpers. |
| `logos/*.svg` | The bundled local SVG files. |

## The `add` data flow

1. `add.ts` loads and validates `logos.config.json`.
2. `installer.install` calls `api.findLogos`, which loads the full catalog (`getAllLogos`:
   bundled local logos plus the SVGL API, cached) and resolves each typed name via
   `logo-match`. Unresolved names abort the run with suggestions (exit code `4`).
3. For each resolved logo, the installer fetches the SVG (`getLogoSvg`: a bundled file if
   available, otherwise SVGL), optimizes it (`svg.optimizeSvg`), and either generates a
   component (`component-generator.generateComponent`) or keeps the raw SVG.
4. Files are written to `outputDir` with names from `naming.sanitizeFileName`, in batches of
   five, with progress shown unless `--silent`.

## Caching

`file-cache.ts` stores API responses as JSON under `~/.shadcn-logos/cache`. Entries are
versioned and expire after one hour. Manage it with `shadcn-logos cache --stats` and
`shadcn-logos cache --clear`.

## Build

[tsup](https://tsup.egoist.dev) bundles `src/cli/index.ts` into a single minified ESM file
at `dist/index.js`, with a `#!/usr/bin/env node` banner so it runs as a binary. The
`shadcn-logos` bin in `package.json` points at it. The published package also ships the
`data/` and `logos/` directories so the bundled local logos resolve at runtime.

## Where things come from

- Logo data and SVGs: the [SVGL](https://svgl.app) registry and its
  [API](https://api.svgl.app), plus the small local set in this repo.
- Inspiration: [shadcn/ui](https://ui.shadcn.com), which popularized copying components into
  your project instead of importing them from a library.

## Adding to the catalog

To add a logo to the bundled set, see [CONTRIBUTING_LOGOS.md](../CONTRIBUTING_LOGOS.md): drop
an SVG in `logos/`, add a definition to `data/logos.ts`, and open a pull request.
