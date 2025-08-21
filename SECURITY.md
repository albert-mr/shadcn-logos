# Security Policy

## Supported Versions

We currently support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within shadcn-logos, please follow these steps:

1. **Do NOT open a public issue** for security vulnerabilities
2. Send an email to the maintainers describing the issue
3. Include as much detail as possible:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if you have one)

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