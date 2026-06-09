# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- **The `size` prop now works.** Generated React/Vue/Svelte components had a dead `size` prop: svgo's `removeDimensions` stripped `width`/`height`, then the generator tried to replace attributes that no longer existed. `size` is now injected directly onto the root `<svg>` for all three frameworks, so `<VercelLogo size={32} />` actually renders at 32x32.
- **SVG optimization runs again.** The svgo plugin list used `cleanupIDs`, an invalid name in svgo 3.x that made `optimize()` throw, so every logo was shipped unoptimized. Corrected to `cleanupIds`.
- **Valid React output.** SVG attributes are converted to JSX (`fill-rule` to `fillRule`, `class` to `className`), so React no longer warns or drops them.
- **`currentColor` no longer clobbers `fill="none"`.** Outlined and stroke-only logos render correctly.
- **Valid, readable component names.** Names that start with a digit are prefixed (`1Password` to `Logo1Password`), and brand casing is preserved (`GitHub` to `GitHubLogo`).
- **Correct file extensions** for Vue (`.vue`) and Svelte (`.svelte`), which were previously written as `.tsx`/`.jsx`.
- **Bundled logos resolve when installed**, not only when run from inside the repo.
- **The built CLI runs.** A duplicate shebang made the bundle crash on launch, and `--version` read the wrong path. Both fixed.
- **Network requests time out** after 15 seconds instead of hanging.
- Fixed all pre-existing TypeScript errors, so `tsc --noEmit` is clean.

### Added

- A vitest test suite (30+ cases) covering naming, SVG optimization, component generation, logo matching, and config.
- A full [`docs/`](./docs/) guide: getting started, commands, configuration, frameworks, troubleshooting, and architecture.
- A `bun run check` script (lint + type-check + test + build) and a working flat ESLint config.
- `add` now prints accurate usage examples from the resolved logos.

### Changed

- Refactored the core into pure, testable modules (`naming`, `svg`, `component-generator`, `logo-match`).

## [0.2.0]

Initial public release on npm.

## [0.1.0]

First version.

[Unreleased]: https://github.com/albert-mr/shadcn-logos/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/albert-mr/shadcn-logos/releases/tag/v0.2.0
[0.1.0]: https://github.com/albert-mr/shadcn-logos/releases/tag/v0.1.0
