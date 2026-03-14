# Implementation Plan: Output Generation (004)

**Branch**: `copilot/create-specification-section-e` | **Date**: 2025-07-14 | **Spec**: `specs/004-output-generation/spec.md`  
**Input**: Feature specification from `specs/004-output-generation/spec.md`

## Summary

The output-generation module (`src/output-generator.ts`) is already fully implemented: it
exports `generateTextOutput()`, `generateMarkdownOutput()`, `generateBadgeUrl()`,
`parseThresholds()`, `healthIndicator()` (internal), and `formatComplexity()` (internal).
The existing test file (`__tests__/output-generator.test.ts`) covers happy-path scenarios
but is missing precision tests for health indicator exact characters, complexity decimal
formatting, badge URL exact structure, markdown row bolding, boundary threshold conditions,
and several edge cases mandated by FR-009 through FR-012.

**Approach**: No source changes. Add a comprehensive test suite that covers every FR from
FR-001 through FR-012, all five health indicator boundary conditions, all complexity
formatting rules, all badge URL structural requirements, and the eight edge cases listed in
the spec. Zero breaking changes; no new dependencies.

## References

> *Required by the plan request. These were gathered via web search and inform the test
> assertions below.*

| Reference | URL | How It Is Used |
|-----------|-----|----------------|
| Cobertura XML format — gcovr docs | https://gcovr.com/en/stable/output/cobertura.html | Confirms the `line-rate`, `branch-rate`, `complexity`, `lines-covered`, `lines-valid`, `branches-covered`, `branches-valid` attributes map 1-to-1 to the `CoverageSummary` fields consumed by `output-generator.ts`. Test fixtures are built with values drawn from this schema. |
| Cobertura XML — Baeldung | https://www.baeldung.com/cobertura | Secondary confirmation of attribute semantics; reinforces that `complexity` is a decimal cyclomatic measure and that zero-valued attributes are valid. |
| Shields.io Static Badge docs | https://shields.io/badges/static-badge | Canonical source for badge URL structure: `/badge/<LABEL>-<MESSAGE>-<COLOR>?style=flat`. Confirms `%20` for spaces, `%25` for `%`, and named colors (`critical`, `yellow`, `success`). All badge URL assertions in the test suite derive from this format. |
| Shields.io Static Badges guide | https://shields.io/docs/static-badges | Confirms `style=flat` query parameter and special-character percent-encoding rules. |
| GitHub Actions Job Summaries | https://github.blog/news-insights/product-news/supercharging-github-actions-with-job-summaries/ | Confirms that GitHub renders GitHub Flavored Markdown (GFM) tables when content is written to `$GITHUB_STEP_SUMMARY`. The markdown table format produced by `generateMarkdownOutput()` (`Package | Line Rate`, `---- | ----` separator) satisfies GFM table requirements. |
| GFM Table spec (via GitHub blog) | https://ecanarys.com/supercharging-github-actions-with-job-summaries-and-pull-request-comments/ | Confirms same GFM table format applies to PR comments posted via the `github-script` action. No format change is required; the existing pipe-separated format is correct. |

## Technical Context

**Language/Version**: TypeScript 5.x, targeting Node 20  
**Primary Dependencies**: `@actions/core ^1.11.1` (test-only, for type imports); `jest 29` with `ts-jest` preset  
**Storage**: N/A — pure formatting functions; no I/O  
**Testing**: Jest 29; all tests are pure unit tests with no mocks needed (functions are
deterministic given `CoverageSummary` + `OutputOptions`)  
**Target Platform**: GitHub-hosted runners — Linux, Windows, macOS (Node 20)  
**Project Type**: GitHub Action (TypeScript, bundled with esbuild)  
**Performance Goals**: N/A — formatting functions are CPU-bound and microsecond-scale  
**Constraints**: Output format must exactly match legacy output; no deviation in symbol
characters, decimal places, URL structure, or markdown syntax is permitted  
**Scale/Scope**: New tests only (~200–250 lines); no source changes; no new dependencies

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

