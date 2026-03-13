# Code Coverage Summary — References, Legacy Analysis, and Requirements

This document captures:

1. Official GitHub references for implementing/testing GitHub Actions with JavaScript/TypeScript, declaring inputs/outputs, using workflows, and logging/debugging.
2. A behavioral analysis of the legacy Docker + .NET implementation that is still present in this repository.
3. Derived functional and non-functional requirements for future work.

> Source constraint (per repository guidelines): references below are **only** from official GitHub documentation (docs.github.com) and repositories under https://github.com/actions.



## 1) References (Official GitHub)

### 1.1 Implementing & testing JavaScript/TypeScript actions

- **Creating a JavaScript action (official tutorial)**
  - https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action
  - Key points used here:
    - JavaScript actions should be “pure JavaScript” and not rely on other binaries to remain compatible across Ubuntu/Windows/macOS runners.
    - Uses the GitHub Actions Toolkit (notably `@actions/core`) for inputs, outputs, logging, and failure.

- **Template repositories (official, under github.com/actions)**
  - JavaScript template: https://github.com/actions/javascript-action
  - TypeScript template: https://github.com/actions/typescript-action
  - Key points used here:
    - Repo structure patterns: `src/` for source, `dist/` for packaged/bundled output committed to the repo.
    - Built-in guidance for running tests and bundling before release.

- **GitHub Actions Toolkit (official repo)**
  - Toolkit repository: https://github.com/actions/toolkit
  - `@actions/core` package documentation (logging, inputs/outputs, failure):
    - https://github.com/actions/toolkit/tree/main/packages/core

### 1.2 Action metadata: inputs/outputs declaration

- **Metadata syntax reference (action.yml / action.yaml)**
  - https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions
  - Key points used here:
    - How to declare inputs (required/default) and outputs in `action.yml`.
    - Inputs are exposed as environment variables (`INPUT_<NAME>`), and official guidance recommends using toolkit helpers.

### 1.3 Workflow usage examples (uses/with)

- **Workflow syntax for GitHub Actions**
  - https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
  - Key points used here:
    - `steps[*].uses` and `steps[*].with` conventions.
    - Inputs passed via `with` become environment variables for actions.

### 1.4 Logging, annotations, and debugging

- **Workflow commands for GitHub Actions**
  - https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
  - Key points used here:
    - `::debug::`, `::notice::`, `::warning::`, `::error::`
    - Log grouping via `::group::` / `::endgroup::`
    - Output/environment files (`GITHUB_OUTPUT`, `GITHUB_ENV`, etc.)

- **Enabling debug logging**
  - https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging
  - Key points used here:
    - Step debug logs are controlled by `ACTIONS_STEP_DEBUG=true`.
    - Runner diagnostic logs are controlled by `ACTIONS_RUNNER_DEBUG=true`.

- **Toolkit logging API (`@actions/core`)**
  - https://github.com/actions/toolkit/tree/main/packages/core
  - Key points used here:
    - `core.info`, `core.debug`, `core.notice`, `core.warning`, `core.error`
    - `core.startGroup` / `core.endGroup` (and `core.group` helper)
    - `core.setFailed` sets failing exit code and logs an error.



## 2) Legacy implementation analysis (Docker + .NET)

Legacy files analyzed:

- `Dockerfile` (Docker-based action packaging for .NET)
- `src/CodeCoverageSummary/Program.cs` (core behavior)
- `src/CodeCoverageSummary/CommandLineOptions.cs` (CLI interface)
- `src/CodeCoverageSummary/CodeSummary.cs` (data model)
- `README-original.md` (user-facing behavior description for upstream Docker action)

### 2.1 Legacy runtime & packaging

- The legacy build uses .NET SDK 6.0 to build/publish, and .NET runtime 6.0 to run.
- Container entrypoint runs the compiled CLI: `dotnet /app/CodeCoverageSummary.dll`.
- This design historically required Linux runners (because Docker container actions require Linux).

### 2.2 Legacy CLI interface (inputs as CLI flags)

The legacy implementation is a command-line program that accepts options (via `CommandLineOptions`).

Notable semantics:

- Boolean-like options are implemented as **strings** and treated as true only when the input string equals `"true"` (case-insensitive).
  - Any other value (including `"True"` works; `"1"` does **not**) is treated as false.

Legacy flag names:

- `--files` (required; comma-separated list; glob patterns supported)
- `--badge` (default `false`)
- `--fail` (default `false`)
- `--format` (default `text`; also accepts `md` or `markdown`)
- `--hidebranch` (default `false`)
- `--hidecomplexity` (default `false`)
- `--indicators` (default `true`)
- `--output` (default `console`; also `file`, `both`)
- `--thresholds` (default `"50 75"`)

### 2.3 Legacy file discovery behavior (glob + comma-separated lists)

- The program uses `Microsoft.Extensions.FileSystemGlobbing.Matcher` to expand file patterns.
- It adds include patterns from the `--files` list (already split by comma).
- It searches starting at `.` (current working directory).

Errors/messages:

- If glob expansion returns no matches:
  - Prints: `Error: No files found matching glob pattern.`
  - Exits with error (`-2`).
