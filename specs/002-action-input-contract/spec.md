# Feature Specification: Action Contract Inputs

**Feature Branch**: `002-action-input-contract`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "Create specification for Section A of specification-items.md (Action contract / inputs) using spec code 002. After specification is created, remove the items in specification-items.md. References: project-requirements.md, action.yml."

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

### User Story 1 - Configure action with defaults (Priority: P1)

As a workflow author, I want to provide only the required `filename` input and rely on the action’s documented defaults for all other inputs so that I can adopt the action quickly without unexpected behavior changes.

**Why this priority**: This is the baseline contract for every user; if defaults or input names differ from documentation, workflows break or behave unexpectedly.

**Independent Test**: Can be fully tested by invoking the action with only `filename` set and verifying the resulting behavior is identical to explicitly providing each default input value.

**Acceptance Scenarios**:

1. **Given** a workflow step using this action with `filename` provided and all other inputs omitted, **When** the step runs, **Then** the action behaves as if the following defaults were provided: `badge=false`, `fail_below_min=false`, `format=text`, `hide_branch_rate=false`, `hide_complexity=false`, `indicators=true`, `output=console`, `thresholds="50 75"`.
2. **Given** two workflows that differ only in that one explicitly provides the default values while the other omits the optional inputs, **When** both workflows run against the same repository contents, **Then** they produce equivalent observable results (same output structure and same pass/fail outcome).

---

### User Story 2 - Provide multiple coverage files (Priority: P2)

As a workflow author, I want to specify multiple coverage files using a comma-separated list and/or glob patterns so that I can summarize coverage from one or more tooling outputs without rewriting my workflow.

**Why this priority**: Most real repositories generate multiple coverage artifacts (e.g., per-module or per-language), so flexible file selection is essential.

**Independent Test**: Can be fully tested by running the action with `filename` set to a CSV value and a glob value and confirming both patterns are treated as distinct patterns.

**Acceptance Scenarios**:

1. **Given** `filename` is set to `"a.xml,b.xml"`, **When** the action processes the input, **Then** it treats it as two file patterns: `a.xml` and `b.xml`.
2. **Given** `filename` is set to a glob pattern (for example `"coverage/**/coverage.cobertura.xml"`), **When** the action processes the input, **Then** it treats it as a single pattern that may match multiple files.
3. **Given** a file path containing spaces, **When** the workflow author quotes the `filename` value in workflow YAML, **Then** the action receives and interprets that path as a single pattern.

---

### User Story 3 - Boolean inputs behave predictably (Priority: P3)

As a workflow author, I want boolean-like inputs to follow a strict and predictable parsing rule so that I can safely control action behavior without ambiguity across different workflows.

**Why this priority**: Misinterpreting booleans can cause silent behavior changes (e.g., failing builds unexpectedly or hiding metrics).

**Independent Test**: Can be fully tested by providing a matrix of boolean-like input values and verifying only case-insensitive `"true"` enables the behavior.

**Acceptance Scenarios**:

1. **Given** a boolean-like input is set to any of `"true"`, `"TRUE"`, or `"True"`, **When** the action evaluates the input, **Then** it is treated as enabled/true.
2. **Given** a boolean-like input is set to any other value (including `"1"`, `"yes"`, `"on"`, empty string, or an arbitrary string), **When** the action evaluates the input, **Then** it is treated as disabled/false.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- `filename` is missing, empty, or contains only whitespace.
- `filename` contains leading/trailing spaces around commas (for example `" a.xml , b.xml "`).
- `filename` contains consecutive commas or trailing commas that would otherwise produce empty patterns.
- `filename` includes characters that require quoting/escaping in workflow YAML.
- Optional inputs are explicitly set to an empty string (distinguish from “omitted”).

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001 (Traceability: FR-1)**: The action MUST accept inputs exactly as declared in action metadata: `filename`, `badge`, `fail_below_min`, `format`, `hide_branch_rate`, `hide_complexity`, `indicators`, `output`, `thresholds`.
- **FR-002 (Traceability: FR-1)**: When an optional input is omitted, the action MUST behave as if the default from action metadata were provided:
  - `badge=false`
  - `fail_below_min=false`
  - `format=text`
  - `hide_branch_rate=false`
  - `hide_complexity=false`
  - `indicators=true`
  - `output=console`
  - `thresholds="50 75"`
- **FR-003 (Traceability: FR-2)**: The action MUST interpret `filename` as a comma-separated list of file patterns.
- **FR-004 (Traceability: FR-2)**: The action MUST treat each pattern in `filename` as a distinct pattern, including when patterns are glob patterns that may match multiple files.
- **FR-005 (Traceability: FR-2)**: The action MUST support file paths containing spaces, provided the workflow author quotes the value in workflow YAML.
- **FR-006 (Traceability: FR-3)**: Boolean-like inputs (`badge`, `fail_below_min`, `hide_branch_rate`, `hide_complexity`, `indicators`) MUST evaluate to true only when the provided string equals `"true"` case-insensitively.

Assumptions (used to keep requirements testable and unambiguous):
- “Omitted input” means not provided in the workflow step’s `with:` block; explicitly providing an empty string is treated as “provided”.
- When splitting `filename` by commas, whitespace surrounding each token is ignored for the purpose of identifying the pattern.
- Empty `filename` tokens (for example from consecutive commas) are ignored.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: For each input listed in action metadata, omitting it produces behavior equivalent to explicitly providing its documented default.
- **SC-002**: For every boolean-like input, the value is treated as true for `"true"` in any casing, and treated as false for at least: `"1"`, `"yes"`, `"on"`, empty string, and an arbitrary non-empty string.
- **SC-003**: `filename` supports both CSV and glob patterns such that test workflows can select multiple files using either `"a.xml,b.xml"` or a glob that matches more than one file.
- **SC-004**: No user-facing action input names are added, removed, or renamed relative to action metadata.

## Constitution Check *(mandatory)*

Reference: `.specify/memory/constitution.md`

- **Affected principles**: I (Action Interface Parity), II (Cross-Platform, Node-Only Runtime), V (Quality Gates).
- **Interface parity**: This feature explicitly defines and verifies parity for the inputs contract (names, defaults, and parsing semantics).
- **Cross-platform**: Requirements are stated in terms of workflow inputs and parsing outcomes, and do not assume OS-specific path behavior.
- **Preserve upstream artifacts**: No legacy artifacts are removed or modified as part of this specification.
- **Security and quality gates**: This feature is considered complete only when automated tests cover defaults, CSV/glob parsing, and strict boolean semantics.
