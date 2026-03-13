# Data Model: Action Contract Inputs (002)

**Branch**: `copilot/002-action-input-contract`  
**Spec**: `specs/002-action-input-contract/spec.md`

---

## Overview

This feature introduces no new data structures. It fixes a parsing inconsistency in how
`src/index.ts` converts the string `indicators` input into a `boolean`, and adds tests to
verify all boolean-like input parsing.

The data flowing through the system after this fix:

```
action.yml defaults
       │
       ▼
GitHub Actions runner (sets INPUT_* environment variables)
       │
       ▼
src/index.ts  ← getInput() → parsed primitives
       │
       ▼
OutputOptions (output-generator.ts)  ← receives boolean fields
       │
       ▼
generateTextOutput / generateMarkdownOutput
```

---

## Existing Entities (unchanged)

### `CoverageSummary` (coverage-parser.ts)

| Field | Type | Description |
|-------|------|-------------|
| `lineRate` | `number` | Aggregated line rate (0–1) |
| `branchRate` | `number` | Aggregated branch rate (0–1) |
| `linesCovered` | `number` | Total lines covered |
| `linesValid` | `number` | Total lines valid |
| `branchesCovered` | `number` | Total branches covered |
| `branchesValid` | `number` | Total branches valid |
| `complexity` | `number` | Total complexity |
| `packages` | `PackageCoverage[]` | Per-package breakdown |

### `PackageCoverage` (coverage-parser.ts)

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Package name (fallback: filename + index) |
| `lineRate` | `number` | Package line rate (0–1) |
| `branchRate` | `number` | Package branch rate (0–1) |
| `complexity` | `number` | Package complexity |

### `OutputOptions` (output-generator.ts)

| Field | Type | Default | Source Input |
|-------|------|---------|--------------|
| `badgeUrl` | `string \| null` | `null` | `badge` |
| `indicators` | `boolean` | `true` | `indicators` ← **bug fix here** |
| `hideBranchRate` | `boolean` | `false` | `hide_branch_rate` |
| `hideComplexity` | `boolean` | `false` | `hide_complexity` |
| `thresholds` | `ThresholdConfig` | `{lower:0.5, upper:0.75}` | `thresholds` |
| `failBelowMin` | `boolean` | `false` | `fail_below_min` |

### `ThresholdConfig` (output-generator.ts)

| Field | Type | Description |
|-------|------|-------------|
| `lower` | `number` | Lower threshold (0–1), default 0.5 |
| `upper` | `number` | Upper threshold (0–1), default 0.75 |

---

## Parsed Input Values (src/index.ts)

These are the primitive values derived from action inputs, passed into the existing
entity constructors. The **only change** in this feature is the `indicators` row.

| Variable | Type | Parsing Expression (current) | Parsing Expression (fixed) |
|----------|------|-------------------------------|----------------------------|
| `filename` | `string` | `core.getInput('filename', {required:true})` | unchanged |
| `badge` | `boolean` | `.toLowerCase() === 'true'` | unchanged |
| `failBelowMin` | `boolean` | `.toLowerCase() === 'true'` | unchanged |
| `format` | `string` | `.toLowerCase()` | unchanged |
| `hideBranchRate` | `boolean` | `.toLowerCase() === 'true'` | unchanged |
| `hideComplexity` | `boolean` | `.toLowerCase() === 'true'` | unchanged |
| `indicators` | `boolean` | `.toLowerCase() !== 'false'` ⚠️ | `.toLowerCase() === 'true'` ✅ |
| `output` | `string` | `.toLowerCase()` | unchanged |
| `thresholdsInput` | `string` | `\|\| '50 75'` fallback | unchanged |

---

## Validation Rules

| Input | Rule | FR |
|-------|------|----|
| `filename` | Required; non-empty after trimming and splitting | FR-001, FR-003 |
| Boolean inputs | Only case-insensitive `"true"` → `true`; all other values → `false` | FR-006 |
| `format` | Must be `"text"`, `"md"`, or `"markdown"`; otherwise `setFailed` | FR-001 |
| `thresholds` | One or two space-separated integers; parsed by `parseThresholds()` | FR-001 |
| `output` | `"console"`, `"file"`, or `"both"`; handled downstream | FR-001 |

---

## State Transitions

No state machine. The action is stateless; it reads inputs, processes files, and writes
output in a single synchronous execution path.
