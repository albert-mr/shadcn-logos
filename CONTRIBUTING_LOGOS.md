# Contributing Logos

Most logos come from [SVGL](https://svgl.app). **If the logo belongs in SVGL, submit it there**
(see "Contributing" in the [SVGL README](https://github.com/pheralb/svgl#readme)): it reaches every SVGL
user and shows up here automatically, with light/dark and wordmark variants.

Bundle a logo in this repo only when SVGL won't take it or you need it sooner.

## How to Add a Logo

### 1. Prepare the SVG File

Your SVG should be:
- **Clean and optimized** - Remove unnecessary elements and compress
- **Scalable** - Should look good at different sizes (16px to 256px)  
- **Monochrome or brand colors** - Avoid gradients when possible
- **Under 10KB** - Keep file sizes small for performance

### 2. Add the SVG File

Place your SVG file in the `logos/` directory:

```
logos/
  └── your-logo.svg
```

**Naming convention**: Use lowercase with hyphens (e.g., `my-company.svg`, `awesome-tool.svg`)

### 3. Add Logo Definition

Edit `data/logos.ts` and add your logo to the `localLogos` array:

```typescript
export const localLogos: LocalLogo[] = [
  // ... existing logos
  {
    id: 'your-logo',
    title: 'Your Logo',
    category: 'Startup', // or 'Community', 'Custom'
    route: 'your-logo'
  }
]
```

Category counts are derived from `localLogos`, so there is nothing else to update.

## Categories

Use these categories for consistency:

- **Community** - Open source projects, dev tools, community projects
- **Startup** - New companies, startup logos  
- **Custom** - Personal projects, one-off logos

## Example Contribution

Here's a complete example of adding a logo for "Acme Corp":

**1. Add SVG file:** `logos/acme-corp.svg`

**2. Update `data/logos.ts`:**
```typescript
{
  id: 'acme-corp',
  title: 'Acme Corp',
  category: 'Startup',
  route: 'acme-corp'
}
```

**3. Test locally:**
```bash
bunx shadcn-logos@latest add acme-corp
```

## Guidelines

- **Check SVGL first** - If your logo exists on [SVGL](https://svgl.app), don't duplicate it here
- **Brand permission** - Only add logos you have permission to use
- **Quality over quantity** - We prefer well-crafted, useful logos
- **No NSFW content** - Keep it professional
- **File size matters** - Optimize your SVGs before submitting

## SVG Optimization Tips

Use tools like:
- [SVGO](https://github.com/svg/svgo) - `npx svgo your-logo.svg`
- [SVGOMG](https://jakearchibald.github.io/svgomg/) - Online optimizer
- Remove `width/height` attributes (let CSS handle sizing)
- Remove unnecessary `id` attributes and comments

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b add-acme-logo`)
3. Add your logo files and data
4. Test the logo works: `bunx shadcn-logos@latest add your-logo`
5. Commit your changes
6. Open a pull request

**PR Title format:** `Add [LogoName] logo`

**PR Description should include:**
- Logo name and company/project
- Category chosen
- Brief description of what it's for
- Confirmation you have permission to use the logo

## Review Process

- Maintainers will review for quality and appropriateness
- We may ask for optimizations or changes
- Once approved, your logo will be available to all users!

## Questions?

Open an issue if you have questions about contributing logos.