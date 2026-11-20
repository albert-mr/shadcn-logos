# Publishing shadcn-logos

Releases are published by GitHub Actions (`.github/workflows/release.yml`) when a `v*` tag is pushed.

## One-time setup

Publishing uses npm [trusted publishing](https://docs.npmjs.com/trusted-publishers), so there is no token to store. On npmjs.com open the `shadcn-logos` package → Settings → Trusted Publisher → GitHub Actions and enter:

- Organization or user: `albert-mr`
- Repository: `shadcn-logos`
- Workflow filename: `release.yml`

## Releasing

1. Bump `version` in `package.json` ([semver](https://semver.org/)).
2. In `CHANGELOG.md`, move the `[Unreleased]` entries under a new `[X.Y.Z]` heading.
3. Open a PR and merge it to `main`.
4. Tag the merge commit on `main` and push the tag:
   ```bash
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```

The workflow checks that the tag matches `package.json`, runs `bun run check` (lint, type-check, tests, build), smoke-tests the CLI and the packed tarball, publishes to npm with provenance, and creates the GitHub release.

## Manual fallback

If the workflow can't be used, publish from a clean, up-to-date `main`:

```bash
bun run check && npm publish
```

`prepublishOnly` also runs `bun run check`, so `npm publish` refuses to ship a build that fails lint, types or tests.
