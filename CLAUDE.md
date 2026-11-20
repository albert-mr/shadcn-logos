# shadcn-logos

npm CLI that fetches brand SVGs from the SVGL API (plus a bundled local set), optimizes them
with svgo, and writes React / Vue / Svelte / raw SVG components into the user's project.
TypeScript, bundled with tsup to a single ESM file at `dist/index.js`.

## Commands

Use bun, not npm / pnpm / yarn.

- `bun install`
- `bun run check`: lint + type-check + test + build. Must pass before any PR (CI runs the same on Node 20 and 24, then smoke-tests `node dist/index.js --help`).
- `bun run dev <command>`: run the CLI from source with tsx, e.g. `bun run dev add vercel --dry-run`.
- `bunx vitest run test/<file>.test.ts`: run one test file.

## Layout

- `src/cli/`: `index.ts` (commander setup, exit codes), `commands/` (init, add, list, search, cache), `utils/` (config, logger, error-handler).
- `src/core/`: pure logic in `svg.ts`, `component-generator.ts`, `naming.ts`, `logo-match.ts`; side effects in `api.ts` (SVGL fetch + local logos), `installer.ts` (writes files), `cache/` (on-disk cache in `~/.shadcn-logos/cache`).
- `src/types/`: zod schemas, inferred types, error classes.
- `data/logos.ts` + `logos/*.svg`: the bundled local logos.
- `test/`: vitest, one `<module>.test.ts` per module.
- `docs/`: user docs; `docs/architecture.md` is the contributor map.

## Rules

- The shebang comes only from the tsup `banner` in `tsup.config.ts`. Never add `#!` to `src/cli/index.ts`: a duplicate shebang once crashed the published bundle.
- `logos/` must stay in package.json `files`. `api.ts` reads `logos/*.svg` at runtime relative to the bundle (`dist/../logos`); `data/logos.ts` is bundled, the SVGs are not.
- ESM only: relative imports use the `.js` suffix (`import { x } from './svg.js'`), even from `.ts` files.
- Style: no semicolons, single quotes, 2-space indent. No formatter enforces this, so match it by hand.
- Keep `svg.ts`, `component-generator.ts`, `naming.ts` and `logo-match.ts` pure: no file system, network or console access, so they stay unit-testable. Put I/O in `api.ts`, `installer.ts` or `src/cli`.
- Tests must not hit the network: mock `svglApi` (`vi.spyOn(svglApi, 'findLogos')`, see `test/add-command.test.ts`) or stub `fetch`. Write files only in temp dirs (`mkdtempSync(join(tmpdir(), ...))`) and clean up.
- In `src/cli`, print through `logger` (`src/cli/utils/logger.ts`), not `console.*`. Don't add new console output to `src/core`.
- User-visible changes get a CHANGELOG.md entry under `## [Unreleased]` (Keep a Changelog format).
