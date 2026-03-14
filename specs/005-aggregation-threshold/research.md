# Research: Coverage Aggregation & Threshold Classification

## Decision 1: Use Cobertura root attributes as aggregation inputs
**Decision**: Treat the `<coverage>` root attributes (`line-rate`, `branch-rate`, `lines-covered`, `lines-valid`, `branches-covered`, `branches-valid`) as the authoritative per-file counts and ratios, then sum counts and compute unweighted averages across files for summary rates.

**Rationale**: Cobertura XML defines these root attributes as the coverage ratios and counts for the entire report, which makes them the correct inputs for file-level aggregation. Using these values preserves the legacy behavior of averaging per-file root rates rather than recomputing from summed counts.【3:0†Cobertura XML Output — gcovr 8.6 documentation†https://gcovr.com/en/stable/output/cobertura.html】

**Alternatives considered**:
- Recompute summary rates from summed counts (weighted average by lines-valid) — rejected to preserve legacy compatibility.
- Ignore root attributes and derive rates from package/class elements — rejected because root attributes already provide the authoritative totals.

## Decision 2: Use Shields.io static badge format and status color keywords
**Decision**: Build coverage badge URLs using the Shields.io static badge format (`https://img.shields.io/badge/<LABEL>-<MESSAGE>-<COLOR>`) with the status color keywords `critical`, `yellow`, and `success` for threshold-based classification.

**Rationale**: Shields.io documents the static badge URL format and supports named status colors, including the `critical` and `success` keywords used by the action today.【3:0†Static Badge | Shields.io†https://shields.io/badges】

**Alternatives considered**:
- Use custom hex colors for badges — rejected to maintain legacy visual semantics.
- Swap to a different badge service — rejected to avoid new dependencies or network behavior changes.

## References & usage comment
- Cobertura XML root attribute definitions from gcovr documentation inform which fields are aggregated and why rate values are averaged rather than recomputed.【3:0†Cobertura XML Output — gcovr 8.6 documentation†https://gcovr.com/en/stable/output/cobertura.html】
- Shields.io static badge format and color keywords confirm the badge URL structure and the `critical`/`yellow`/`success` color choices.【3:0†Static Badge | Shields.io†https://shields.io/badges】
