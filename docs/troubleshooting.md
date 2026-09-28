# Troubleshooting

Each failure exits with a specific [code](./commands.md#exit-codes), which is also useful in
scripts and CI.

## The detected framework or output directory is wrong

Run `add` from the app's root (the directory with its `package.json`). Config is optional;
without it, the CLI detects your framework and TypeScript. To override the detected settings,
create a config:

```bash
shadcn-logos init      # interactive
shadcn-logos init -y   # accept defaults
```

## "Invalid configuration: ..." (exit 2)

A field in `logos.config.json` has the wrong type or an unknown value. The message names the
exact field, for example `framework: Invalid enum value`. Fix that field (see
[Configuration](./configuration.md)) or regenerate the file:

```bash
shadcn-logos init -y
```

## "Logos not found: ..." (exit 4)

The names you typed did not match anything. The CLI prints close suggestions. To find the
right name:

```bash
shadcn-logos search <partial-name>
shadcn-logos list --search <partial-name>
```

Names are matched loosely, so try the brand's common spelling (`nextjs`, `next.js`, and
`Next.js` all work).

## Network errors (exit 3)

The catalog is fetched from the SVGL API, so building the full list needs a connection.
Network calls time out after 15 seconds rather than hanging.

- Check your internet connection and try again.
- If SVGL is temporarily down, wait and retry. A recent successful run may still be cached
  for up to an hour.

Note: even bundled local logos currently require the catalog fetch to succeed, because name
resolution loads the full catalog first.

## "Permission denied" / cannot write (exit 5)

The CLI could not write to your `outputDir`.

- Make sure the directory is writable by your user.
- Or point `outputDir` somewhere you own (edit `logos.config.json`).

## "File already exists. Use --force to overwrite."

A file with that name is already in `outputDir`, and the CLI will not overwrite your edits by
default.

```bash
shadcn-logos add github --force   # overwrite
```

Or delete the existing file first.

## The `size` prop is not resizing the logo

Make sure you are on a current version (`shadcn-logos --version`) and regenerate the
component:

```bash
shadcn-logos add vercel --force
```

The generated `<svg>` should include `width={size} height={size}` (React/Svelte) or
`:width="size" :height="size"` (Vue). If you edited the file and removed those, the prop will
not take effect.

## Stale or wrong results

Clear the cache and try again:

```bash
shadcn-logos cache --clear
```

## Still stuck?

Open an issue with the command you ran, the full output, and your `logos.config.json`:
<https://github.com/albert-mr/shadcn-logos/issues>
