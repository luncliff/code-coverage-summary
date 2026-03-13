# Feature Specification: Cobertura XML parsing

**Feature Branch**: `003-cobertura-xml-parsing`  
**Created**: 2026-03-13  
**Status**: Draft  
**Input**: User description: "Create a new feature specification from specification-items.md Section C (spec code 003, Cobertura XML parsing) and cross-check with project-requirements.md. Follow repository spec template conventions and create the new spec directory under specs/003-<name> consistent with existing specs/001 and specs/002. After generating the specification, remove Section C from specification-items.md as instructed. Summarize changes made and new files added."

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

### User Story 1 - Parse required Cobertura root metrics (Priority: P1)

As a workflow author, I want the action to validate required Cobertura root attributes so that missing or malformed coverage files fail quickly with a clear message.

**Why this priority**: Required root attributes are mandatory for calculating summary coverage; without them the report would be misleading.

**Independent Test**: Can be fully tested by running the action against fixtures with and without required root attributes and verifying success or failure messages.

**Acceptance Scenarios**:

1. **Given** a Cobertura file that includes `line-rate`, `lines-covered`, and `lines-valid`, **When** the action parses the file, **Then** it accepts the file for further processing without a parsing error.
2. **Given** a Cobertura file that omits at least one required root attribute, **When** the action parses the file, **Then** it fails the step and logs a parsing error that includes the filename.

---

### User Story 2 - Allow optional branch metrics (Priority: P2)

As a workflow author, I want Cobertura files without branch metrics to still be processed so that my coverage reports work even when branch data is unavailable.

**Why this priority**: Some tools only emit line coverage; the action must remain compatible with those outputs.

**Independent Test**: Can be fully tested by running the action with coverage files that omit branch metrics and verifying the run succeeds with branch output suppressed.

**Acceptance Scenarios**:

1. **Given** Cobertura files that include no branch metrics, **When** the action runs, **Then** the step succeeds (unless other failure conditions apply) and branch rate output is suppressed regardless of hide-branch settings.
2. **Given** Cobertura files that include branch metrics, **When** the action runs, **Then** branch rate information is eligible for display according to existing output rules.

---

### User Story 3 - Extract package rows with stable naming (Priority: P3)

As a workflow author, I want each `<package>` element to produce a report row, with consistent fallback naming for unnamed packages, so that the report remains complete and deterministic.

**Why this priority**: Package-level details are a core part of the report; missing names or metrics should not break the output.

**Independent Test**: Can be fully tested with fixtures that include named and unnamed packages, plus missing numeric attributes, and verifying the resulting rows and names.

**Acceptance Scenarios**:

1. **Given** a Cobertura file with multiple `<package>` elements, **When** the action parses the file, **Then** it produces one output row per package in encounter order.
2. **Given** a package element with a missing or empty `name`, **When** the action parses the file, **Then** it assigns a fallback name using the coverage file basename and a per-file sequence number.
3. **Given** a package element with missing or unparseable numeric attributes, **When** the action parses the file, **Then** it treats those values as `0` for that package row.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Required root attributes exist but are non-numeric or malformed; the action treats this as a parsing error and fails the step.
- Some files include branch metrics while others do not; branch output is shown only when at least one file includes branch metrics.
- A coverage file contains no `<package>` elements; the action produces no package rows but still succeeds if required root attributes are present.
- Multiple unnamed packages within the same file; fallback names increment per file and remain stable across runs.
- Package attributes include whitespace or unexpected formatting; numeric parsing failures fall back to `0` per package.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001 (Traceability: FR-7)**: The action MUST parse Cobertura XML and require the root coverage attributes `line-rate`, `lines-covered`, and `lines-valid`.
- **FR-002 (Traceability: FR-7)**: If any required root attribute is missing or cannot be parsed as a numeric value, the action MUST log a parsing error that includes the filename and MUST fail the step.
- **FR-003 (Traceability: FR-8)**: Branch metrics (`branch-rate`, `branches-covered`, `branches-valid`) MUST be optional and their absence MUST NOT cause the action to fail.
- **FR-004 (Traceability: FR-8)**: When branch metrics are absent across all processed files, the action MUST suppress branch rate output regardless of hide-branch settings.
- **FR-005 (Traceability: FR-9)**: The action MUST extract one package row per `<package>` element, capturing name, line rate, branch rate (when present), and complexity (when present).
- **FR-006 (Traceability: FR-9)**: If a package’s numeric attributes are missing or unparseable, the action MUST default those values to `0` for that package.
- **FR-007 (Traceability: FR-9)**: If a package name is missing or empty, the action MUST assign a fallback name in the format `<coverage-file-basename> Package <i>` where `i` starts at 1 per file in encounter order.

Assumptions and scope notes:

- This specification covers Cobertura parsing behavior only; aggregation, output formatting, and threshold logic are covered by other specifications.
- “Coverage file basename” means the filename without directory path or extension.
- If a coverage file has zero `<package>` elements, the action produces no package rows but still processes summary metrics.

### Key Entities

- **Cobertura Coverage Root**: The `<coverage>` element containing required summary attributes (`line-rate`, `lines-covered`, `lines-valid`) and optional branch attributes.
- **Package Row**: A report row derived from a `<package>` element, including name, line rate, branch rate (when present), and complexity.
- **Fallback Package Name**: A deterministic, per-file name applied when a package is unnamed, based on the coverage file basename and encounter order.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: For any Cobertura file that includes all required root attributes, parsing completes without emitting a parsing error for that file.
- **SC-002**: For any Cobertura file missing a required root attribute, the action fails the step and logs a parsing error that includes the filename.
- **SC-003**: When all provided files omit branch metrics, the report contains zero branch rate fields even if the hide-branch option is disabled.
- **SC-004**: For a file with `N` package elements (including unnamed packages), the action outputs exactly `N` package rows with deterministic fallback names and numeric defaults set to `0` when attributes are missing.

## Constitution Check *(mandatory)*

Reference: `.specify/memory/constitution.md`

- Which core principles are affected by this feature?
  - I (Action Interface Parity) for Cobertura parsing expectations and error messaging.
  - V (Quality Gates) for ensuring parsing behaviors are covered by automated tests.
- Does this change preserve GitHub Action interface parity (inputs/outputs/behavior)?
  - Yes. It documents Cobertura parsing requirements and failure behavior that match legacy expectations.
- Does this remain cross-platform and Node-only (no Docker/.NET requirement)?
  - Yes. Requirements are described in terms of inputs and parsing outcomes, with no runtime dependencies assumed.
- Does this preserve upstream artifacts / avoid unnecessary deletions?
  - Yes. The specification does not require removal of any legacy assets.
- Are security and quality gates (tests + static analysis) satisfied?
  - This feature should be considered complete only when automated tests cover required root attributes, optional branch metrics, package extraction defaults, and fallback naming.
