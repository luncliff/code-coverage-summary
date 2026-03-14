# code-coverage-summary Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-14

## Guidelines

- Run tests after implementation.
- NO fake implementation, NO mocks, and NO stubs. The implementation must be real and complete.

## Active Technologies
- TypeScript 5.x, targeting Node 20 + `@actions/core ^1.11.1`, `@actions/glob ^0.5.0`, `fast-xml-parser ^5.4.2`
- TypeScript 5.9 targeting Node.js 20 (GitHub Actions runtime) + @actions/core, @actions/glob, fast-xml-parser (006-output-destination)
- N/A (filesystem reads for coverage inputs; optional output file written to workspace) (006-output-destination)

## Project Structure

```text
src/
tests/
```

## Commands

```
npm install
npm test
npm run build
```

## Code Style

TypeScript 5.x, targeting Node 20+: Follow standard conventions
