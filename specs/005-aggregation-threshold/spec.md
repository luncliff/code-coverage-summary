# Feature Specification: Coverage Aggregation & Threshold Classification

**Feature Branch**: `005-create-specification-using-section-d-spec-code-005`  
**Created**: 2026-03-14  
**Status**: Draft  
**Input**: User description: "Create specification using Section D (spec code 005) from /home/runner/work/code-coverage-summary/code-coverage-summary/specification-items.md. Incorporate guidance from project-requirements.md and .github/workflows/test-action.yml. After specification is generated, remove that Section D from specification-items.md as instructed. Apply changes directly in repo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Aggregate multi-file coverage results (Priority: P1)

As a CI maintainer running the action on multiple coverage files (including globbed inputs), I want the summary totals and rates to aggregate in a legacy-compatible way so that historical thresholds and reports remain consistent.

**Why this priority**: Multi-file aggregation is a core compatibility expectation and directly affects reported coverage metrics used in workflows.

**Independent Test**: Can be fully tested by running the action against two known coverage files and verifying the summary totals and rates match the defined aggregation rules.

**Acceptance Scenarios**:

1. **Given** two coverage files with known line/branch counts and root line/branch rates, **When** the action runs, **Then** the summary covered/valid counts equal the sum of each file’s counts and the summary rates equal the unweighted average of the per-file root rates.
2. **Given** multiple files with package complexity values, **When** the action runs, **Then** the summary complexity equals the sum of all per-package complexity values across the matched files.

---

### User Story 2 - Hide branch rate when branch data is absent (Priority: P2)

As a workflow author, I want branch-rate output to be suppressed when branch metrics are effectively absent so that the report does not show misleading or empty branch columns.

**Why this priority**: This avoids confusing output when coverage inputs do not provide branch data, aligning with legacy expectations.

**Independent Test**: Can be fully tested by running the action with coverage files that provide zero branch metrics and verifying branch output is omitted.

**Acceptance Scenarios**:

1. **Given** coverage inputs where branch rate and branch counts are all zero, **When** the action generates a report, **Then** branch-related fields/columns are omitted even if the user did not request hiding branch data.
2. **Given** coverage inputs where branch metrics are present and non-zero, **When** the action generates a report, **Then** branch-related fields/columns are included unless the user explicitly hides them.

---

### User Story 3 - Parse thresholds and classify badge color (Priority: P3)

As a workflow author using thresholds in my CI configuration, I want threshold parsing and badge classification to follow legacy rules so that visual indicators and pass/fail decisions are predictable.

**Why this priority**: Threshold parsing and badge color classification are user-visible outcomes tied to CI quality gates.

**Independent Test**: Can be fully tested by providing a matrix of threshold inputs and verifying parsed lower/upper bounds and resulting badge classifications.

**Acceptance Scenarios**:

1. **Given** thresholds provided as "60 80", **When** the action computes badge classification, **Then** the lower bound is 60, the upper bound is 80, and the classification follows those bounds.
2. **Given** thresholds provided as a single value (e.g., "70"), **When** the action computes badge classification, **Then** the lower bound is 70 and the upper bound follows the legacy defaulting/clamping rules.
3. **Given** thresholds where lower exceeds upper or values fall outside 0–100, **When** the action parses them, **Then** the values are adjusted to the defined legacy-compatible bounds before classification.

---

### Edge Cases

- What happens when threshold values are below 0 or above 100?
- How does the system handle thresholds where the lower bound exceeds the upper bound?
- What happens when all branch rate metrics are zero but line metrics are non-zero?
- How does the aggregation behave when one file has a zero line rate and another has a non-zero line rate?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When multiple coverage files match, the system MUST sum covered/valid line counts, covered/valid branch counts (when present), and complexity across all matched files.
- **FR-002**: For multiple matched files, the system MUST compute overall line rate and branch rate as the unweighted average of each file’s root rate values, not recomputed from summed counts.
- **FR-003**: If summary branch rate and branch counts are all zero, the system MUST omit branch-related output fields even when the user did not request hiding branch data.
- **FR-004**: The system MUST parse the `thresholds` input using legacy-compatible rules: accept `"<lower> <upper>"` or `"<lower>"`, clamp values to 0–100, and if lower exceeds upper set upper to lower plus 10 (then clamp).
- **FR-005**: Badge classification MUST follow threshold rules using the summary line rate: below lower is `critical`, between lower and upper is `yellow`, and at/above upper is `success`.

### Key Entities *(include if feature involves data)*

- **Coverage File**: An individual coverage input containing root rates, counts, and package complexity values.
- **Coverage Summary**: The aggregated totals and rates produced from all matched coverage files.
- **Thresholds**: The lower and upper bounds used to classify coverage status and badges.
- **Badge Classification**: The status value (`critical`, `yellow`, `success`) derived from thresholds and summary line rate.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In regression tests with multiple coverage files, 100% of summary totals match the sum of per-file totals and summary rates match the unweighted average of per-file root rates.
- **SC-002**: In runs where branch rate and counts are all zero, branch-related output fields are omitted in 100% of tested formats.
- **SC-003**: For a test suite covering single-value thresholds, dual-value thresholds, out-of-range values, and lower>upper cases, 100% of parsed threshold bounds match the expected legacy-compatible adjustments.
- **SC-004**: Badge classifications match the threshold rules in 100% of tested cases and remain consistent across supported workflow environments.

## Assumptions

- Aggregation and threshold behaviors must remain compatible with existing workflows that use the action in CI (including those configured similarly to the current test workflow).
- The summary line rate is the metric used for badge classification and threshold comparisons unless explicitly changed in future requirements.

## Scope

### In Scope

- Aggregating covered/valid counts and complexity across multiple coverage files.
- Calculating overall line/branch rates using the legacy unweighted average method.
- Suppressing branch output when branch metrics are absent.
- Parsing thresholds and classifying badge status.

### Out of Scope

- Changing how coverage files are discovered or parsed.
- Altering output formatting rules beyond the aggregation and badge classification behaviors described here.
- Introducing new inputs or modifying existing action inputs.

## Dependencies

- Relies on coverage inputs providing per-file root rates and counts that can be aggregated.
- Requires existing workflow inputs (including `thresholds`) to be passed as documented in the action interface.

## Constitution Check *(mandatory)*

Reference: `.specify/memory/constitution.md`

- Which core principles are affected by this feature? **Action Interface Parity** and **Cross-Platform, Node-Only Runtime** (behavioral compatibility and consistent calculations across runners).
- Does this change preserve GitHub Action interface parity (inputs/outputs/behavior)? **Yes** — it codifies legacy aggregation, threshold parsing, and badge classification behaviors.
- Does this remain cross-platform and Node-only (no Docker/.NET requirement)? **Yes** — requirements are platform-agnostic and align with existing workflow coverage on Linux/Windows/macOS.
- Does this preserve upstream artifacts / avoid unnecessary deletions? **Yes** — no legacy artifacts are removed.
- Are security and quality gates (tests + static analysis) satisfied? **Yes** — success criteria and assumptions call for regression coverage of the behaviors.
