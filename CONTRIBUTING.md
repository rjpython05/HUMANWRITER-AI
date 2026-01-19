# Contributing to HumanWriter AI

Thank you for your interest in contributing to HumanWriter AI!

## Development Setup

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/humanwriter-ai.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Follow the setup guide in [SETUP.md](./SETUP.md)

## Code Style

### TypeScript/JavaScript
- Use ESLint configuration provided
- Follow Airbnb style guide
- Use meaningful variable names
- Add JSDoc comments for public functions

### Python
- Follow PEP 8
- Use type hints
- Use docstrings for all functions
- Format with Black

### Commits
Follow conventional commits:
- `feat: Add new feature`
- `fix: Fix bug`
- `docs: Update documentation`
- `refactor: Refactor code`
- `test: Add tests`
- `chore: Update dependencies`

## Testing

All code must include tests:
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical flows

Run tests before submitting:
```bash
npm test              # Backend/Frontend
pytest               # AI Engine
npm run test:e2e     # E2E tests
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Code Review

All submissions require review. We use GitHub pull requests for this purpose.

## Questions?

Open an issue or contact: dev@humanwriter.ai
