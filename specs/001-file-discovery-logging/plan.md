# Implementation Plan: File discovery and diagnostic logging

**Branch**: `copilot/001-file-discovery-logging` | **Date**: 2026-03-13 | **Spec**: `/specs/001-file-discovery-logging/spec.md`  
**Input**: Feature specification from `/specs/001-file-discovery-logging/spec.md`

## Summary

Implement deterministic coverage file discovery by parsing the `filename` input into comma-separated glob patterns, resolving them relative to the workspace with `@actions/glob`, logging each matched file once with the `Coverage File:` prefix, and preserving the existing failure message when no files match. Determinism and deduping requirements rely on `@actions/glob` behavior and are validated with targeted tests.

## Technical Context

**Language/Version**: TypeScript 5.9 targeting Node.js 20  
**Primary Dependencies**: @actions/core 1.11.1, @actions/glob 0.5.0, fast-xml-parser 5.4.2  
**Storage**: N/A (filesystem only)  
**Testing**: Jest + ts-jest  
**Target Platform**: GitHub Actions runners (Linux/Windows/macOS) using node20  
**Project Type**: GitHub Action (Node.js runtime)  
**Performance Goals**: No explicit targets; keep discovery linear to matched files and avoid extra passes  
**Constraints**: Maintain action interface parity, deterministic ordering, cross-platform path handling, Node-only runtime  
**Scale/Scope**: Typical repositories with dozens or hundreds of coverage files per run

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

- Action interface parity preserved (inputs/outputs/behavior): **Pass** (no new inputs or outputs; preserves error/log messages)
- Cross-platform support confirmed (Linux/Windows/macOS) with Node-only runtime: **Pass** (uses @actions/glob and Node path handling)
- Upstream artifacts preserved (no unnecessary deletions; legacy clearly labeled): **Pass** (no deletions required)
- Security posture maintained (dependency hygiene; pinned actions in CI where applicable): **Pass** (no new dependencies)
- Quality gates defined (tests updated/added; static analysis stays healthy): **Pass** (tests planned for discovery behavior)

## Project Structure

### Documentation (this feature)

```text
specs/001-file-discovery-logging/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
src/
├── index.ts
├── coverage-parser.ts
├── output-generator.ts
└── CodeCoverageSummary/        # legacy upstream artifacts

__tests__/
dist/
action.yml
```

**Structure Decision**: Single TypeScript action with tests under `__tests__/`; legacy upstream artifacts remain under `src/CodeCoverageSummary/`.

## Complexity Tracking

No constitution violations to record.

## Phase 0: Research Summary

- Documented @actions/glob behaviors (deterministic ordering, deduping, supported patterns, path/OS nuances) and GitHub Actions toolkit recommendations in `research.md`.
- Captured dependency and integration guidance for file discovery inputs and logging.

## Phase 1: Design & Contracts Summary

- Defined discovery entities, validations, and ordering rules in `data-model.md`.
- Authored an action interface contract in `contracts/action-file-discovery.md`.
- Provided workflow examples and expected logs in `quickstart.md`.

## Post-Design Constitution Check

- Action interface parity preserved: **Pass**
- Cross-platform, Node-only runtime maintained: **Pass**
- Upstream artifacts preserved: **Pass**
- Security posture maintained: **Pass**
- Quality gates defined: **Pass**

## Phase 2: Planning Notes

1. Update `src/index.ts` file discovery flow to ensure comma-splitting, trimming, deduped results, and stable logging align with `@actions/glob` behavior.
2. Add/adjust tests in `__tests__/` to cover no-match failure, deduped logging, ordering determinism, and whitespace/empty entry handling.
3. Update documentation references as needed (README or spec artifacts) to reflect deterministic ordering guarantees.
4. **Comment step (references & usage):**
   - `https://github.com/actions/toolkit/blob/main/packages/glob/README.md` → use for documenting supported pattern syntax, exclusion/comment rules, tilde expansion, and platform nuances that inform input parsing guidance.
   - `https://www.npmjs.com/package/@actions/glob` → use for documenting deterministic ordering and deduplication guarantees that drive logging order and unique-match expectations.
