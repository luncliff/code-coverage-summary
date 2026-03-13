# Contract: Action file discovery behavior

**Spec**: `/specs/001-file-discovery-logging/spec.md`  
**Scope**: `filename` input parsing, file discovery, and diagnostic logging

## Inputs

### `filename` (required)

- **Type**: string
- **Format**: comma-separated list of one or more glob patterns.
- **Whitespace handling**: each entry is trimmed; empty entries are ignored.
- **Pattern behavior**: passed to `@actions/glob` with its documented syntax and platform semantics (globstar, comments, excludes, tilde expansion, dotfiles, Windows separators/case rules).
- **Base directory**: patterns are evaluated relative to the workspace working directory.

## Behavior

1. Split `filename` by commas, trim entries, and discard empty items.
2. Evaluate all patterns using `@actions/glob` and union the results.
3. Ensure each matched file path is logged once (deduplicated).
4. Emit one log line per match: `Coverage File: <path>`.
5. If no files match, fail the step with the exact message: `Error: No files found matching glob pattern.`
6. Preserve deterministic ordering across runs for the same inputs and workspace contents.

## Outputs

This feature does not introduce new outputs. Existing action outputs remain unchanged.

## Error Handling

- Missing or empty matches → fail with `Error: No files found matching glob pattern.`
- Other discovery errors should be surfaced via standard action failure handling (`core.setFailed`).
