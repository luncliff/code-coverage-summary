# Data Model: Output Destination (006)

**Branch**: `006-output-destination`

## Overview

This feature introduces no new persisted data. It specifies and validates the behavior of the existing output routing for the generated report:

- `output=console` → write the report to the GitHub Action log
- `output=file` → write the report to a deterministic file in the workspace root
- `output=both` → do both

The report content is produced by the existing output formatting pipeline and is treated as an opaque string for the purpose of destination routing.

## Conceptual Entities

### `OutputDestination`

A conceptual enumeration derived from the `output` input.

| Value | Meaning |
|-------|---------|
| `console` | Emit the report to the action log |
| `file` | Persist the report to a file in the workspace root |
| `both` | Emit to log and persist to a file |

### `Report`

| Field | Type | Description |
|-------|------|-------------|
| `content` | `string` | The fully formatted report content (text or markdown) |
| `format` | `"text" \| "markdown"` | Output format used to determine file extension |

### `ReportFileTarget`

| Field | Type | Description |
|-------|------|-------------|
| `path` | `string` | Deterministic output filename in workspace root (`code-coverage-results.txt` or `code-coverage-results.md`) |

## Validation Rules

| Rule | Behavior |
|------|----------|
| `output` supported values | Only `console`, `file`, `both` are accepted; others fail with `Error: Unknown output type.` |
| File naming | Determined solely by `format` (`text` → `.txt`, `markdown` → `.md`) |
| Console-only mode | Does not create or modify any output file |

## State Transitions

Stateless single-run behavior:

1. Parse inputs
2. Generate report content
3. Route output according to `OutputDestination`
4. Optionally fail the step after routing if additional quality gates apply (e.g., coverage threshold enforcement)
