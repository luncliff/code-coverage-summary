# Specification Items — Code Coverage Summary Action

This document breaks down the derived requirements from [project-requirements.md](project-requirements.md) into specification items that are:

- Implementation-agnostic (describe behavior, not code structure)
- Testable (explicit acceptance criteria)
- Traceable (maps back to FR/NFR IDs)

---

## C) Cobertura parsing

### SI-C1 — Required root attributes

**Statement**: The action shall parse Cobertura XML and require the root coverage attributes `line-rate`, `lines-covered`, and `lines-valid`.

**Traceability**: FR-7

**Acceptance criteria**:
- If any required attribute is missing, the action logs a parsing error including the filename and fails.

### SI-C2 — Optional branch metrics

**Statement**: Branch metrics are optional and shall not be required for a successful run.

**Traceability**: FR-8

**Acceptance criteria**:
- If branch metrics are missing entirely, the action still succeeds (unless other failure conditions apply).
- In that case, branch rate output is suppressed regardless of `hide_branch_rate`.

### SI-C3 — Package rows extraction

**Statement**: The action shall extract package rows from `<package>` elements and capture name, line rate, branch rate (if present), and complexity (if present).

**Traceability**: FR-9

**Acceptance criteria**:
- Each `<package>` becomes one output row.
- Missing/unparseable numeric attributes default to 0 for that package.

### SI-C4 — Package name fallback

**Statement**: If a `<package>` has an empty or missing name, the action shall assign a stable fallback name per file.

**Traceability**: FR-9 (legacy parity)

**Acceptance criteria**:
- For each file, unnamed packages are numbered from 1 in encounter order.
- Fallback format matches legacy: `<coverage-file-basename> Package <i>`.

---

## D) Aggregation and calculations

### SI-D1 — Multi-file aggregation: sums

**Statement**: When multiple files match, the action shall sum covered/valid counts and complexity across all matched files.

**Traceability**: FR-11

**Acceptance criteria**:
- Total lines covered/valid equal the sum across inputs.
- Total branches covered/valid equal the sum across inputs (if branch metrics are provided).
- Total complexity equals the sum of per-package complexity values.

### SI-D2 — Multi-file aggregation: unweighted mean rates

**Statement**: For compatibility, overall line rate (and branch rate when present) shall be computed as the unweighted average of per-file root rates.

**Traceability**: FR-10

**Acceptance criteria**:
- With two files having `line-rate` values `r1` and `r2`, summary `LineRate == (r1 + r2) / 2`.
- The action does not recompute `LineRate` from summed covered/valid counts.

### SI-D3 — Forced hiding of branch rate when metrics absent

**Statement**: If branch metrics are effectively absent (all zero), branch rate output shall be hidden even if the user did not request hiding.

**Traceability**: FR-8

**Acceptance criteria**:
- If summary branch rate and branch counts are all zero, output excludes branch columns/fields.

### SI-D4 — Threshold parsing

**Statement**: The action shall parse the `thresholds` input using the same compatibility rules as legacy.

**Traceability**: FR-12

**Acceptance criteria**:
- Supports both `"<lower> <upper>"` and `"<lower>"` formats.
- Values are clamped to `[0, 100]`.
- If `lower > upper`, then `upper` is set to `lower + 10` (then clamped).

### SI-D5 — Badge classification

**Statement**: Badge color classification shall follow threshold rules.

**Traceability**: FR-16

**Acceptance criteria**:
- If summary line rate < lower → `critical`.
- Else if < upper → `yellow`.
- Else → `success`.

---

## F) Output destination

### SI-F1 — Console output

**Statement**: When `output=console`, the report shall be written to the action log.

**Traceability**: FR-18

**Acceptance criteria**:
- Report appears in logs.
- No output file is created.

### SI-F2 — File output

**Statement**: When `output=file`, the report shall be written to a file in the workspace root using the legacy filenames.

**Traceability**: FR-18

