# Action Input Contract

**Contract Type**: GitHub Action Input Schema  
**Spec**: `specs/002-action-input-contract/spec.md`  
**Source of Truth**: `action.yml` (authoritative), `src/index.ts` (implementation)

---

## Input Contract

All inputs are strings at the GitHub Actions runtime level. The action is responsible
for parsing them into the appropriate types.

### `filename` (required)

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | Yes |
| Default | — |
| Description | Comma-separated list of Cobertura XML coverage file paths and/or glob patterns. |

**Parsing rule**: Split on `,`, `.trim()` each token, `.filter()` empty tokens, pass to
`@actions/glob` joined with `\n`.

**Edge cases handled**:
- Leading/trailing whitespace around commas: trimmed
- Consecutive/trailing commas: empty tokens filtered
- Paths with spaces: preserved (spaces only stripped at comma boundaries)
- No files matched: `setFailed('Error: No files found matching glob pattern.')`

---

### Boolean-like inputs

The following inputs share a single parsing rule (FR-006):

> **Only the string `"true"` (case-insensitive) evaluates to `true`. All other values
> (including `"1"`, `"yes"`, `"on"`, empty string, or any arbitrary string) evaluate to
> `false`.**

Implementation pattern for all boolean inputs:
```ts
core.getInput('<input-name>').toLowerCase() === 'true'
```

| Input | Required | Default | Behavior when `true` |
|-------|----------|---------|----------------------|
| `badge` | No | `'false'` → `false` | Prepends a shields.io badge URL to output |
| `fail_below_min` | No | `'false'` → `false` | Calls `core.setFailed()` when line rate < lower threshold |
| `hide_branch_rate` | No | `'false'` → `false` | Omits branch rate column from output |
| `hide_complexity` | No | `'false'` → `false` | Omits complexity column from output |
| `indicators` | No | `'true'` → `true` | Appends ❌/➖/✔ health indicator to each row |

**Accepted input values and their results**:

| Input string | Parsed result |
|---|---|
| `"true"` | `true` |
| `"True"` | `true` |
| `"TRUE"` | `true` |
| `"false"` | `false` |
| `"False"` | `false` |
| `"FALSE"` | `false` |
| `"1"` | `false` |
| `"yes"` | `false` |
| `"on"` | `false` |
| `""` (empty / omitted) | `false` |
| any other string | `false` |

---

### `format`

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | No |
| Default | `'text'` |
| Accepted values | `"text"`, `"md"`, `"markdown"` (case-insensitive) |
| Invalid value behavior | `core.setFailed('Error: Unknown output format.')` |

---

### `output`

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | No |
| Default | `'console'` |
| Accepted values | `"console"`, `"file"`, `"both"` (case-insensitive) |

---

### `thresholds`

| Property | Value |
|----------|-------|
| Type | `string` |
| Required | No |
| Default | `'50 75'` |
| Format | One or two space-separated integers (percentage points, 0–100) |
| Parsed to | `ThresholdConfig { lower: number, upper: number }` (0–1 fractions) |
| Invalid value behavior | `core.setFailed('Error: Threshold parameter set incorrectly.')` |

**Clamping rules** (handled by `parseThresholds()`):
- `lower > 100` → clamped to `1.0`  
- `lower > upper` → `upper` auto-adjusted to `lower + 0.1` (capped at `1.0`)

---

## Default-Equivalence Contract (FR-002 / SC-001)

A workflow that omits all optional inputs MUST produce identical output to one that
explicitly provides every default:

```yaml
# These two steps are contract-equivalent:

# Step A — omit optionals
- uses: irongut/CodeCoverageSummary@v2
  with:
    filename: coverage.xml

# Step B — explicit defaults
- uses: irongut/CodeCoverageSummary@v2
  with:
    filename: coverage.xml
    badge: 'false'
    fail_below_min: 'false'
    format: text
    hide_branch_rate: 'false'
    hide_complexity: 'false'
    indicators: 'true'
    output: console
    thresholds: '50 75'
```

---

## Changelog

| Version | Change | FR |
|---------|--------|----|
| 2.x (this feature) | Fix `indicators` boolean parsing: `!== 'false'` → `=== 'true'` | FR-006 |
