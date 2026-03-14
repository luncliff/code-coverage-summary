# Feature Specification: Output Generation

**Feature Branch**: `004-output-generation`  
**Created**: 2025-07-14  
**Status**: Draft  
**Input**: User description: "Create specification for Section E of specification-items.md (Output generation) using spec code 004. Covers text and markdown output formats, complexity numeric formatting, health indicator characters, and badge URL output. References: project-requirements.md, specification-items.md SI-E1–SI-E5."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View a text coverage report (Priority: P1)

As a workflow author, I want the action to emit a human-readable text report so that I can quickly read coverage results directly in the GitHub Actions log without needing to parse structured data.

**Why this priority**: Text output is the default format and the primary way most users consume the action's results; correctness here is foundational for all other output scenarios.

**Independent Test**: Can be fully tested by running the action with `format=text` against a known coverage file and asserting the exact output lines match the expected legacy structure.

**Acceptance Scenarios**:

1. **Given** `format=text` and `badge=false`, **When** the action produces output, **Then** the first line is a package row (not a badge line), and each package row contains the package name and its line rate percentage.
2. **Given** `format=text` and `badge=true`, **When** the action produces output, **Then** the first line is the Shields.io badge URL, followed by a blank line, followed by the package rows.
3. **Given** `format=text` and `hide_branch_rate=false` with branch metrics present, **When** the action produces output, **Then** each package row includes the branch rate after the line rate.
4. **Given** `format=text` and `hide_branch_rate=true`, **When** the action produces output, **Then** package rows do not include the branch rate field.
5. **Given** `format=text` and `hide_complexity=false` with complexity present, **When** the action produces output, **Then** each package row includes the complexity value.
6. **Given** `format=text`, **When** the action produces the summary row, **Then** the summary row includes totals for lines covered and lines valid in parentheses (e.g., `(1200 / 1500)`).

---

### User Story 2 - View a markdown coverage report (Priority: P2)

As a workflow author, I want the action to emit a markdown-formatted report so that I can embed it in pull request comments or job summaries for a polished, readable presentation.

**Why this priority**: Markdown output is the most commonly used format for PR and job summary integration; its structure (table, bold summary row) must match legacy for downstream consumers.

**Independent Test**: Can be fully tested by running the action with `format=markdown` and asserting the table structure, column presence, and bold summary row match the expected legacy markdown output.

**Acceptance Scenarios**:

1. **Given** `format=markdown` and `badge=false`, **When** the action produces output, **Then** the output starts with a markdown table header row (not a badge line).
2. **Given** `format=markdown` and `badge=true`, **When** the action produces output, **Then** the first line is a markdown badge image (`![Code Coverage](...)`), followed by a blank line, followed by the markdown table.
3. **Given** `format=markdown` and `hide_branch_rate=false` with branch metrics present, **When** the action produces output, **Then** the markdown table includes a branch rate column.
4. **Given** `format=markdown` and `hide_branch_rate=true`, **When** the action produces output, **Then** the markdown table does not include a branch rate column.
5. **Given** `format=markdown` and `hide_complexity=false` with complexity present, **When** the action produces output, **Then** the markdown table includes a complexity column.
6. **Given** `format=markdown`, **When** the action produces the summary row, **Then** the summary row values are bolded using `**value**` markdown syntax.

---

### User Story 3 - See health indicators alongside coverage percentages (Priority: P3)

As a workflow author, I want health indicator symbols to appear next to coverage percentages so that I can visually identify whether a package meets, misses, or is near the configured thresholds at a glance.

**Why this priority**: Indicators provide quick visual feedback; using the wrong characters would break visual parity with legacy output and confuse users familiar with the existing format.

**Independent Test**: Can be fully tested by running the action with `indicators=true` across three coverage scenarios (below lower threshold, between thresholds, at/above upper threshold) and asserting the exact symbol rendered in each case.

**Acceptance Scenarios**:

