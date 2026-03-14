# Data Model: Coverage Aggregation & Threshold Classification

## CoverageFile
Represents a parsed Cobertura XML input.

**Fields**
- `path` (string): filesystem path to the Cobertura XML file.
- `lineRate` (number, 0–1): root `<coverage>` `line-rate`.
- `branchRate` (number, 0–1): root `<coverage>` `branch-rate` (0 when absent).
- `linesCovered` (integer ≥ 0): root `lines-covered`.
- `linesValid` (integer ≥ 0): root `lines-valid`.
- `branchesCovered` (integer ≥ 0): root `branches-covered`.
- `branchesValid` (integer ≥ 0): root `branches-valid`.
- `complexity` (number ≥ 0): sum of package complexity values.
- `packages` (PackageCoverage[]): parsed package-level summaries.

**Validation rules**
- `lineRate` and `branchRate` must be parseable floats within 0–1 after normalization.
- Count fields must be parseable integers ≥ 0.

## PackageCoverage
Represents package-level metrics within a coverage file.

**Fields**
- `name` (string): package name or fallback label.
- `lineRate` (number, 0–1)
- `branchRate` (number, 0–1)
- `complexity` (number ≥ 0)

## CoverageSummary
Aggregated results across all matched coverage files.

**Fields**
- `lineRate` (number, 0–1): unweighted average of per-file root line rates.
- `branchRate` (number, 0–1): unweighted average of per-file root branch rates when present.
- `linesCovered` (integer ≥ 0): sum across files.
- `linesValid` (integer ≥ 0): sum across files.
- `branchesCovered` (integer ≥ 0): sum across files when present.
- `branchesValid` (integer ≥ 0): sum across files when present.
- `complexity` (number ≥ 0): sum of per-package complexity across files.
- `branchMetricsPresent` (boolean): true if any file provides branch metrics.
- `packages` (PackageCoverage[]): concatenated package rows across files.

**Derived/validation rules**
- `lineRate`/`branchRate` are averaged after summing per-file rates, then divided by number of files.
- `branchMetricsPresent` is true when any file or package includes branch metrics; it controls output suppression.

## ThresholdConfig
Parsed configuration for badge/indicator thresholds.

**Fields**
- `lower` (number, 0–1): lower bound.
- `upper` (number, 0–1): upper bound.

**Validation rules**
- Parse integer percentages from input string.
- Clamp values to 0–1.
- If `lower` exceeds `upper`, set `upper = min(lower + 0.1, 1.0)`.

## BadgeClassification
Derived label for badge/health indicator output.

**Values**
- `critical` when `lineRate < lower`.
- `yellow` when `lower <= lineRate < upper`.
- `success` when `lineRate >= upper`.
