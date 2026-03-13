# Data Model: File discovery and diagnostic logging

**Spec**: `/specs/001-file-discovery-logging/spec.md`

## Entities

### CoverageFilePattern

- **Fields**
  - `rawValue` (string): raw `filename` input segment before trimming.
  - `normalizedValue` (string): trimmed pattern passed to `@actions/glob`.
  - `sourceIndex` (number): original position in the comma-separated list.
- **Validation Rules**
  - `normalizedValue` must be non-empty after trimming.
  - Empty entries (e.g., consecutive commas) are ignored.
- **State Transitions**
  - `rawValue` → `normalizedValue` after trimming and validation.

### MatchedCoverageFile

- **Fields**
  - `path` (string): matched file path returned by `@actions/glob`, relative to workspace.
  - `discoveryOrder` (number): index reflecting deterministic glob order.
  - `matchedPatterns` (string[]): list of patterns that matched the file (for diagnostics if needed).
- **Validation Rules**
  - Each `path` must be unique across the matched set.

### CoverageFileMatchSet

- **Fields**
  - `patterns` (CoverageFilePattern[])
  - `files` (MatchedCoverageFile[])
- **Validation Rules**
  - `files` is de-duplicated; a single `MatchedCoverageFile` exists per unique path.
  - `files` ordering is stable for identical workspace contents and inputs.

## Relationships

- `CoverageFilePattern` → produces → `MatchedCoverageFile` (many-to-many)
- `CoverageFileMatchSet` → aggregates → `CoverageFilePattern` + `MatchedCoverageFile`

## Notes

- Ordering determinism and deduplication rely on `@actions/glob` documented behavior.
- `CoverageFileMatchSet.files` is the source of truth for logging (`Coverage File: ...`).
