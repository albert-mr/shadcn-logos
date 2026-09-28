# Configuration

`shadcn-logos` reads an optional `logos.config.json` file from your project root. Create it
with `shadcn-logos init`, or write it by hand. Without one, `add` detects your framework and
TypeScript and uses defaults in memory. React, Vue, and Svelte components go in
`./src/components/logos`; other projects get SVGs in `./assets/logos`.
An existing invalid config still reports an error (exit code `2`).

## Example

This is the default config that `init -y` writes for a React + TypeScript project:

```json
{
  "framework": "react",
  "typescript": true,
  "outputDir": "./src/components/logos",
  "format": "component",
  "style": {
    "defaultSize": "24",
    "colorMode": "currentColor",
    "cssVariables": true
  },
  "registry": {
    "source": "svgl",
    "cache": true
  }
}
```

## Fields

### `framework`

One of `react`, `vue`, `svelte`, or `raw`. Decides what kind of file `add` writes and how
the `size` prop is wired. `raw` means "no framework", which pairs with `format: "svg"`.
See [Frameworks and output](./frameworks.md).

### `typescript`

`true` or `false`. For React, `true` produces a `.tsx` file with a typed props interface;
`false` produces a `.jsx` file. For Vue and Svelte it toggles `lang="ts"` on the script block.

### `outputDir`

Where files are written, relative to your project root. The directory is created if it does
not exist. Defaults to `./src/components/logos` for frameworks and `./assets/logos` is a
common choice for raw SVG.

### `format`

What to write for each logo:

| Value | Result |
| --- | --- |
| `component` | A framework component (`.tsx` / `.jsx` / `.vue` / `.svelte`). |
| `svg` | An optimized `.svg` file. |
| `both` | A component and an `.svg` file. |

### `style.defaultSize`

The default value of the `size` prop, in pixels, as a string (for example `"24"`). Callers
can always override it per usage: `<VercelLogo size={48} />`.

### `style.colorMode`

| Value | Result |
| --- | --- |
| `currentColor` | Concrete fill and stroke colors are rewritten to `currentColor`, so the logo inherits the surrounding text color. `fill="none"` is preserved. |
| `original` | The logo keeps its own brand colors. |

Override this setting for one `add` command with `--color-mode original` or `--color-mode currentColor`.
The flag applies to every logo in that command, for both component and SVG output, without
changing your config. Use separate commands for logos that need different color modes.

## Reserved fields

These are accepted by the config schema for forward compatibility but do not change behavior
yet. You can leave them at their defaults:

| Field | Notes |
| --- | --- |
| `style.cssVariables` | Reserved. Not yet consumed by the generator. |
| `registry.source` | Always `svgl` today. |
| `registry.cache` | Reserved. Responses are cached regardless (see [Architecture](./architecture.md#caching)). |
| `aliases` | Reserved. A future map of custom names to logos. |
| `$schema` | Optional. A URL to a JSON schema for editor autocomplete, if you add one. |

## Validation

The config is validated with [Zod](https://zod.dev) on every load and save. If a field has
the wrong type or an unknown value (for example `"framework": "angular"`), the CLI reports
exactly which field is wrong and exits with code `2`.