- For each matched file:
  - Prints: `Coverage File: {file}` (full path results from matcher)

### 2.4 Legacy Cobertura parsing expectations

The legacy parser expects Cobertura XML with:

- A `<coverage>` element with attributes:
  - `line-rate` (required)
  - `lines-covered` (required)
  - `lines-valid` (required)
  - `branch-rate` (optional)
  - `branches-covered` (optional, but only read if `branch-rate` exists)
  - `branches-valid` (optional, but only read if `branch-rate` exists)

And package-level data under `<package>` elements:

- Attributes read:
  - `name` (optional)
  - `line-rate` (defaults to 0 if missing)
  - `branch-rate` (defaults to 0 if missing/unparseable)
  - `complexity` (defaults to 0 if missing/unparseable)

Package naming fallback:

- If `package/@name` is missing/blank, the name becomes:
  - `"{fileBasename} Package {i}"` where `i` starts at 1 for that file.

### 2.5 Legacy aggregation semantics (multiple coverage files)

When multiple files match:

- The program **sums**:
  - `LinesCovered`, `LinesValid`
  - `BranchesCovered`, `BranchesValid`
  - `Complexity`
  - And concatenates all package rows into a single list

- The program **sums then averages**:
  - `LineRate` and `BranchRate` are accumulated per file (using the root attributes) and then divided by the number of matched files.

Important implication:

- `LineRate` and `BranchRate` are computed as an **unweighted average** across files, not recomputed from the total covered/valid counts.
  - This is legacy behavior and should be treated as the compatibility target unless a deliberate breaking change is accepted.

Branch-rate hiding behavior:

- Even if `hidebranch=false`, branch rate output is forced hidden if:
  - `summary.BranchRate == 0` AND `summary.BranchesCovered == 0` AND `summary.BranchesValid == 0`

### 2.6 Threshold parsing behavior

Threshold input is a string like `"50 75"`.

- Parsing accepts either:
  - `"<lower> <upper>"` (space separated)
  - `"<lower>"` only (upper remains at default)

Clamping and ordering rules:

- Lower and upper are treated as percentages and converted to `[0.0, 1.0]`.
- If `lower > 100%`, it is clamped to 100%.
- If `lower > upper`, then `upper = lower + 10%` (then clamped to 100%).

### 2.7 Badge generation behavior

When enabled, the legacy tool prints a Shields.io badge URL.

- Color selection:
  - `< lower` → `critical`
  - `< upper` → `yellow`
  - `>= upper` → `success`

- URL format:
  - `https://img.shields.io/badge/Code%20Coverage-{PCT}%25-{colour}?style=flat`
  - Percent is formatted with no decimals.

### 2.8 Output formatting behavior

#### Text format

- Optional first line: badge URL, then a blank line.
- For each package (in encounter order):
  - `{PackageName}: Line Rate = {PCT}%[, Branch Rate = {PCT}%][, Complexity = {N}][, {Health}]`
- Summary row:
  - `Summary: Line Rate = {PCT}% ({covered} / {valid})[, Branch Rate = {PCT}% ({covered} / {valid})][, Complexity = {N}][, {Health}]`
- If `fail_below_min` is enabled, also appends:
  - `Minimum allowed line rate is {lower}%`

#### Markdown format

- Optional first line: `![Code Coverage]({badgeUrl})`, then a blank line.
- Table header depends on `hide_branch_rate`, `hide_complexity`, and `indicators`.
- Package rows follow the same column structure.
- Summary row is bolded (`**Summary**` and bold values).
- If `fail_below_min` is enabled, also appends an italicized line:
  - `_Minimum allowed line rate is `{lower}%`_`

#### Complexity formatting

- If the complexity is an integer, it is printed without decimals.
- Otherwise it is printed with 4 decimal places.

### 2.9 Output destination behavior

- `output=console`: prints the output to stdout (with a blank line before it).
- `output=file`: writes to `code-coverage-results.txt` or `code-coverage-results.md`.
- `output=both`: prints and writes.

### 2.10 Failure behavior and messages

Fail-fast behaviors that should be preserved for compatibility:

- Unknown format → prints `Error: Unknown output format.` and fails.
- Unknown output type → prints `Error: Unknown output type.` and fails.
- Parsing problems log `Parsing Error: ... - {filename}` and fail.
- When `fail_below_min=true` and line rate is below lower threshold:
  - prints `FAIL: Overall line rate below minimum threshold of {lower}%.`
  - fails.

Exit codes in legacy:

- Invalid arguments: `-1`
- Expected errors: `-2`
- Unhandled exception: `-3`

> Note: JavaScript actions typically communicate failure via `core.setFailed()` / exit code `1`. Compatibility requirements should focus on *observable workflow behavior* (step fails) and *messages*, not on numeric exit codes.



## 3) Requirements (Derived)

### 3.1 Functional requirements

**Action interface (inputs) — parity with `action.yml`**

FR-1. The action MUST accept inputs exactly as declared in `action.yml`:

