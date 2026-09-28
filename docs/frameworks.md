# Frameworks and output

`shadcn-logos` writes idiomatic code for each framework. Every component takes a `size` prop
that drives both width and height, and forwards extra attributes (`className`, `style`,
event handlers, and so on) to the root `<svg>`.

The file name is the logo title lowercased and hyphenated (`Next.js` becomes `next-js`). The
component name is the title in PascalCase with a `Logo` suffix (`GitHub` becomes `GitHubLogo`).
Names that start with a digit are prefixed so they stay valid identifiers (`1Password` becomes
`Logo1Password`).

## React

File extension: `.tsx` (TypeScript) or `.jsx` (JavaScript).

```tsx
import React from 'react'

interface VercelLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: string | number
}

export function VercelLogo(props: VercelLogoProps) {
  const { size = 24, ...otherProps } = props

  return (
    <svg width={size} height={size} {...otherProps} viewBox="0 0 24 24"><path d="..." fill="currentColor" /></svg>
  )
}

export default VercelLogo
```

Use it:

```tsx
import { VercelLogo } from './src/components/logos/vercel'

<VercelLogo />                                  {/* default size */}
<VercelLogo size={48} />                        {/* resized */}
<VercelLogo className="text-blue-500" />        {/* inherits color via currentColor */}
<VercelLogo onClick={handleClick} aria-label="Vercel" />
```

SVG attributes are emitted as valid JSX (`fill-rule` becomes `fillRule`, `class` becomes
`className`), so React does not warn or drop them.

## Vue

File extension: `.vue`.

```vue
<template>
  <svg :width="size" :height="size" v-bind="$attrs" viewBox="0 0 24 24"><path d="..." fill="currentColor" /></svg>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'VercelLogo',
  inheritAttrs: false,
  props: {
    size: {
      type: [String, Number],
      default: 24
    }
  }
})
</script>
```

Use it:

```vue
<VercelLogo :size="48" class="text-blue-500" />
```

`inheritAttrs: false` plus `v-bind="$attrs"` puts your `class`, `style`, and listeners on the
`<svg>` itself rather than a wrapper.

## Svelte

File extension: `.svelte`.

```svelte
<script lang="ts">
  export let size: string | number = 24
</script>

<svg width={size} height={size} {...$$restProps} viewBox="0 0 24 24"><path d="..." fill="currentColor" /></svg>
```

Use it:

```svelte
<VercelLogo size={48} class="text-blue-500" />
```

`{...$$restProps}` forwards any extra attributes to the `<svg>`.

## Raw SVG

Set `framework: "raw"` to write optimized `.svg` files with no component wrapper (`format`
is ignored: raw always writes one `.svg` per logo). Use them anywhere: `<img src="...">`, CSS backgrounds, or inline.

```bash
shadcn-logos add vercel   # writes vercel.svg to your outputDir
```

## Light/dark and wordmark variants

Many SVGL logos ship a dark-theme variant and a wordmark (icon plus name). By default `add`
writes the light icon. Pick another variant with flags; the variant goes into the file and
component name, so you can keep several side by side:

```bash
shadcn-logos add vercel                    # vercel.tsx               → VercelLogo
shadcn-logos add vercel --dark             # vercel-dark.tsx          → VercelDarkLogo
shadcn-logos add vercel --wordmark         # vercel-wordmark.tsx      → VercelWordmarkLogo
shadcn-logos add vercel --wordmark --dark  # vercel-wordmark-dark.tsx → VercelWordmarkDarkLogo
```

With `colorMode: "currentColor"` a monochrome icon already adapts to dark mode, so `--dark`
matters most with `colorMode: "original"`. Wordmark components bind `size` to the height
only; the width follows the aspect ratio.

## How the size prop works

SVGs are optimized with [svgo](https://github.com/svg/svgo), which removes the hard-coded
`width`/`height` and keeps the `viewBox`. The generator then injects `width`/`height` bound
to the `size` prop directly on the `<svg>` tag. That is why `<VercelLogo size={32} />`
actually renders at 32x32: the size flows through to the SVG instead of being ignored.

## Color: `currentColor` vs `original`

With the default `colorMode: "currentColor"`, fill and stroke colors become `currentColor`,
so a logo takes on the surrounding text color. This is ideal for monochrome icons and dark
mode:

```tsx
<span className="text-black dark:text-white">
  <GitHubLogo size={24} />
</span>
```

`fill="none"` is left untouched, so outlined and stroke-only logos still render correctly.
Set `colorMode: "original"` to keep each brand's real colors.

For a one-off choice, use `shadcn-logos add google --color-mode original` or
`shadcn-logos add github --color-mode currentColor`. These flags work with every output framework
and do not change the saved config. Prefer `original` for multicolor logos.
