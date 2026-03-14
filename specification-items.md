# Specification Items — Code Coverage Summary Action

This document breaks down the derived requirements from [project-requirements.md](project-requirements.md) into specification items that are:

- Implementation-agnostic (describe behavior, not code structure)
- Testable (explicit acceptance criteria)
- Traceable (maps back to FR/NFR IDs)

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