1. **Given** `indicators=true` and a package whose line rate is below the lower threshold, **When** the action produces output, **Then** the health indicator for that package is `❌`.
2. **Given** `indicators=true` and a package whose line rate falls between the lower and upper thresholds, **When** the action produces output, **Then** the health indicator for that package is `➖`.
3. **Given** `indicators=true` and a package whose line rate is at or above the upper threshold, **When** the action produces output, **Then** the health indicator for that package is `✔`.
4. **Given** `indicators=false`, **When** the action produces output, **Then** no health indicator symbols appear in any row.

---

### User Story 4 - Display a Shields.io badge URL in the report (Priority: P4)

As a workflow author, I want the action to output a Shields.io badge URL when `badge=true` so that I can copy and embed it in a README or display it in a PR comment as a live coverage badge.

**Why this priority**: Badge generation is an optional but widely used feature; generating the wrong URL silently would produce a broken or misleading badge without any error.

**Independent Test**: Can be fully tested by running the action with `badge=true` and asserting the generated URL matches the expected Shields.io path format, percent encoding, label, and style parameter.

**Acceptance Scenarios**:

1. **Given** `badge=true` and a summary line rate of 87%, **When** the action produces the badge URL, **Then** the URL encodes the percentage as a whole number (`87`) and includes `style=flat`.
2. **Given** `badge=true`, **When** the action produces the badge URL, **Then** the URL path and label match the legacy Shields.io format (e.g., `https://img.shields.io/badge/Code%20Coverage-87%25-success?style=flat`).
3. **Given** `badge=false`, **When** the action runs, **Then** no badge URL or badge image appears anywhere in the output.

---

### User Story 5 - Complexity values formatted consistently (Priority: P5)

As a workflow author, I want complexity values to be formatted consistently with the legacy tool so that automated comparisons and downstream parsers relying on the existing output structure continue to work.

**Why this priority**: Formatting changes would silently break any downstream tooling or tests that compare against the legacy output format.

**Independent Test**: Can be fully tested by providing packages with integer and non-integer complexity values and asserting the formatted output matches the expected decimal-place rules.

**Acceptance Scenarios**:

1. **Given** a package with complexity equal to an integer value (e.g., `5.0`), **When** the action renders the complexity, **Then** it appears without decimal places (e.g., `5`).
2. **Given** a package with complexity equal to a non-integer value (e.g., `3.14159`), **When** the action renders the complexity, **Then** it appears with exactly 4 decimal places (e.g., `3.1416`).

---

### Edge Cases

- A package has complexity of `0`; it should be rendered as `0` (integer, no decimals) when complexity is not hidden.
- A package has complexity of `0.0000`; it is the integer zero and should render as `0`.
- A package has branch metrics but they are all zero; branch output is suppressed regardless of `hide_branch_rate`.
- The summary line rate rounds to exactly the lower threshold; health indicator should be `➖` (between thresholds).
- The summary line rate rounds to exactly the upper threshold; health indicator should be `✔` (at/above upper).
- `badge=true` with a summary line rate of 100%; percent is encoded as `100` (whole number, no decimals).
- `badge=true` with a summary line rate of 0%; percent is encoded as `0`.
- A markdown table is emitted with only the line rate column when both `hide_branch_rate=true` and `hide_complexity=true` and `indicators=false`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (Traceability: FR-13, SI-E1)**: When `format=text`, the action MUST emit a text report that begins with an optional badge URL line (when `badge=true`) followed by a blank line, then one row per package, then a summary row.
- **FR-002 (Traceability: FR-13, SI-E1)**: In text format, each package row MUST include the package name and its line rate percentage.
- **FR-003 (Traceability: FR-13, SI-E1)**: In text format, each package row MUST include the branch rate when `hide_branch_rate=false` and branch metrics are present; the branch rate MUST be omitted otherwise.
- **FR-004 (Traceability: FR-13, SI-E1)**: In text format, each package row MUST include the complexity value when `hide_complexity=false` and complexity data is present; complexity MUST be omitted otherwise.
- **FR-005 (Traceability: FR-13, SI-E1)**: In text format, the summary row MUST include covered and valid line counts in parentheses (e.g., `(1200 / 1500)`), and similarly for branch counts when branch metrics are shown.
- **FR-006 (Traceability: FR-14, SI-E2)**: When `format=markdown`, the action MUST emit a markdown table with columns dependent on `hide_branch_rate`, `hide_complexity`, and `indicators`.
- **FR-007 (Traceability: FR-14, SI-E2)**: In markdown format, when `badge=true`, the first line MUST be a markdown image tag (`![Code Coverage](<badgeUrl>)`) followed by a blank line before the table.
- **FR-008 (Traceability: FR-14, SI-E2)**: In markdown format, the summary row values MUST be bolded using markdown bold syntax (`**value**`).
- **FR-009 (Traceability: FR-15, SI-E3)**: The action MUST format complexity values as an integer (no decimal places) when the value is a whole number, and with exactly 4 decimal places otherwise.
- **FR-010 (Traceability: FR-17, SI-E4)**: When `indicators=true`, the action MUST render health indicators using these exact characters:
  - Line rate below the lower threshold → `❌`
  - Line rate between lower and upper thresholds → `➖`
  - Line rate at or above the upper threshold → `✔`
