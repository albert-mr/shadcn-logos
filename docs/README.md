# shadcn-logos documentation

`shadcn-logos` copies company logo components straight into your project, the same
way [shadcn/ui](https://ui.shadcn.com) copies UI components. You own the code, so you
can style and change it however you like. Logos come from the [SVGL](https://svgl.app)
registry plus a small bundled local set.

```bash
bunx shadcn-logos@latest add vercel github react
```

## Start here

- [Getting started](./getting-started.md) — install, configure, add your first logo, and use it.

## Reference

- [Commands](./commands.md) — every command, flag, and exit code.
- [Configuration](./configuration.md) — the `logos.config.json` file, field by field.
- [Frameworks and output](./frameworks.md) — what React, Vue, Svelte, and raw SVG output look like, and how the `size` prop and `currentColor` work.
- [Troubleshooting](./troubleshooting.md) — common errors and how to fix them.

## Going deeper

- [Architecture](./architecture.md) — how the CLI works internally, for contributors.
- [Contributing a logo](../CONTRIBUTING_LOGOS.md) — add a logo to the bundled set.
- [Contributing code](../CONTRIBUTING.md) — dev setup, tests, and pull requests.

## At a glance

| You want to... | Run |
| --- | --- |
| Set up the config | `shadcn-logos init` |
| Add logos | `shadcn-logos add vercel github` |
| Preview without writing files | `shadcn-logos add vercel --dry-run` |
| Browse the catalog | `shadcn-logos list` |
| Find a logo | `shadcn-logos search database` |
| Manage the cache | `shadcn-logos cache --stats` |

No install is required: `bunx shadcn-logos@latest <command>` runs the latest version on demand.
