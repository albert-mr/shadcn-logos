# Command reference

Every command works with a global install (`shadcn-logos <command>`) or on demand
(`bunx shadcn-logos@latest <command>`). Most commands have a short alias.

```bash
shadcn-logos --help        # list all commands
shadcn-logos --version     # print the version
shadcn-logos <command> -h  # help for one command
```

---

## `init` (alias: `i`)

Create the `logos.config.json` file in your project root. This stores your framework,
output directory, and style preferences.

```bash
shadcn-logos init        # interactive prompts
shadcn-logos init -y     # accept defaults, no prompts
```

| Option | Description |
| --- | --- |
| `-y, --yes` | Skip the prompts. Auto-detects your framework and TypeScript from `package.json` / `tsconfig.json`, and uses defaults for everything else. |

If a config already exists, `init` asks before overwriting (in `-y` mode it overwrites
with the detected settings). See [Configuration](./configuration.md) for what each field means.

---

## `add <logos...>` (alias: `a`)

Add one or more logos to your project. This is the main command.

```bash
shadcn-logos add vercel
shadcn-logos add vercel github react typescript
shadcn-logos add vercel --dry-run
shadcn-logos add github --force
shadcn-logos add vercel --wordmark --dark
```

| Option | Description |
| --- | --- |
| `-f, --force` | Overwrite files that already exist. Without this, an existing file is an error so you do not lose edits. |
| `--dry-run` | Print what would be written, without creating any files. |
| `-s, --silent` | Minimal output: no progress bar, no usage examples. |
| `--dark` | Use the dark-theme variant when the logo has one (falls back to the only variant otherwise). |
| `-w, --wordmark` | Add the wordmark (icon plus name) instead of the icon. Fails if the logo has no wordmark. |

How names resolve: each name is matched against the catalog in this order: exact title,
then title ignoring punctuation (`nextjs` matches `Next.js`), then a substring match. If
nothing matches, the logo is reported as not found with close suggestions, and nothing is
written. What gets written (a component, an SVG, or both) depends on your config `format`
and `framework`. See [Frameworks and output](./frameworks.md).

---

## `list` (alias: `ls`)

Browse the catalog, grouped by category.

```bash
shadcn-logos list
shadcn-logos list --category ai
shadcn-logos list --search data
shadcn-logos list --limit 200
```

| Option | Description |
| --- | --- |
| `-c, --category <category>` | Show only logos in a category, case-insensitive (for example `ai`, `database`). |
| `-s, --search <query>` | Filter the list by name. |
| `--limit <number>` | Maximum number of logos to show. Default `50`. |

---

## `search <query>` (alias: `s`)

Find logos by name and get a ready-to-run `add` command for the top results.

```bash
shadcn-logos search react
shadcn-logos search database
```

The query is required. Results show the title, category, and whether light/dark variants
exist.

---

## `cache`

Manage the on-disk response cache (see [Architecture](./architecture.md#caching) for where
it lives and how long it lasts).

```bash
shadcn-logos cache --stats   # entry count, total size, age of entries
shadcn-logos cache --clear   # delete all cached data
```

| Option | Description |
| --- | --- |
| `--stats` | Show cache statistics. |
| `--clear` | Remove all cached data. |

Run `cache` with no option to print these two subcommands.

---

## Global options

These appear in `--help` and are accepted on any command:

| Option | Status |
| --- | --- |
| `--version` | Active. Prints the installed version. |
| `--help` | Active. Prints help. |

---

## Exit codes

The CLI returns a specific exit code per failure type, which is handy in scripts and CI:

| Code | Meaning |
| --- | --- |
| `0` | Success. |
| `1` | General error. |
| `2` | Configuration error (missing or invalid `logos.config.json`). |
| `3` | Network error (could not reach the registry). |
| `4` | Logo not found. |
| `5` | Permission error (could not write to the output directory). |
| `130` | Cancelled with Ctrl+C. |

See [Troubleshooting](./troubleshooting.md) for what to do about each one.
