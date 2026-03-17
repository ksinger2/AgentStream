# Contributing to {{PROJECT_NAME}}

## Quick Start

1. Fork and clone the repo
2. Install dependencies (see `CLAUDE.md` → How to Run)
3. Create a branch: `git checkout -b <type>/<description>`
4. Make your changes
5. Run tests (see `CLAUDE.md` → How to Test)
6. Submit a pull request

## Branch Naming

Format: `<type>/<short-description>`

| Type | Usage | Example |
|------|-------|---------|
| `feat/` | New features | `feat/user-dashboard` |
| `fix/` | Bug fixes | `fix/login-timeout` |
| `refactor/` | Code refactoring | `refactor/auth-middleware` |
| `docs/` | Documentation | `docs/api-endpoints` |
| `test/` | Adding tests | `test/payment-flow` |
| `chore/` | Maintenance | `chore/update-deps` |

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`

**Examples**:
```
feat(auth): add OAuth2 login with Google
fix(api): handle null response from payment gateway
docs(readme): update installation steps for Windows
```

Breaking changes: add `!` after type or `BREAKING CHANGE:` in footer.

## Pull Request Requirements

- [ ] PR title follows conventional commit format
- [ ] Description explains what and why (not just how)
- [ ] Tests added for new functionality
- [ ] All existing tests pass
- [ ] No linting errors
- [ ] Self-reviewed the diff before requesting review
- [ ] Documentation updated if behavior changed

## Code Review

- Reviews are expected within 1 business day
- Address all comments or explain why you disagree
- Don't merge your own PRs (unless solo maintainer)
- Squash merge to main (keeps history clean)

## Development Guidelines

- Follow existing patterns before introducing new ones
- Check for reusable code before writing new utilities
- Keep PRs focused — one logical change per PR
- Write tests that describe behavior, not implementation
- See `HardRules.md` for non-negotiable standards

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Use issue templates for structured reporting
