# Security Policy

## Supported Versions

The latest published version receives security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.5.x   | :white_check_mark: |
| < 0.5   | :x:                |

## Reporting a Vulnerability

Please **do not open a public issue** for security vulnerabilities.

Report privately through GitHub's
[private vulnerability reporting](https://github.com/albert-mr/shadcn-logos/security/advisories/new):
open the repository's **Security** tab and choose **Report a vulnerability**. We aim to
acknowledge reports within a few days.

Include as much detail as you can:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix, if you have one

## Security Considerations

### Logo Sources
- SVG routes come from the SVGL catalog (https://svgl.app), fetched via its API (https://api.svgl.app)
- Downloaded SVGs are optimized with svgo before installation
- `<script>` elements and `on*` event handlers are removed from SVGs

### File System Access
- Components are written only to the output directory you choose
- The CLI also keeps a response cache under `~/.shadcn-logos/cache` (override with `SHADCN_LOGOS_CACHE_DIR`)
- No other files are written outside the project directory

### Network Requests
- All HTTP requests use HTTPS
- API responses are validated against a schema before processing
- Requests time out after 15 seconds, covering the whole request
- Cached responses expire after a fixed TTL

## Best Practices

When using shadcn-logos:
- Always review generated components before committing
- Use `--dry-run` to preview changes
- Keep the CLI updated to the latest version
- Report any suspicious behavior immediately