# Feature Specification: Output Destination

**Feature Branch**: `006-output-destination`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "Create specification for output destination. Use spec code 006."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - View the report in logs (Priority: P1)

As a workflow user, I want the coverage report written to the action log when `output=console`, so I can see the result immediately without managing artifacts.

**Why this priority**: This is the default behavior and the fastest feedback loop.

**Independent Test**: Can be fully tested by running the action with `output=console` and verifying logs contain the report and no output file exists.

**Acceptance Scenarios**:

1. **Given** `output=console` and a valid coverage input, **When** the action runs, **Then** the complete report is written to the action log.
2. **Given** `output=console` and a valid coverage input, **When** the action runs, **Then** no output file is created in the workspace.

---

### User Story 2 - Save the report to a file (Priority: P2)

As a workflow user, I want the coverage report written to a file when `output=file`, so other steps can consume it (for example, posting it as a PR comment).

**Why this priority**: File output enables downstream automation without requiring users to scrape logs.

**Independent Test**: Can be fully tested by running the action with `output=file` and verifying the correct legacy filename is created with the same content as the console report.

**Acceptance Scenarios**:

1. **Given** `output=file` and `format=text`, **When** the action runs successfully, **Then** `code-coverage-results.txt` is created in the workspace root.
2. **Given** `output=file` and `format=markdown`, **When** the action runs successfully, **Then** `code-coverage-results.md` is created in the workspace root.
3. **Given** `output=file`, **When** the action runs successfully, **Then** the file content exactly matches the report content that would be written to the action log for the same inputs.

---

### User Story 3 - Write the report to both places (Priority: P3)

As a workflow user, I want the coverage report written both to the action log and to a file when `output=both`, so I can see it immediately and also reuse it later.

**Why this priority**: This is the most flexible mode and avoids forcing a tradeoff between visibility and automation.

**Independent Test**: Can be fully tested by running the action with `output=both` and verifying both the log output and the expected file output are present in one run.

**Acceptance Scenarios**:

1. **Given** `output=both` and `format=text`, **When** the action runs successfully, **Then** the report is written to the action log and `code-coverage-results.txt` is created.
2. **Given** `output=both` and `format=markdown`, **When** the action runs successfully, **Then** the report is written to the action log and `code-coverage-results.md` is created.

---

### Edge Cases

- When `output` is not one of `console`, `file`, or `both`, the action fails and does not create an output file.
- When `output=console`, no output file is created even if a same-named file already exists in the workspace.
- When `output=file` or `output=both` and the output file cannot be written (e.g., permissions or invalid working directory), the action fails with a clear error message.
- The output filename depends only on `format` (text vs markdown) and not on coverage inputs.
- File output is written to the workflow working directory (workspace root) and does not write to arbitrary paths.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The action MUST accept an `output` input whose supported values are `console`, `file`, and `both`.
- **FR-002**: When `output=console`, the action MUST write the complete report to the action log.
- **FR-003**: When `output=console`, the action MUST NOT create or modify an output file.
- **FR-004**: When `output=file`, the action MUST write the complete report to a file in the workspace root using the legacy filenames:
  - If `format=text`, filename is `code-coverage-results.txt`.
  - If `format=markdown`, filename is `code-coverage-results.md`.
- **FR-005**: When `output=file`, the action MUST NOT write the report to the action log.
- **FR-006**: When `output=both`, the action MUST satisfy both the `console` and `file` behaviors in a single run.
- **FR-007**: When `output=file` or `output=both`, the file content MUST exactly match the report content that would be produced for console output with the same inputs.
- **FR-008**: When `output` is an unsupported value, the action MUST fail and log `Error: Unknown output type.`

### Assumptions

- This feature defines *where* the report is written; it does not change how the report content is computed or formatted.
- The "workspace root" is the workflow working directory where the action executes.
- Writing the output file does not require network access.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For `output=console`, users can find the full report content in the action log for 100% of successful runs.
- **SC-002**: For `output=file`, a report file is created at the expected legacy filename for 100% of successful runs.
- **SC-003**: For `output=both`, users can verify both log output and file output are present in the same run for 100% of successful runs.
- **SC-004**: In automated tests, output destination behavior is deterministic across supported runner operating systems (same inputs and coverage files produce the same content and destination outcomes).

## Constitution Check *(mandatory)*

Reference: `.specify/memory/constitution.md`

- Which core principles are affected by this feature?
  - Action Interface Parity (I): output behavior and error messaging must match the established contract.
  - Cross-Platform, Node-Only Runtime (II): file paths and working-directory assumptions must be portable.
  - Quality Gates (V): output destination behavior should be covered by automated tests.
- Does this change preserve GitHub Action interface parity (inputs/outputs/behavior)?
  - Yes. The behavior matches the established input contract and legacy filenames.
- Does this remain cross-platform and Node-only (no Docker/.NET requirement)?
  - Yes. The behavior is defined in a runner-agnostic way.
- Does this preserve upstream artifacts / avoid unnecessary deletions?
  - Yes. No legacy assets are removed.
- Are security and quality gates (tests + static analysis) satisfied?
  - The spec requires deterministic behavior and clear failures; implementation should add/maintain tests for console/file/both modes.
