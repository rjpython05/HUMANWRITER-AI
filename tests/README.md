# Testing Guide

## Overview

Comprehensive test suite for HumanWriter AI.

## Structure

```
tests/
├── ai-engine/          # Python tests (pytest)
├── backend-api/        # Node.js tests (Jest)
├── scraper/            # Scraper tests
├── webapp/             # Frontend tests (Jest + React Testing Library)
└── e2e/                # End-to-end tests (Playwright)
```

## Running Tests

### AI Engine (Python)
```bash
cd ai-engine
pytest tests/ -v --cov=src
```

### Backend API (Node.js)
```bash
cd backend-api
npm test
npm run test:coverage
```

### Frontend (Next.js)
```bash
cd webapp
npm test
npm run test:watch
```

### E2E Tests
```bash
npm run test:e2e
```

## Test Coverage Goals

- Unit tests: 80%+ coverage
- Integration tests: Key flows covered
- E2E tests: Critical user journeys

## Writing Tests

Follow patterns in existing test files. Use:
- pytest for Python
- Jest for JavaScript/TypeScript
- React Testing Library for React components
- Playwright for E2E

## CI/CD

Tests run automatically on:
- Pull requests
- Commits to main branch
- Pre-deployment
