# code-coverage-summary Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-14

## Guidelines

- Run tests after implementation.
- NO fake implementation, NO mocks, and NO stubs. The implementation must be real and complete.

## Active Technologies
- TypeScript 5.x, targeting Node 20 + `@actions/core ^1.11.1`, `@actions/glob ^0.5.0`, `fast-xml-parser ^5.4.2`
- filesystem reads for coverage inputs; optional output file written to workspace

## Project Structure

```text
src/
tests/
```

## Source Organization

- `src/index.ts`
  - Main action entrypoint and orchestration boundary.
  - Change this when action inputs, logging flow, or top-level execution behavior changes.
- `src/file-discovery.ts`
  - Owns workspace-relative filename parsing and glob expansion.
  - Keep this focused on deterministic local file discovery for GitHub Actions runners.
- `src/coverage-parser.ts`
  - Owns Cobertura XML compatibility, aggregation rules, and fixture-family support.
  - Treat this file as the compatibility boundary for report producers such as standard Cobertura, gcovr, SimpleCov, and MATLAB.
- `src/output-generator.ts`
  - Owns user-visible report shape for text and markdown output.
  - Keep badge, indicator, threshold, and summary formatting changes here so output compatibility stays easy to review.
- `src/output-destination.ts`
  - Owns where generated output goes: console, file, or both.
  - Keep filesystem side effects localized here.
- `src/threshold-enforcer.ts`
  - Owns fail-below-min behavior and user-facing threshold annotations.
  - Keep enforcement decisions isolated so formatting and parsing remain separate concerns.
- `__tests__/`
  - Mirrors the runtime behavior above and acts as the compatibility safety net.
  - Put detailed scenario coverage in the matching test files instead of this instruction file.

## Commands

```
npm install
npm test
npm run build
```

## Code Style

TypeScript 5.x, targeting Node 20+: Follow standard conventions