- `filename` (required)
- `badge` (default `false`)
- `fail_below_min` (default `false`)
- `format` (default `text`)
- `hide_branch_rate` (default `false`)
- `hide_complexity` (default `false`)
- `indicators` (default `true`)
- `output` (default `console`)
- `thresholds` (default `"50 75"`)

FR-2. Input semantics MUST match legacy behavior:

- `filename` supports:
  - comma-separated lists
  - glob patterns
  - paths with spaces when quoted at the workflow YAML level

FR-3. Boolean-like inputs MUST treat only case-insensitive `"true"` as true.

- Example: `"1"`, `"yes"`, `"on"` MUST be treated as false for parity.

**File discovery and parsing**

FR-4. The action MUST expand `filename` patterns relative to the working directory (workspace), mirroring legacy matcher behavior.

FR-5. If no files match, the action MUST fail and log:

- `Error: No files found matching glob pattern.`

FR-6. For each matched file, the action MUST log a line in the form:

- `Coverage File: <path>`

FR-7. The action MUST parse Cobertura XML and require the root coverage attributes:

- `line-rate`, `lines-covered`, `lines-valid`

FR-8. Branch metrics MUST be treated as optional; if missing entirely across all files, branch rate output MUST be hidden regardless of `hide_branch_rate=false`.

FR-9. Package rows MUST be derived from `<package>` elements and include:

- `name` (with the same fallback naming scheme when missing)
- `line-rate`
- `branch-rate` (if included)
- `complexity` (if included)

**Aggregation and calculations**

FR-10. For multiple matched files, `LineRate` and `BranchRate` MUST be computed as the unweighted mean of each file’s root `line-rate`/`branch-rate` attributes (legacy behavior).

FR-11. For multiple matched files, `LinesCovered`, `LinesValid`, `BranchesCovered`, `BranchesValid`, and `Complexity` MUST be summed.

FR-12. Threshold parsing MUST match legacy behavior:

- support `"<lower> <upper>"` and `"<lower>"`
- clamp percentages to `[0, 100]`
- if `lower > upper`, set `upper = lower + 10` (clamped)

**Output formatting**

FR-13. `format=text` MUST produce the same text structure (badge line optional, package lines, summary line).

FR-14. `format=markdown` MUST produce a markdown table with optional columns based on hide flags and indicators.

FR-15. Complexity formatting MUST match legacy:

- integers print without decimals
- non-integers print with 4 decimals

FR-16. Badge URL generation MUST match legacy URL structure and color thresholds.

FR-17. Health indicators MUST match legacy characters:

- below lower → `❌`
- between thresholds → `➖`
- at/above upper → `✔`

FR-18. Output destination MUST match legacy:

- `console` prints to log
- `file` writes to `code-coverage-results.txt` or `code-coverage-results.md` (based on format)
- `both` does both

FR-19. When `fail_below_min=true`, the action MUST append the “minimum allowed line rate” line to the produced output (text/markdown variants) and MUST fail if summary line rate is below the lower threshold.

**Errors and messages**

FR-20. Unknown `format` MUST log `Error: Unknown output format.` and fail.

FR-21. Unknown `output` MUST log `Error: Unknown output type.` and fail.

FR-22. Parsing errors MUST include the filename in the log message in the form:

- `Parsing Error: <message> - <filename>`

### 3.2 Non-functional requirements

NFR-1. The action MUST run as a JavaScript action using Node 20 (`runs.using: node20`) and MUST be cross-platform (Linux/Windows/macOS).

- Reference: GitHub tutorial guidance that JS actions should not rely on other binaries.

NFR-2. The action MUST NOT require Docker or a .NET runtime to execute.

NFR-3. The action MUST avoid network calls during normal execution.

- Generating a badge URL is permitted; fetching it is not required.

NFR-4. Logging MUST use official GitHub Actions mechanisms:

- `@actions/core` logging helpers (preferred)
- or the equivalent workflow commands per official docs

NFR-5. Debug logging MUST respect GitHub’s debug logging model.

- When step debug logs are enabled (`ACTIONS_STEP_DEBUG=true`), debug-level logs SHOULD be emitted (via `core.debug`).

NFR-6. The action MUST be deterministic for the same inputs and coverage files.

- Output should not depend on locale-sensitive formatting or system-specific path quirks beyond what is already required for compatibility.

NFR-7. The repository MUST preserve legacy artifacts (Docker/.NET sources) for historical reference, and future work SHOULD avoid deleting them.

NFR-8. Parsing/formatting logic MUST be covered by automated tests using representative coverage fixtures.

- References: official JS/TS action templates include tests and bundling patterns.

NFR-9. The implementation MUST be secure-by-default.

- Treat coverage files and inputs as untrusted; avoid unsafe XML parsing settings and avoid executing data.



## 4) Notes for future work (compatibility checkpoints)

These are suggested verification checkpoints (not additional requirements):

- Verify globbing semantics match the legacy matcher for `filename` across OSes.
- Add regression tests for:
  - multi-file averaging behavior (unweighted mean)
  - branch-rate hiding logic
  - threshold parsing edge cases (`lower` only; `lower > upper`; clamping)
  - complexity formatting (integer vs 4dp)
  - exact error messages
