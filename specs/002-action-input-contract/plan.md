# Implementation Plan: Action Contract Inputs (002)

**Branch**: `copilot/002-action-input-contract` | **Date**: 2026-03-14 | **Spec**: `specs/002-action-input-contract/spec.md`  
**Input**: Feature specification from `specs/002-action-input-contract/spec.md`

## Summary

Fix a one-line boolean-parsing inconsistency in `src/index.ts` (`indicators` input uses
`!== 'false'` where it must use `=== 'true'`) and add a comprehensive input-contract test
suite (`__tests__/index.test.ts`) that validates all nine action inputs against their
declared defaults and the strict boolean-parsing rule (FR-001 through FR-006). No action
interface changes are made; `action.yml`, `coverage-parser.ts`, and `output-generator.ts`
are untouched.

**Approach**: Surgical single-file fix + new unit-test file using `jest.mock('@actions/core')`.
Zero breaking changes for well-formed existing workflows.

## Technical Context

**Language/Version**: TypeScript 5.x, targeting Node 20  
**Primary Dependencies**: `@actions/core ^1.11.1`, `@actions/glob ^0.5.0`, `fast-xml-parser ^5.4.2`  
**Storage**: N/A — no persistent state; reads Cobertura XML files at action runtime  
**Testing**: Jest 29 with `ts-jest` preset; `jest.mock('@actions/core')` for input isolation  
**Target Platform**: GitHub-hosted runners — Linux, Windows, macOS (Node 20)  
**Project Type**: GitHub Action (JavaScript/TypeScript, bundled with esbuild)  
**Performance Goals**: N/A — action is I/O-bound; no throughput requirements  
**Constraints**: Must not throw on unrecognized boolean strings (e.g. `"1"`, `"yes"`); must be
a non-breaking change for existing workflows; all boolean inputs must use the same parsing
pattern  
**Scale/Scope**: Single-file fix + ~60–80 lines of new tests; no new dependencies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

| Principle | Status | Notes |
|-----------|--------|-------|
| **I — Action Interface Parity** | ✅ PASS | No input names, defaults, or output formats change. The `indicators` fix is a **bug fix**: the current `!== 'false'` behavior deviates from the documented default (`true`) when an unrecognized value like `"1"` is supplied. Aligning to `=== 'true'` restores the intended contract. |
| **II — Cross-Platform, Node-Only** | ✅ PASS | Only environment-variable reading (`@actions/core`) is changed; no platform-specific code paths introduced. |
| **III — Preserve Upstream Artifacts** | ✅ PASS | No legacy files deleted or modified. |
| **IV — Security-First** | ✅ PASS | No new network calls, no new dependencies. |
| **V — Quality Gates** | ✅ PASS | New test file covers all FR-001–FR-006 scenarios; static analysis unaffected. |

**Post-design re-check**: ✅ — Design decisions in Phase 1 (no schema changes, no new files
other than the test file) do not alter any gate result.

## Project Structure

### Documentation (this feature)

```text
specs/copilot/002-action-input-contract/
├── plan.md        ← this file
├── research.md    ← Phase 0 output
├── data-model.md  ← Phase 1 output
├── quickstart.md  ← Phase 1 output
├── contracts/     ← Phase 1 output
└── tasks.md       ← Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── index.ts                  ← one-line fix (indicators: !== 'false' → === 'true')
├── coverage-parser.ts        ← unchanged
└── output-generator.ts       ← unchanged

__tests__/
├── index.test.ts             ← NEW: input-contract unit tests (FR-001–FR-006)
├── coverage-parser.test.ts   ← unchanged
└── output-generator.test.ts  ← unchanged

action.yml                    ← unchanged
dist/                         ← rebuilt by CI
```

**Structure Decision**: Single-project layout (existing). Feature touches only one source
file and adds one new test file. No reorganization required.

## Data Model

This feature introduces no new data structures. The only data-model-relevant concern is the
`OutputOptions.indicators: boolean` field in `output-generator.ts`, which receives the
parsed value from `src/index.ts`. The fix ensures the value is correctly `true` or `false`
before it reaches `OutputOptions`.

See `data-model.md` for the formal entity summary.

## Contracts

The action's user-facing contract is defined by `action.yml`. This feature does **not**
change that contract; it restores conformance to it.

See `contracts/action-inputs.md` for the formal input contract documentation.

## Quickstart

See `quickstart.md` for a minimal workflow example demonstrating correct boolean input usage
after this fix.

## Complexity Tracking

> No Constitution violations. Table left intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| — | — | — |