| Principle | Status | Notes |
|-----------|--------|-------|
| **I — Action Interface Parity** | ✅ PASS | No source changes. Tests verify that the existing implementation matches the legacy interface exactly — this feature plan is additive quality assurance, not a behavioral change. |
| **II — Cross-Platform, Node-Only** | ✅ PASS | All new code is pure Jest tests. No platform-specific paths, line endings, or shell invocations introduced. |
| **III — Preserve Upstream Artifacts** | ✅ PASS | No files deleted or modified. |
| **IV — Security-First** | ✅ PASS | No new network calls, no new runtime dependencies. |
| **V — Quality Gates** | ✅ PASS | This plan specifically fills the gap identified in the spec's success criteria (SC-001 through SC-006). All FR scenarios, health indicator boundaries, complexity decimals, badge URLs, and edge cases will be covered by the new tests. |

**Post-design re-check**: ✅ — No design decisions alter any gate result; test-only changes
have no interface or behavioral impact.

## Project Structure

### Documentation (this feature)

```text
specs/004-output-generation/
├── plan.md        ← this file
├── research.md    ← Phase 0 output
├── data-model.md  ← Phase 1 output
├── quickstart.md  ← Phase 1 output
├── contracts/     ← Phase 1 output
└── tasks.md       ← Phase 2 output (speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── index.ts                  ← unchanged
├── coverage-parser.ts        ← unchanged
└── output-generator.ts       ← unchanged (already fully implemented)

__tests__/
├── index.test.ts             ← unchanged
├── coverage-parser.test.ts   ← unchanged
└── output-generator.test.ts  ← EXTEND: add ~200 lines of precision tests
```

**Structure Decision**: Single-project layout (existing). Feature touches only the test
file. No new files, no reorganisation required.

## Data Model

This feature introduces no new data structures. The types that existing tests exercise are:

- **`CoverageSummary`** (from `src/coverage-parser.ts`): `lineRate`, `branchRate`,
  `linesCovered`, `linesValid`, `branchesCovered`, `branchesValid`, `complexity`,
  `packages: PackageCoverage[]`
- **`PackageCoverage`**: `name`, `lineRate`, `branchRate`, `complexity`
- **`ThresholdConfig`** (from `src/output-generator.ts`): `lower`, `upper` (both in decimal,
  e.g. `0.50` and `0.75`)
- **`OutputOptions`**: `badgeUrl`, `indicators`, `hideBranchRate`, `hideComplexity`,
  `thresholds`, `failBelowMin`

See `data-model.md` for the formal entity summary.

## Contracts

The action's user-facing contract is defined by `action.yml` and the output format
documented in `README.md`. This feature does **not** change any contract; it verifies
conformance to it.

See `contracts/output-formats.md` for the formal output-format contract documentation
(text, markdown, badge URL).

## Quickstart

See `quickstart.md` for a minimal workflow example and a cheat-sheet of the exact output
formats verified by the new tests.

## Gap Analysis: Existing vs Required Tests

The table below maps every FR and success criterion to whether it is already covered by the
existing `__tests__/output-generator.test.ts` and whether new tests are needed.

