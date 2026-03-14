# Implementation Plan: Coverage Aggregation & Threshold Classification

**Branch**: `copilot/create-specification-with-section-d` | **Date**: 2026-03-14 | **Spec**: `/specs/005-create-specification-using-section-d-spec-code-005/spec.md`
**Input**: Feature specification from `/specs/005-create-specification-using-section-d-spec-code-005/spec.md`

## Summary
Implement legacy-compatible multi-file coverage aggregation, branch metric suppression, threshold parsing, and badge classification for the Cobertura-based GitHub Action. The plan aligns aggregation inputs with Cobertura root attribute semantics and badge coloring with Shields.io conventions, then updates parsing/output logic and tests to match the specification.

## Technical Context
**Language/Version**: TypeScript 5.9 targeting Node.js 20 (GitHub Actions runtime)  
**Primary Dependencies**: @actions/core, @actions/glob, fast-xml-parser  
**Storage**: N/A (filesystem reads for coverage inputs; optional output file)  
**Testing**: Jest with ts-jest  
**Target Platform**: GitHub Actions runners (Linux/Windows/macOS) running node20  
**Project Type**: GitHub Action (Node/TypeScript)  
**Performance Goals**: Process multiple Cobertura XML files and render output within typical CI runtime (seconds for dozens of files)  
**Constraints**: Node-only runtime, no Docker/.NET requirement; preserve legacy behavior and avoid network calls during execution  
**Scale/Scope**: Dozens of coverage files via glob patterns; medium-sized Cobertura XML reports

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

- Action interface parity preserved (inputs/outputs/behavior): **Pass** — no new inputs/outputs and legacy aggregation rules are codified.
- Cross-platform support confirmed (Linux/Windows/macOS) with Node-only runtime: **Pass** — no platform-specific tooling added.
- Upstream artifacts preserved (no unnecessary deletions; legacy clearly labeled): **Pass** — legacy .NET assets remain untouched.
- Security posture maintained (dependency hygiene; pinned actions in CI where applicable): **Pass** — no new dependencies or network calls planned.
- Quality gates defined (tests updated/added; static analysis stays healthy): **Pass** — plan includes regression tests for parsing/output rules.

If any gate is violated, record it under **Complexity Tracking** with justification.

## Project Structure

### Documentation (this feature)
```text
specs/005-create-specification-using-section-d-spec-code-005/
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
├── coverage-parser.ts
├── file-discovery.ts
├── output-generator.ts
├── index.ts
├── coverage.cobertura.xml
├── coverage.gcovr.xml
└── CodeCoverageSummary/      # legacy .NET reference

dist/

action.yml

__tests__/
├── coverage-parser.test.ts
├── file-discovery.test.ts
├── output-generator.test.ts
├── index.test.ts
├── fixtures/
└── helpers/
```

**Structure Decision**: Single-project TypeScript GitHub Action. Core parsing/output logic lives in `src/`, with Jest tests under `__tests__/` and legacy upstream assets preserved under `src/CodeCoverageSummary/`.

## Phase 0: Research
- Review Cobertura XML root attribute semantics (line-rate, branch-rate, lines-covered, lines-valid, branches-covered, branches-valid) to confirm aggregation inputs and why unweighted averaging matches legacy behavior.
- Validate Shields.io static badge URL format and supported status colors (`critical`, `yellow`, `success`) for badge classification output.
- Document decisions in `research.md` using the required Decision/Rationale/Alternatives format with citations.
- **Comment step**: add a brief "References & usage" note in `research.md` listing each citation and how it informs aggregation and badge decisions.

**Output**: `specs/005-create-specification-using-section-d-spec-code-005/research.md`

## Phase 1: Design & Contracts
- **Data model**: capture `CoverageSummary`, `PackageCoverage`, `ThresholdConfig`, and `BadgeClassification` entities with validation rules (clamping thresholds, branch-metrics detection, derived averages).
- **Contracts**: document the GitHub Action interface (inputs/outputs) and output formatting rules, including branch suppression when metrics are absent and legacy threshold parsing behavior.
- **Quickstart**: provide local dev/test steps and an example execution using Cobertura fixtures.
- **Agent context update**: run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` to record any new technology context.

**Outputs**:
- `specs/005-create-specification-using-section-d-spec-code-005/data-model.md`
- `specs/005-create-specification-using-section-d-spec-code-005/contracts/*`
- `specs/005-create-specification-using-section-d-spec-code-005/quickstart.md`

## Post-Phase 1 Constitution Check
- Action interface parity preserved: **Pass**
- Cross-platform Node-only runtime retained: **Pass**
- Upstream artifacts preserved: **Pass**
- Security posture maintained: **Pass**
- Quality gates covered by updated tests/static analysis: **Pass**

## Phase 2: Implementation Planning (for /speckit.tasks)
- Enumerate code changes to aggregation logic (`coverage-parser.ts`, `index.ts`) and output generation (`output-generator.ts`).
- Define regression tests for multi-file aggregation, branch suppression, and threshold parsing edge cases.
- Update documentation (README or action docs) if output formatting or thresholds behavior needs clarification.

## Complexity Tracking
None.
