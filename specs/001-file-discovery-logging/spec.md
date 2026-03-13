# Feature Specification: File discovery and diagnostic logging

**Feature Branch**: `001-file-discovery-logging`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "Create specification for section B File discovery and diagnostic logging"

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

### User Story 1 - Discover coverage files from patterns (Priority: P1)

As a workflow author, I want to provide one or more coverage file patterns so the action can find the intended coverage files in the workspace.

**Why this priority**: If files cannot be discovered reliably, the rest of the action (parsing, summarizing, thresholds) cannot proceed.

**Independent Test**: Can be fully tested by running the action against a repo fixture containing multiple coverage files and verifying which files are discovered.

**Acceptance Scenarios**:

1. **Given** a workspace that contains a file matching the provided pattern, **When** the action runs, **Then** the action includes that file in the matched set.
2. **Given** a `filename` input containing a comma-separated list of patterns, **When** the action runs, **Then** the action evaluates each pattern and unions all matches.
3. **Given** a workspace path that includes spaces (and the workflow input passes the pattern as a single quoted YAML string), **When** the action runs, **Then** the action evaluates the pattern without splitting the path incorrectly.

---

### User Story 2 - Fail fast when no files match (Priority: P2)

As a workflow author, I want the action to fail with a clear, compatibility-preserving message when my patterns match no files.

**Why this priority**: “No matches” is a common configuration mistake; failing early prevents misleading downstream output.

**Independent Test**: Can be fully tested by running the action with patterns that match nothing and asserting the step fails and logs the expected message.

**Acceptance Scenarios**:

1. **Given** a workspace where none of the provided patterns match any files, **When** the action runs, **Then** the step fails and logs exactly: `Error: No files found matching glob pattern.`

---

### User Story 3 - See which files were used (diagnostic logging) (Priority: P3)

As a workflow author, I want to see which coverage files were discovered so I can diagnose pattern mistakes and confirm the action is using the intended inputs.

**Why this priority**: It reduces iteration time when configuring `filename` patterns.

**Independent Test**: Can be fully tested by running the action against a fixture with multiple matches and asserting that each matched file results in one trace log line.

**Acceptance Scenarios**:

1. **Given** that one or more files are matched, **When** the action runs, **Then** it emits one log line per matched file prefixed with `Coverage File: `.
2. **Given** two consecutive runs with the same workspace contents and inputs, **When** the action runs, **Then** the set and ordering of `Coverage File: ` lines are identical across runs.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- `filename` contains extra whitespace around commas (e.g., `a.xml, b.xml`) and still evaluates both patterns.
- `filename` contains empty entries (e.g., `a.xml,,b.xml`) and ignores the empty entry.
- Multiple patterns match the same file; the action treats matched files as a unique set and logs each matched file at most once.
- Some patterns match and some do not; the action proceeds using the matched files and does not fail solely due to a non-matching pattern.
- File discovery must be relative to the workspace working directory (not dependent on where the action code resides).

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: The action MUST interpret the `filename` input as a comma-separated list of one or more file patterns.
- **FR-002**: The action MUST expand patterns relative to the workspace working directory.
- **FR-003**: If zero files match across all provided patterns, the action MUST fail the step and log exactly: `Error: No files found matching glob pattern.`
- **FR-004**: For each matched file, the action MUST emit exactly one log line with the prefix `Coverage File: ` followed by the matched file path.
- **FR-005**: The action MUST be deterministic for file discovery: for a fixed workspace and fixed inputs, the matched file set and the order in which files are logged MUST not vary between runs.
- **FR-006**: When some patterns match and some patterns do not, the action MUST proceed using the files that matched.
- **FR-007**: The action MUST treat matched files as a unique set and MUST NOT process or log the same file more than once in a single run.

Assumptions and scope notes:

- File discovery is evaluated against the workspace contents available at action runtime.
- This specification covers discovery and diagnostic logging only; parsing and report generation are out of scope except where they depend on discovery behavior.

### Key Entities

- **Coverage File Pattern**: A user-provided pattern string derived from `filename` entries.
- **Matched Coverage File**: A workspace file path that matches at least one pattern and is used as an input to subsequent parsing/aggregation stages.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: With any set of inputs that match $N$ files, the action emits exactly $N$ `Coverage File: ` trace lines and continues to subsequent stages.
- **SC-002**: With inputs that match $0$ files, the step fails and emits the exact message `Error: No files found matching glob pattern.`
- **SC-003**: For two consecutive runs under identical workspace contents and inputs, the matched file list (as observed via logs) is identical in both content and order.
- **SC-004**: Users can express file selection using both comma-separated lists and glob-style patterns and consistently get the expected matched set.

## Constitution Check *(mandatory)*

Reference: `.specify/memory/constitution.md`

- Which core principles are affected by this feature?
  - Compatibility with legacy behavior for discovery rules and messages.
  - Deterministic behavior for predictable CI runs.
- Does this change preserve GitHub Action interface parity (inputs/outputs/behavior)?
  - Yes. It is explicitly scoped to `filename` discovery and required log/error messages.
- Does this remain cross-platform and Node-only (no Docker/.NET requirement)?
  - Yes. Requirements are OS-agnostic and do not assume external runtimes.
- Does this preserve upstream artifacts / avoid unnecessary deletions?
  - Yes. This feature does not require removing or altering legacy artifacts.
- Are security and quality gates (tests + static analysis) satisfied?
  - This feature is expected to be covered by automated tests for: no-matches failure message, per-file logging, CSV parsing, and deterministic ordering.
