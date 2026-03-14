# Implementation Plan: Output Destination

**Branch**: `006-output-destination` | **Date**: 2026-03-14 | **Spec**: `/specs/006-output-destination/spec.md`
**Input**: Feature specification from `/specs/006-output-destination/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Document and implement (or verify) legacy-compatible output destination behavior for the generated coverage report:

- `output=console` writes the report to the action log only
- `output=file` writes the report to a deterministic legacy filename in the workspace root only
- `output=both` writes to both log and file

The plan focuses on validating `output` early (fail-fast), using `@actions/core` for logging/failures, writing files with Node filesystem APIs, and adding targeted tests to prevent regressions.

## Technical Context

**Language/Version**: TypeScript 5.9 targeting Node.js 20 (GitHub Actions runtime)
**Primary Dependencies**: @actions/core, @actions/glob, fast-xml-parser
**Storage**: N/A (filesystem reads for coverage inputs; optional output file written to workspace)
**Testing**: Jest with ts-jest
**Target Platform**: GitHub Actions runners (Linux/Windows/macOS) running node20
**Project Type**: GitHub Action (Node/TypeScript)
**Performance Goals**: Output routing is constant-time relative to report size; file writes should be bounded by report length
**Constraints**: Node-only runtime; no Docker/.NET requirement; preserve legacy filenames and error messages; avoid network calls
**Scale/Scope**: Single report per run; report size typically small (log-safe) but must be written deterministically

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

- Action interface parity preserved (inputs/outputs/behavior)
- Cross-platform support confirmed (Linux/Windows/macOS) with Node-only runtime
- Upstream artifacts preserved (no unnecessary deletions; legacy clearly labeled)
- Security posture maintained (dependency hygiene; pinned actions in CI where applicable)
- Quality gates defined (tests updated/added; static analysis stays healthy)

Gate status:
- Action interface parity preserved: **Pass** — aligns to `output` values `console|file|both`, legacy filenames, and error message `Error: Unknown output type.`
- Cross-platform Node-only runtime: **Pass** — uses `@actions/core` logging and Node filesystem APIs.
- Upstream artifacts preserved: **Pass** — no legacy removal.
- Security posture maintained: **Pass** — no new dependencies and no network calls.
- Quality gates defined: **Pass** — plan includes tests verifying destination routing and no-file behavior.

If any gate is violated, record it under **Complexity Tracking** with justification.

## Project Structure

### Documentation (this feature)

```text
specs/006-output-destination/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
```text
src/
├── index.ts                 # action entrypoint (parses inputs, routes output)
├── input-validator.ts        # validates `format` and `output` fail-fast
├── output-generator.ts       # produces the report string
└── CodeCoverageSummary/      # legacy .NET reference

dist/

action.yml

__tests__/
├── input-validator.test.ts
├── error-priority.test.ts
├── index.test.ts
└── fixtures/
```

**Structure Decision**: Single-project TypeScript GitHub Action. Output destination routing belongs at the action entrypoint (`src/index.ts`), with unit tests under `__tests__/`.

## Phase 0: Research

- Confirm official GitHub guidance for logging and step failure behavior, and prefer the toolkit (`@actions/core`) rather than raw workflow commands.
- Confirm how step debug logging is enabled (`ACTIONS_STEP_DEBUG=true`) to ensure debug-level diagnostics are correctly gated.
- Document decisions in `research.md` using the required Decision/Rationale/Alternatives format.
- **Comment step (references & usage)**: In `research.md`, list the official references found (URLs) and a short note for how each will be used to justify implementation and testing choices.

**Output**: `specs/006-output-destination/research.md`

## Phase 1: Design & Contracts

- **Data model**: document the conceptual entities and validation rules for `OutputDestination` and deterministic report filename selection.
- **Contracts**: document the `output` destination contract and legacy filenames.
- **Quickstart**: provide example workflow snippets demonstrating `console`, `file`, and `both`, plus invalid output failure.
- **Agent context update**: run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot`.

**Outputs**:
- `specs/006-output-destination/data-model.md`
- `specs/006-output-destination/contracts/*`
- `specs/006-output-destination/quickstart.md`

## Post-Phase 1 Constitution Check

- Action interface parity preserved: **Pass**
- Cross-platform Node-only runtime retained: **Pass**
- Upstream artifacts preserved: **Pass**
- Security posture maintained: **Pass**
- Quality gates covered by updated tests/static analysis: **Pass**

## Phase 2: Implementation Planning (for /speckit.tasks)

- Confirm output routing in `src/index.ts` matches the contract:
  - `console`: log report only
  - `file`: write report file only
  - `both`: log and write
- Add regression tests that:
  - verify `output=console` does not write a report file
  - verify `output=file` writes the correct legacy filename and does not emit the report text
  - verify `output=both` writes and logs
  - verify invalid `output` fails with `Error: Unknown output type.`
- Ensure tests remain cross-platform (do not assume POSIX shell tooling).

## Complexity Tracking

None.