- **FR-011 (Traceability: FR-17, SI-E4)**: When `indicators=false`, the action MUST NOT include any health indicator symbol in any output row.
- **FR-012 (Traceability: FR-16, SI-E5)**: When `badge=true`, the action MUST generate a Shields.io badge URL that:
  - Uses the same path and label as the legacy format (`Code%20Coverage`).
  - Encodes the percentage as a whole number (no decimals).
  - Includes `style=flat` as a query parameter.

### Assumptions

- "Branch metrics present" means the parsed coverage data contains non-zero branch rate or branch count values; when all branch values are zero the action treats branch metrics as absent (per SI-D3/FR-8).
- Complexity is treated as absent when all package complexity values are zero or the attribute was not present in the source XML; in that case complexity output is suppressed even if `hide_complexity=false`.
- Percentage values are formatted as whole-number integers by truncating (rounding) to the nearest integer consistent with legacy behavior.
- Health indicator thresholds are evaluated in percentage terms using the same threshold values used for badge color selection.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For every combination of `format`, `badge`, `hide_branch_rate`, `hide_complexity`, and `indicators` inputs, the action output structure exactly matches the expected legacy structure as verified by automated snapshot or assertion tests.
- **SC-002**: All five health indicator scenarios (below lower, between thresholds, at/above upper, exactly at lower, exactly at upper) render the correct character in both text and markdown formats.
- **SC-003**: All badge URL tests pass: the URL path, label, percent encoding (whole number), and `style=flat` parameter are correct for coverage values of 0%, 50%, 87%, and 100%.
- **SC-004**: Complexity formatting tests cover at least: integer value (`5`), non-integer value (`3.14159` → `3.1416`), and zero (`0`), and all render correctly.
- **SC-005**: The markdown summary row is demonstrably bolded in all test cases and the text summary row contains parenthesised totals.
- **SC-006**: No output format test produces implementation-specific artifacts (e.g., framework names, internal variable names) in the rendered output.

## Constitution Check *(mandatory)*

Reference: `.specify/memory/constitution.md`

- **Affected principles**: I (Action Interface Parity), II (Cross-Platform, Node-Only Runtime), V (Quality Gates).
- **Interface parity**: This feature defines the exact output structure, characters, and URL format required to match legacy behavior. Any deviation in symbols, formatting, or URL structure would be a breaking change per Principle I.
- **Cross-platform**: Output requirements are stated in terms of text content and do not assume platform-specific newline conventions; line ending normalization is expected to follow existing cross-platform conventions.
- **Preserve upstream artifacts**: No legacy artifacts are removed or modified as part of this specification.
- **Security and quality gates**: This feature is considered complete only when automated tests cover all format/flag combinations, health indicator thresholds, complexity formatting, and badge URL construction.