**Acceptance criteria**:
- `format=text` → writes `code-coverage-results.txt`.
- `format=markdown` → writes `code-coverage-results.md`.
- The content matches what would be printed to console.

### SI-F3 — Both output

**Statement**: When `output=both`, the report shall be written both to console and to the output file.

**Traceability**: FR-18

**Acceptance criteria**:
- Both SI-F1 and SI-F2 criteria are met in one run.

---

## G) Failure behavior and messages

### SI-G1 — Unknown format error

**Statement**: Unknown `format` values shall be treated as an error with a specific message.

**Traceability**: FR-20

**Acceptance criteria**:
- Logs exactly: `Error: Unknown output format.`
- Fails the step.

### SI-G2 — Unknown output type error

**Statement**: Unknown `output` values shall be treated as an error with a specific message.

**Traceability**: FR-21

**Acceptance criteria**:
- Logs exactly: `Error: Unknown output type.`
- Fails the step.

### SI-G3 — Parsing error message contains filename

**Statement**: Parsing failures shall include the filename in the log message.

**Traceability**: FR-22

**Acceptance criteria**:
- Logs in the form: `Parsing Error: <message> - <filename>`.
- Fails the step.

### SI-G4 — Fail below threshold behavior

**Statement**: When `fail_below_min=true`, the action shall (1) annotate the report with the minimum allowed line rate and (2) fail when summary line rate is below the lower threshold.

**Traceability**: FR-19

**Acceptance criteria**:
- Text report includes: `Minimum allowed line rate is <lower>%`.
- Markdown report includes the italicized line with the same information.
- When summary line rate < lower threshold, logs the legacy failure message and fails the step.

---

## H) Non-functional specification items

### SI-N1 — Runtime and portability

**Statement**: The action shall run as a Node 20 JavaScript action and be compatible with GitHub-hosted runners on Linux, Windows, and macOS.

**Traceability**: NFR-1

**Acceptance criteria**:
- No Docker dependency is required at runtime.
- No .NET runtime dependency is required at runtime.

### SI-N2 — No network dependency for normal execution

**Statement**: Normal execution shall not require network calls.

**Traceability**: NFR-3

**Acceptance criteria**:
- Badge generation does not fetch external resources.

### SI-N3 — Logging via official mechanisms

**Statement**: Logs and failures shall use official GitHub Actions logging mechanisms.

**Traceability**: NFR-4

**Acceptance criteria**:
- Info/debug/warn/error logs are emitted via toolkit equivalents.

### SI-N4 — Debug log behavior

**Statement**: When GitHub Actions step debug logging is enabled, the action should emit debug-level logs.

**Traceability**: NFR-5

**Acceptance criteria**:
- With debug enabled, internal diagnostic messages appear as debug output (not required in normal mode).

### SI-N5 — Determinism

**Statement**: For a fixed set of inputs and input files, the action output shall be deterministic.

**Traceability**: NFR-6

**Acceptance criteria**:
- Output content and ordering do not change between runs under the same inputs.

### SI-N6 — Preserve legacy artifacts

**Statement**: The repository shall keep legacy Docker/.NET sources for historical reference.

**Traceability**: NFR-7

**Acceptance criteria**:
- No future change set should delete legacy artifacts without a documented deprecation plan.

### SI-N7 — Test coverage for behavior

**Statement**: Parsing, formatting, and threshold behaviors shall be covered by automated tests using representative fixtures.

**Traceability**: NFR-8

**Acceptance criteria**:
- There are tests covering: multi-file rate averaging, branch-rate hiding, threshold parsing edge cases, complexity formatting, and exact error messages.

### SI-N8 — Security posture

**Statement**: Inputs and coverage XML shall be treated as untrusted.

**Traceability**: NFR-9

**Acceptance criteria**:
- The parser does not execute or resolve external content.
- Failure modes do not leak secrets and avoid logging sensitive environment data.
