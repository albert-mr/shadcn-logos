# Logo examples

These examples use React + TypeScript and Tailwind CSS. Save the components under
`src/components/` so the relative imports resolve. The brands are examples; substitute
your own customers, technology stack, or supported integrations.

Run these commands from your app root once for all three examples:

```bash
bunx shadcn-logos@latest add github vercel --color-mode currentColor
bunx shadcn-logos@latest add react slack figma google --color-mode original
```

No config is needed. If you already have one, use its `outputDir` for the imports and make
sure it selects React, TypeScript, and component output. Reuse any logos already installed;
`--force` regenerates a file and overwrites your edits.

## Logo wall

The same layout works for a customer logo wall or a technology stack. Text labels make
the brands readable without relying on the images.

```tsx
import { GitHubLogo } from './logos/github'
import { VercelLogo } from './logos/vercel'
import { ReactLogo } from './logos/react'

export function LogoWall() {
  return (
    <section aria-label="Technology stack">
      <ul className="flex flex-wrap items-center justify-center gap-8 text-slate-900 dark:text-white">
        {[
          { name: 'GitHub', Logo: GitHubLogo },
          { name: 'Vercel', Logo: VercelLogo },
          { name: 'React', Logo: ReactLogo },
        ].map(({ name, Logo }) => (
          <li key={name} className="flex items-center gap-3">
            <Logo size={32} aria-hidden="true" focusable="false" />
            <span>{name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
```

## Integration grid

Use original colors for multicolor brands. This is a display grid; connecting accounts
belongs to your application's integration flow.

```tsx
import { GitHubLogo } from './logos/github'
import { SlackLogo } from './logos/slack'
import { FigmaLogo } from './logos/figma'

export function IntegrationGrid() {
  return (
    <ul aria-label="Integrations" className="grid gap-4 text-slate-900 sm:grid-cols-3 dark:text-white">
      {[
        { name: 'GitHub', description: 'Code repositories', Logo: GitHubLogo },
        { name: 'Slack', description: 'Team messaging', Logo: SlackLogo },
        { name: 'Figma', description: 'Design files', Logo: FigmaLogo },
      ].map(({ name, description, Logo }) => (
        <li key={name} className="rounded-lg border border-slate-300 p-5 dark:border-slate-700">
          <Logo size={32} aria-hidden="true" focusable="false" />
          <h3 className="mt-3 font-semibold">{name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
        </li>
      ))}
    </ul>
  )
}
```

## Social sign-in buttons

Pass your existing authentication handlers as props. The buttons provide presentation
and click handling; they do not configure OAuth or an authentication provider.

```tsx
'use client'

import { GitHubLogo } from './logos/github'
import { GoogleLogo } from './logos/google'

export function SignInButtons({ onGitHubSignIn, onGoogleSignIn }: {
  onGitHubSignIn: () => void
  onGoogleSignIn: () => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {[
        { name: 'GitHub', Logo: GitHubLogo, onClick: onGitHubSignIn },
        { name: 'Google', Logo: GoogleLogo, onClick: onGoogleSignIn },
      ].map(({ name, Logo, onClick }) => (
        <button
          key={name}
          type="button"
          onClick={onClick}
          className="flex items-center justify-center gap-3 rounded-md border border-slate-300 bg-white px-4 py-3 text-slate-900 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
        >
          <Logo size={20} aria-hidden="true" focusable="false" />
          Continue with {name}
        </button>
      ))}
    </div>
  )
}
```

For Vue, Svelte, and raw SVG usage, see [Frameworks and output](./frameworks.md).