| FR / SC | Description | Existing Coverage | New Tests Needed |
|---------|-------------|-------------------|------------------|
| FR-001 | Text: badge URL on first line + blank line | Partial (only checks *contains*) | ✅ Assert line[0] = URL, line[1] = "" |
| FR-001 | Text: no badge line when badge=false | ✅ implicit | — |
| FR-002 | Text: package name + line rate in each row | ✅ | — |
| FR-003 | Text: branch rate when hideBranchRate=false | ❌ not tested | ✅ Assert "Branch Rate = 69%" present |
| FR-003 | Text: branch rate omitted when hideBranchRate=true | ✅ | — |
| FR-004 | Text: complexity when hideComplexity=false | ❌ not tested | ✅ Assert "Complexity = 671" present |
| FR-004 | Text: complexity omitted when hideComplexity=true | ✅ | — |
| FR-005 | Text summary: covered/valid totals in parentheses | ✅ | — |
| FR-005 | Text summary: branch covered/valid when shown | ❌ not tested | ✅ Assert "(262 / 378)" in summary |
| FR-006/FR-007 | Markdown: badge image tag format on first line | Partial (only checks *contains*) | ✅ Assert exact `![Code Coverage](url)` at line[0] |
| FR-006 | Markdown: table starts when badge=false | ❌ not tested | ✅ Assert line[0] starts with "Package" |
| FR-008 | Markdown summary: line rate value bolded | ❌ not tested | ✅ Assert `**83%**` present |
| FR-008 | Markdown summary: branch rate value bolded | ❌ not tested | ✅ Assert `**69%**` present |
| FR-009 | Complexity: integer value → no decimals | ❌ not tested | ✅ Assert formatComplexity(5.0) = "5" |
| FR-009 | Complexity: non-integer → 4 decimal places | ❌ not tested | ✅ Assert formatComplexity(3.14159) = "3.1416" |
| FR-009 | Complexity: zero → "0" | ❌ not tested | ✅ Assert formatComplexity(0) = "0" |
| FR-010 | Indicator: ❌ below lower threshold | Partial (regex match any symbol) | ✅ Assert exact char ❌ when lineRate < lower |
| FR-010 | Indicator: ➖ between thresholds | Partial (regex match any symbol) | ✅ Assert exact char ➖ when lower ≤ rate < upper |
| FR-010 | Indicator: ✔ at/above upper threshold | Partial (regex match any symbol) | ✅ Assert exact char ✔ when rate ≥ upper |
| FR-010 | Indicator: ➖ exactly at lower threshold | ❌ not tested | ✅ Boundary: rate = lower → ➖ |
| FR-010 | Indicator: ✔ exactly at upper threshold | ❌ not tested | ✅ Boundary: rate = upper → ✔ |
| FR-011 | No indicator symbols when indicators=false | ❌ not tested | ✅ Assert /[❌➖✔]/ absent |
| FR-012 | Badge URL: exact path format | Partial (checks color substring only) | ✅ Assert full URL string matches template |
| FR-012 | Badge URL: percentage as whole number | Partial (checks "83" substring) | ✅ Assert `83%25` (no decimals) |
| FR-012 | Badge URL: style=flat present | ❌ not tested | ✅ Assert `?style=flat` in URL |
| FR-012 | Badge URL: 0% coverage | ❌ not tested | ✅ Assert `0%25` |
| FR-012 | Badge URL: 100% coverage | ❌ not tested | ✅ Assert `100%25` |
| SC-002 | Exactly-at-lower → ➖ | ❌ not tested | ✅ covered above |
| SC-002 | Exactly-at-upper → ✔ | ❌ not tested | ✅ covered above |
| SC-003 | Badge for 0%, 50%, 87%, 100% | Partial | ✅ Add 0% and 100% cases |
| SC-004 | Complexity for int, non-int, zero | ❌ not tested | ✅ covered above |
| SC-005 | Text summary parenthesised totals | ✅ | — |
| SC-005 | Markdown summary bolded values | ❌ not tested | ✅ covered above |
| Edge | Complexity 0.0000 → "0" | ❌ not tested | ✅ same as zero case |
| Edge | Branch zero → suppress branch output | ❌ not tested | ✅ Assert branchRate absent when all zeros |
| Edge | Badge with rate exactly at threshold boundary | ❌ not tested | ✅ Assert correct color |
| Edge | Markdown: only line rate column | ❌ not tested | ✅ hideBranchRate+hideComplexity+!indicators |

## Implementation Plan

### Step 1 — Research (Phase 0)

*Artifacts to produce*: `specs/004-output-generation/research.md`

All NEEDS CLARIFICATION items have been resolved by the web searches above and by
reading the existing implementation. Key findings consolidated here; see `research.md`
for full detail.

| Question | Decision | Rationale |
|----------|----------|-----------|
| Badge URL exact format | `https://img.shields.io/badge/Code%20Coverage-${pct}%25-${colour}?style=flat` | Shields.io static badge docs; matches current implementation |
| Percent encoding of `%` in badge | `%25` | Standard URL percent-encoding; confirmed by Shields.io docs |
| GFM table format for markdown output | Pipe-separated rows with `----` separator | GitHub blog + ecanarys article confirm this is correct GFM |
| Complexity formatting rule | `value % 1 === 0 ? String(value) : value.toFixed(4)` | Existing implementation; matches legacy .NET behavior |
| Health indicator characters | `❌` / `➖` / `✔` | Defined by spec FR-010; present in existing source |
| Branch suppression rule | All-zero branch values ⇒ no branch output | Spec assumption; confirmed by `branchRate === 0` check in buildPackageTextLine |

### Step 2 — Design & Data Model (Phase 1)

*Artifacts to produce*: `specs/004-output-generation/data-model.md`,
`specs/004-output-generation/contracts/output-formats.md`,
`specs/004-output-generation/quickstart.md`

No new entities or interfaces. The data model documents the existing types; the contract
documents the exact output text templates; the quickstart documents usage and test patterns.

