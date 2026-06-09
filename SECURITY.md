# Security Policy

## Supported Versions

The latest published version receives security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                |

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
- All logos are fetched from the trusted SVGL API (https://api.svgl.app)
- SVGs are optimized and sanitized before installation
- No executable code is embedded in logo files

### File System Access
- The CLI only writes to user-specified directories
- File operations include proper permission checks
- No system files are modified outside the project directory

### Network Requests
- All HTTP requests use HTTPS
- API responses are validated before processing
- Caching is implemented securely with proper TTL

## Best Practices

When using shadcn-logos:
- Always review generated components before committing
- Use `--dry-run` to preview changes
- Keep the CLI updated to the latest version
- Report any suspicious behavior immediately