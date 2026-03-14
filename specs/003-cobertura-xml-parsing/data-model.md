# Data Model: Cobertura XML parsing (003)

**Spec**: `specs/003-cobertura-xml-parsing/spec.md`  
**Branch**: `003-cobertura-xml-parsing`

---

## Overview

This feature formalizes the Cobertura parsing entities already represented in
`src/coverage-parser.ts`, adding explicit validation rules for required root
metrics, optional branch metrics, and fallback package naming.

---

## Entities

### CoberturaRootMetrics

Represents the `<coverage>` root attributes parsed from a single file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `lineRate` | `number` | Yes | Overall line-rate ratio (0–1). |
| `linesCovered` | `number` | Yes | Count of covered lines. |
| `linesValid` | `number` | Yes | Count of valid lines. |
| `branchRate` | `number` | No | Overall branch-rate ratio (0–1). Defaults to `0` when absent. |
| `branchesCovered` | `number` | No | Covered branch count. Defaults to `0` when absent. |
| `branchesValid` | `number` | No | Valid branch count. Defaults to `0` when absent. |
| `complexity` | `number` | No | Cyclomatic complexity (defaults to `0` when missing). |

**Validation Rules**
- `lineRate`, `linesCovered`, `linesValid` must exist and be numeric; otherwise parsing fails.
- Optional branch fields may be absent; missing values are treated as `0`.

### PackageCoverage

Represents a single `<package>` element in a Cobertura file.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | `string` | Yes | Package name; if missing/empty, fallback to `<basename> Package <i>` per file. |
| `lineRate` | `number` | No | Package line-rate (defaults to `0`). |
| `branchRate` | `number` | No | Package branch-rate (defaults to `0`). |
| `complexity` | `number` | No | Package complexity (defaults to `0`). |

**Validation Rules**
- Missing or non-numeric package metrics default to `0`.
- Fallback names are deterministic per file and increment with encounter order.

### CoverageSummary

Aggregated coverage output across one or more files.

| Field | Type | Description |
|-------|------|-------------|
| `lineRate` | `number` | Sum of per-file root line rates. |
| `branchRate` | `number` | Sum of per-file root branch rates (0 if none). |
| `linesCovered` | `number` | Total lines covered across files. |
| `linesValid` | `number` | Total lines valid across files. |
| `branchesCovered` | `number` | Total branches covered across files. |
| `branchesValid` | `number` | Total branches valid across files. |
| `complexity` | `number` | Total package complexity across files. |
| `packages` | `PackageCoverage[]` | Flattened package rows across files. |

---

## Relationships

- `CoberturaRootMetrics` are parsed from each coverage file and aggregated into `CoverageSummary`.
- Each coverage file contributes zero or more `PackageCoverage` entries to `CoverageSummary.packages`.

---

## Notes

- A file with zero `<package>` elements yields no `PackageCoverage` entries but still contributes
  root metrics to the summary.
- Branch metrics are considered “present” for display purposes if any file includes branch values
  (non-zero or explicitly provided).