### Step 3 — Test Additions (Phase 1 → Implementation)

Extend `__tests__/output-generator.test.ts` with the following new `describe` blocks.
Existing tests are **not** modified.

#### 3a. `formatComplexity` (extracted tests)

```text
describe('formatComplexity') {
  test('integer value → no decimal places')    → formatComplexity(5.0)   === '5'
  test('non-integer → 4 decimal places')       → formatComplexity(3.14159) === '3.1416'
  test('zero → "0"')                           → formatComplexity(0)     === '0'
  test('0.0000 (zero float) → "0"')            → formatComplexity(0.0)   === '0'
}
```

> `formatComplexity` is not exported. Tests access it indirectly through generated output
> text — e.g., `expect(generateTextOutput(...)).toContain('Complexity = 3.1416')`.

#### 3b. `generateBadgeUrl` — precision tests

```text
describe('generateBadgeUrl precision') {
  test('exact URL structure for 83% (success)')
    → full URL === 'https://img.shields.io/badge/Code%20Coverage-83%25-success?style=flat'
  test('exact URL structure for 40% (critical)')
    → contains '-40%25-critical?style=flat'
  test('exact URL structure for 60% (yellow)')
    → contains '-60%25-yellow?style=flat'
  test('0% coverage → 0%25 in URL')
    → lineRate=0.0 → contains '0%25'
  test('100% coverage → 100%25 in URL')
    → lineRate=1.0 → contains '100%25'
  test('style=flat present in all badge URLs')
    → all three colors contain '?style=flat'
  test('exactly at lower threshold → yellow (not critical)')
    → lineRate=lower → 'yellow'
  test('exactly at upper threshold → success (not yellow)')
    → lineRate=upper → 'success'
}
```

#### 3c. `healthIndicator` — boundary and exact-character tests

Tested through generated output (public surface).

```text
describe('health indicators') {
  test('❌ exact char when lineRate < lower threshold')
  test('➖ exact char when lineRate is between thresholds')
  test('✔ exact char when lineRate >= upper threshold')
  test('➖ at exactly lower boundary (rate == lower)')
  test('✔ at exactly upper boundary (rate == upper)')
  test('no indicator symbols when indicators=false')
}
```

#### 3d. `generateTextOutput` — precision tests

```text
describe('generateTextOutput precision') {
  test('badge URL is first line, blank line second, package third')
  test('no badge prefix when badgeUrl is null')
  test('branch rate included when hideBranchRate=false')
  test('branch count totals in summary row when hideBranchRate=false')
    → summary contains '(262 / 378)'
  test('complexity included in package row when hideComplexity=false')
  test('complexity formatted as integer in output')
    → pkg.complexity=671 → 'Complexity = 671'
  test('complexity formatted with 4 decimals for non-integer')
    → pkg.complexity=3.14159 → 'Complexity = 3.1416'
  test('branch output suppressed when all branch values are zero')
  test('failBelowMin message shows threshold percentage')
    → lower=0.5 → 'Minimum allowed line rate is 50%'
}
```

#### 3e. `generateMarkdownOutput` — precision tests

```text
describe('generateMarkdownOutput precision') {
  test('first line is package header when badge=false')
    → line[0] === 'Package | Line Rate | Branch Rate | Complexity | Health'
  test('badge image is exact format on first line')
    → line[0] === '![Code Coverage](https://...)'
  test('blank line between badge and table')
    → line[1] === ''
  test('line rate value bolded in summary row')
    → contains '**83%**'
  test('branch rate value bolded in summary row')
    → contains '**69%**'
  test('complexity value bolded in summary row')
    → contains '**671**'
  test('table has only Package and Line Rate columns when all optional cols hidden')
    → hideBranchRate=true, hideComplexity=true, indicators=false
    → header === 'Package | Line Rate'
  test('branch columns absent when hideBranchRate=true')
  test('complexity column absent when hideComplexity=true')
  test('health column present when indicators=true')
  test('health column absent when indicators=false')
  test('failBelowMin note uses backtick-quoted percentage')
    → contains '_Minimum allowed line rate is `50%`_'
}
```

### Step 4 — Agent Context Update

Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType copilot` to refresh
the Copilot agent context with any technology additions from this plan. (No new technology
is added; this is a no-op but is required by the workflow.)

## Complexity Tracking

> No Constitution violations. Table left intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| — | — | — |
