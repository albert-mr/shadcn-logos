# Contributing to shadcn-logos

Thank you for your interest in contributing to shadcn-logos! This document provides simple guidelines for contributing to the project.

## 🚀 Quick Start

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/shadcn-logos.git`
3. Install dependencies: `bun install`
4. Make your changes
5. Verify your changes: `bun run check` (lint, type-check, test, build)
6. Submit a pull request

## 📋 Development Setup

### Prerequisites
- [Bun](https://bun.sh) >= 1.0.0
- Node.js >= 18

### Local Development
```bash
# Install dependencies
bun install

# Run in development mode
bun run dev --help

# Run the test suite
bun run test

# Lint and type-check
bun run lint
bun run type-check

# Build the project
bun run build

# Run everything CI runs, in one command
bun run check
```

## 🎯 What We're Looking For

### High Priority
- Bug fixes and stability improvements
- Performance optimizations
- Better error messages and user experience
- Additional framework support (Angular, Solid, etc.)
- Test coverage improvements

### Medium Priority
- New CLI features and commands
- Documentation improvements
- Code quality enhancements
- Additional logo sources/registries

## 📝 Pull Request Guidelines

### Before Submitting
- [ ] Test your changes locally
- [ ] Run `bun run build` successfully
- [ ] Update documentation if needed
- [ ] Add tests for new features
- [ ] Follow existing code style

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All existing tests pass

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
```

## 🐛 Bug Reports

When reporting bugs, please include:
- CLI version (`shadcn-logos --version`)
- Operating system and version
- Node.js/Bun version
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## 💡 Feature Requests

For new features:
- Describe the use case
- Explain why it would be valuable
- Consider implementation complexity
- Provide examples if possible

## 📚 Code Style

- Use TypeScript for new code
- Follow existing naming conventions
- Add JSDoc comments for public APIs
- Keep functions focused and small
- Use meaningful variable names

## 🧪 Testing

- Write tests for new features
- Update tests when modifying existing code
- Ensure all tests pass before submitting
- Test on multiple operating systems if possible

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Keep discussions on topic
- Report inappropriate behavior

## 📞 Getting Help

- Check existing issues and discussions
- Ask questions in issue comments
- Join community discussions
- Tag maintainers for urgent matters

## 🎉 Recognition

Contributors will be acknowledged in:
- Release notes
- README contributors section
- Special thanks for significant contributions

---

Thank you for contributing to shadcn-logos! 🙏