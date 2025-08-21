# Publishing Guide for shadcn-logos

## NPM Publishing Instructions

### First-Time Setup
1. Create an NPM account at https://www.npmjs.com
2. Login to NPM:
   ```bash
   npm login
   ```

### Publishing Process
1. **Build the project:**
   ```bash
   bun run build
   ```

2. **Test locally:**
   ```bash
   npm link
   shadcn-logos --help
   ```

3. **Publish to NPM:**
   ```bash
   npm publish
   ```
   
   Or use the release script:
   ```bash
   npm run release
   ```

### Version Management
- **Patch release** (bug fixes): `npm version patch`
- **Minor release** (new features): `npm version minor`
- **Major release** (breaking changes): `npm version major`

### Pre-publishing Checklist
- [ ] All tests pass
- [ ] Build completes successfully
- [ ] README is up to date
- [ ] CHANGELOG is updated
- [ ] Version bumped appropriately
- [ ] Git repository is clean

### Post-publishing
1. Create a GitHub release with the same version tag
2. Announce on social media/communities
3. Update documentation if needed

## Maintenance

### Regular Updates
- Keep dependencies updated
- Monitor security vulnerabilities
- Respond to issues and PRs
- Update SVGL API integration as needed

### Semantic Versioning
Follow [Semantic Versioning](https://semver.org/):
- MAJOR.MINOR.PATCH
- Breaking changes require major version bump
- New features require minor version bump
- Bug fixes require patch version bump