# Implementation Plan: Cobertura XML Parsing (003)

**Branch**: `003-cobertura-xml-parsing` | **Date**: 2026-03-15 | **Spec**: `specs/003-cobertura-xml-parsing/spec.md`  
**Input**: Feature specification from `specs/003-cobertura-xml-parsing/spec.md`

## Summary

Enforce Cobertura XML root metric requirements (`line-rate`, `lines-covered`, `lines-valid`),
accept optional branch metrics without failing, and produce deterministic package rows with
fallback names and numeric defaults. Update the parser’s error handling to include filenames,
allow files with zero packages, and expand the coverage-parser test suite + fixtures to cover
missing required attributes, absent branch metrics, and package fallback behaviors.

<!-- Research reference step (to incorporate during implementation):
1. Cobertura XML Output (gcovr docs) — validate root attribute names and package attribute conventions.
2. GitLab Cobertura coverage report docs — confirm branch metrics are optional and commonly omitted.
3. GitHub Actions JavaScript action docs/workflow commands — align parsing errors with `@actions/core` failure patterns.
-->

## Technical Context

**Language/Version**: TypeScript 5.9, targeting Node 20  
**Primary Dependencies**: `@actions/core ^1.11.1`, `@actions/glob ^0.5.0`, `fast-xml-parser ^5.4.2`  
**Storage**: N/A — reads Cobertura XML files from the workspace  
**Testing**: Jest 29 with `ts-jest`; fixture-based parser unit tests  
**Target Platform**: GitHub-hosted runners (Linux/Windows/macOS) using Node 20  
**Project Type**: GitHub Action (JavaScript/TypeScript, bundled via esbuild)  
**Performance Goals**: N/A — keep parsing linear in file size; no new throughput targets  
**Constraints**: Preserve action interface parity; no new dependencies; parsing failures must include filenames; branch metrics remain optional  
**Scale/Scope**: Parser updates + new fixtures/tests in `src/` and `__tests__/coverage-parser.test.ts`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

| Principle | Status | Notes |
|-----------|--------|-------|
| **I — Action Interface Parity** | ✅ PASS | Parsing behavior aligns with Cobertura expectations; no input/output contract changes. |
| **II — Cross-Platform, Node-Only** | ✅ PASS | Parser changes remain Node-only and filesystem-based. |
| **III — Preserve Upstream Artifacts** | ✅ PASS | No legacy files removed or relocated. |
| **IV — Security-First** | ✅ PASS | No new dependencies or network calls introduced. |
| **V — Quality Gates** | ✅ PASS | Plan includes fixture-backed unit tests for all new parsing behaviors. |

**Post-design re-check**: ✅ — Phase 1 artifacts reinforce parity (Cobertura contract, data model) without adding new constraints.

## Project Structure

### Documentation (this feature)

```text
specs/003-cobertura-xml-parsing/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── cobertura-xml.md # Cobertura parsing contract
└── tasks.md             # Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── coverage-parser.ts           # Update root/package parsing + error messaging
├── coverage.cobertura.xml       # Existing fixture
├── coverage.gcovr.xml           # Existing fixture
├── coverage.simplecov.xml       # Existing fixture
├── coverage.MATLAB.xml          # Existing fixture
├── coverage.missing-root.xml    # NEW: missing required root attributes
├── coverage.no-branches.xml     # NEW: no branch metrics
└── coverage.no-packages.xml     # NEW: zero <package> elements

__tests__/
└── coverage-parser.test.ts      # Add tests for required root attributes, optional branch metrics,
                                 # zero packages, and fallback naming defaults
```

**Structure Decision**: Single-project layout (existing). Feature touches only parser + test fixtures.

## Data Model

Parsing continues to populate `CoverageSummary` and `PackageCoverage` while adding explicit
root-metric validation and optional branch-metric handling. See `data-model.md` for the
formal entity definitions and validation rules.

## Contracts

Cobertura XML parsing rules are documented as an external contract for coverage producers.
See `contracts/cobertura-xml.md` for required root attributes, optional branch metrics, and
package element defaults.

## Quickstart

See `quickstart.md` for a minimal workflow example and sample Cobertura snippets that
exercise the required/optional parsing behaviors.

## Complexity Tracking

> No Constitution violations. Table left intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| — | — | — |
