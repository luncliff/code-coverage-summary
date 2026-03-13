# Tasks: Output Generation (004)

**Feature**: Output Generation (spec code 004)  
**Input**: Design documents from `specs/004-output-generation/`  
**Prerequisites**: plan.md ✅, spec.md ✅ (SI-E1–SI-E5), data-model.md ✅, contracts/ ✅  
**Approach**: Test-first — write precision tests for each FR, run them (most should pass since
the implementation is already complete), fix any gaps found in `src/output-generator.ts`, verify
all tests pass before proceeding to the next story.  
**Scope**: Extend `__tests__/output-generator.test.ts` with ~30 precision tests; zero or minimal
source changes required (the most likely source fix is zero-branch-rate suppression).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different `test()` blocks, no intra-story dependency)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every description

---

## Phase 1: Setup — Baseline Verification

**Purpose**: Confirm the existing 12 tests pass before adding new tests; record the baseline
so any regression introduced during this feature is immediately visible.

- [X] T001 Run `npm test -- --testPathPattern=output-generator` and record the count of passing tests (expected: 12); if any existing test fails, fix it in `__tests__/output-generator.test.ts` before proceeding

---

## Phase 2: Foundational — Fixture Audit

**Purpose**: Confirm that the existing `makeSummary()` and `makeOptions()` helper functions
in `__tests__/output-generator.test.ts` supply all field values required by the precision
tests below (`branchesCovered`, `branchesValid`, `complexity`, single-package `packages`
array). No new files or dependencies are needed.

> **Note**: The implementation in `src/output-generator.ts` is already complete. All phases
> below add new `describe` blocks to `__tests__/output-generator.test.ts`. **Existing tests
> must not be modified.**

- [X] T002 Read `makeSummary()` and `makeOptions()` in `__tests__/output-generator.test.ts` and confirm the defaults (`branchesCovered: 262`, `branchesValid: 378`, `complexity: 671`, `packages: [{ name: 'MyPackage', lineRate: 0.83, branchRate: 0.69, complexity: 671 }]`) are sufficient for all precision tests; no code change expected, document any missing fields

**Checkpoint**: Baseline green, fixture defaults confirmed — user story phases may now begin

---

## Phase 3: User Story 1 — Text Coverage Report (Priority: P1) 🎯 MVP

**Goal**: Every `generateTextOutput` format/flag combination exactly matches legacy structure.

**Independent Test**: `npm test -- --testPathPattern=output-generator -t "generateTextOutput precision"`

### Tests for User Story 1

> **TDD**: Write all tests first, then run — fix `src/output-generator.ts` only if a test fails.

- [X] T003 [P] [US1] In `__tests__/output-generator.test.ts`, add `describe('generateTextOutput precision')` block with test `badge URL is on line[0] and blank string is on line[1]`: split output on `\n`, assert `lines[0]` equals the provided `badgeUrl` value and `lines[1]` equals `''`
- [X] T004 [P] [US1] In `describe('generateTextOutput precision')` in `__tests__/output-generator.test.ts`, add test `first line contains package name when badgeUrl is null`: call with `makeOptions({ badgeUrl: null })`, assert `output.split('\n')[0]` contains `'MyPackage'` and output does NOT begin with `'\n'`
- [X] T005 [P] [US1] In `describe('generateTextOutput precision')` in `__tests__/output-generator.test.ts`, add test `branch rate appears in package row when hideBranchRate is false`: call with `makeOptions({ hideBranchRate: false })` and `makeSummary()` (branchRate 0.69), assert output contains `'Branch Rate = 69%'`
- [X] T006 [P] [US1] In `describe('generateTextOutput precision')` in `__tests__/output-generator.test.ts`, add test `branch totals appear in summary row when hideBranchRate is false`: call with `hideBranchRate: false`, assert summary line contains `'(262 / 378)'`
- [X] T007 [P] [US1] In `describe('generateTextOutput precision')` in `__tests__/output-generator.test.ts`, add test `complexity appears in package row when hideComplexity is false`: call with `makeOptions({ hideComplexity: false })`, assert output contains `'Complexity = 671'`
- [X] T008 [P] [US1] In `describe('generateTextOutput precision')` in `__tests__/output-generator.test.ts`, add test `failBelowMin message shows threshold as whole-number percentage`: call with `makeOptions({ failBelowMin: true })` (thresholds.lower defaults to 0.5), assert output contains `'Minimum allowed line rate is 50%'`
- [X] T009 [US1] Run `npm test -- --testPathPattern=output-generator -t "generateTextOutput precision"` and verify all T003–T008 tests pass; if any fail, fix `src/output-generator.ts` to match expected output, then re-run until green

**Checkpoint**: Text output precision tests complete — all 6 new tests pass

---

## Phase 4: User Story 2 — Markdown Coverage Report (Priority: P2)

**Goal**: Markdown table header, badge image tag, column set, and bold summary row exactly
match legacy output for every format/flag combination.

**Independent Test**: `npm test -- --testPathPattern=output-generator -t "generateMarkdownOutput precision"`

### Tests for User Story 2

> **TDD**: Write all tests first, then run — fix `src/output-generator.ts` only if a test fails.

- [X] T010 [P] [US2] In `__tests__/output-generator.test.ts`, add `describe('generateMarkdownOutput precision')` block with test `first line is full table header when badgeUrl is null`: call with `makeOptions({ badgeUrl: null })` and default options (all columns visible), assert `output.split('\n')[0]` equals `'Package | Line Rate | Branch Rate | Complexity | Health'`
- [X] T011 [P] [US2] In `describe('generateMarkdownOutput precision')` in `__tests__/output-generator.test.ts`, add test `badge image tag is exact markdown syntax on line[0]`: provide `badgeUrl: 'https://img.shields.io/badge/Code%20Coverage-83%25-success?style=flat'`, assert `output.split('\n')[0]` equals `'![Code Coverage](https://img.shields.io/badge/Code%20Coverage-83%25-success?style=flat)'`
- [X] T012 [P] [US2] In `describe('generateMarkdownOutput precision')` in `__tests__/output-generator.test.ts`, add test `line[1] is blank string between badge image and table header`: provide a non-null `badgeUrl`, assert `output.split('\n')[1]` equals `''`
- [X] T013 [P] [US2] In `describe('generateMarkdownOutput precision')` in `__tests__/output-generator.test.ts`, add test `summary line rate value is wrapped in double asterisks`: call with `makeSummary({ lineRate: 0.83 })`, assert output contains `'**83%**'`
- [X] T014 [P] [US2] In `describe('generateMarkdownOutput precision')` in `__tests__/output-generator.test.ts`, add test `summary branch rate value is wrapped in double asterisks`: call with `makeOptions({ hideBranchRate: false })` and `makeSummary({ branchRate: 0.69 })`, assert output contains `'**69%**'`
- [X] T015 [P] [US2] In `describe('generateMarkdownOutput precision')` in `__tests__/output-generator.test.ts`, add test `summary complexity value is wrapped in double asterisks`: call with `makeOptions({ hideComplexity: false })` and `makeSummary({ complexity: 671 })`, assert output contains `'**671**'`
- [X] T016 [P] [US2] In `describe('generateMarkdownOutput precision')` in `__tests__/output-generator.test.ts`, add test `table header equals "Package | Line Rate" when all optional columns are hidden`: call with `makeOptions({ hideBranchRate: true, hideComplexity: true, indicators: false, badgeUrl: null })`, assert `output.split('\n')[0]` equals `'Package | Line Rate'`
- [X] T017 [P] [US2] In `describe('generateMarkdownOutput precision')` in `__tests__/output-generator.test.ts`, add test `failBelowMin note uses backtick-quoted percentage`: call with `makeOptions({ failBelowMin: true })` (thresholds.lower = 0.5), assert output contains `` '_Minimum allowed line rate is `50%`_' ``
- [X] T018 [US2] Run `npm test -- --testPathPattern=output-generator -t "generateMarkdownOutput precision"` and verify all T010–T017 tests pass; if any fail, fix `src/output-generator.ts`, then re-run until green

**Checkpoint**: Markdown output precision tests complete — all 8 new tests pass

---

## Phase 5: User Story 3 — Health Indicators (Priority: P3)

**Goal**: Exact Unicode characters `❌` `➖` `✔` are rendered at the correct threshold
boundaries, including the exactly-at-lower and exactly-at-upper edge cases.

**Independent Test**: `npm test -- --testPathPattern=output-generator -t "health indicators precision"`

### Tests for User Story 3

> **TDD**: Write all tests first, then run — fix `src/output-generator.ts` `healthIndicator()`
> only if a test fails. `healthIndicator` is not exported; test via `generateTextOutput` output.

- [X] T019 [P] [US3] In `__tests__/output-generator.test.ts`, add `describe('health indicators precision')` block with test `❌ (U+274C) exact character when lineRate is below lower threshold`: call `generateTextOutput(makeSummary({ lineRate: 0.3, packages: [{ name: 'P', lineRate: 0.3, branchRate: 0, complexity: 0 }] }), makeOptions({ indicators: true }))`, assert output contains the literal character `❌`
- [X] T020 [P] [US3] In `describe('health indicators precision')` in `__tests__/output-generator.test.ts`, add test `➖ (U+2796) exact character when lineRate is between thresholds`: use `lineRate: 0.6`, `thresholds: { lower: 0.5, upper: 0.75 }`, assert output contains the literal character `➖`
- [X] T021 [P] [US3] In `describe('health indicators precision')` in `__tests__/output-generator.test.ts`, add test `✔ (U+2714) exact character when lineRate is at or above upper threshold`: use `lineRate: 0.9`, `thresholds: { lower: 0.5, upper: 0.75 }`, assert output contains the literal character `✔`
- [X] T022 [P] [US3] In `describe('health indicators precision')` in `__tests__/output-generator.test.ts`, add test `➖ when lineRate equals lower threshold exactly (boundary)`: use `lineRate: 0.5` (== lower), assert output contains `➖` and does NOT contain `❌`
- [X] T023 [P] [US3] In `describe('health indicators precision')` in `__tests__/output-generator.test.ts`, add test `✔ when lineRate equals upper threshold exactly (boundary)`: use `lineRate: 0.75` (== upper), assert output contains `✔` and does NOT contain `➖`
- [X] T024 [P] [US3] In `describe('health indicators precision')` in `__tests__/output-generator.test.ts`, add test `no indicator symbols appear anywhere when indicators is false`: call with `makeOptions({ indicators: false })`, assert output does NOT match `/[❌➖✔]/u`
- [X] T025 [US3] Run `npm test -- --testPathPattern=output-generator -t "health indicators precision"` and verify all T019–T024 tests pass; if any fail (check exact Unicode codepoints and boundary comparisons), fix `healthIndicator()` in `src/output-generator.ts`, then re-run until green

**Checkpoint**: Health indicator boundary and character tests complete — all 6 new tests pass

---

## Phase 6: User Story 4 — Shields.io Badge URL (Priority: P4)

**Goal**: Badge URL matches the exact legacy Shields.io path, `%25` percent encoding, named
color, and `?style=flat` parameter for all coverage values and threshold boundary conditions.

**Independent Test**: `npm test -- --testPathPattern=output-generator -t "generateBadgeUrl precision"`

### Tests for User Story 4

> **TDD**: Write all tests first, then run — fix `generateBadgeUrl()` in `src/output-generator.ts`
> only if a test fails. `generateBadgeUrl` IS exported and can be called directly.

- [X] T026 [P] [US4] In `__tests__/output-generator.test.ts`, add `describe('generateBadgeUrl precision')` block with test `full URL for 83% success`: assert `generateBadgeUrl(makeSummary({ lineRate: 0.83 }), { lower: 0.5, upper: 0.75 })` equals the exact string `'https://img.shields.io/badge/Code%20Coverage-83%25-success?style=flat'`
- [X] T027 [P] [US4] In `describe('generateBadgeUrl precision')` in `__tests__/output-generator.test.ts`, add test `full URL for 40% critical`: assert `generateBadgeUrl(makeSummary({ lineRate: 0.4 }), { lower: 0.5, upper: 0.75 })` equals `'https://img.shields.io/badge/Code%20Coverage-40%25-critical?style=flat'`
- [X] T028 [P] [US4] In `describe('generateBadgeUrl precision')` in `__tests__/output-generator.test.ts`, add test `full URL for 60% yellow`: assert `generateBadgeUrl(makeSummary({ lineRate: 0.6 }), { lower: 0.5, upper: 0.75 })` equals `'https://img.shields.io/badge/Code%20Coverage-60%25-yellow?style=flat'`
- [X] T029 [P] [US4] In `describe('generateBadgeUrl precision')` in `__tests__/output-generator.test.ts`, add test `0% encodes as 0%25 in URL`: call with `lineRate: 0.0`, assert result contains `'-0%25-'`
- [X] T030 [P] [US4] In `describe('generateBadgeUrl precision')` in `__tests__/output-generator.test.ts`, add test `100% encodes as 100%25 in URL`: call with `lineRate: 1.0`, `thresholds: { lower: 0.5, upper: 0.75 }`, assert result contains `'-100%25-'`
- [X] T031 [P] [US4] In `describe('generateBadgeUrl precision')` in `__tests__/output-generator.test.ts`, add test `style=flat query parameter present for all three colors`: assert all three calls (lineRate 0.3 / 0.6 / 0.9) each produce a URL containing `'?style=flat'`
- [X] T032 [P] [US4] In `describe('generateBadgeUrl precision')` in `__tests__/output-generator.test.ts`, add test `exactly at lower threshold yields yellow (not critical)`: call with `lineRate: 0.5` (== lower), assert result contains `'yellow'` and does NOT contain `'critical'`
- [X] T033 [P] [US4] In `describe('generateBadgeUrl precision')` in `__tests__/output-generator.test.ts`, add test `exactly at upper threshold yields success (not yellow)`: call with `lineRate: 0.75` (== upper), assert result contains `'success'` and does NOT contain `'yellow'`
- [X] T034 [US4] Run `npm test -- --testPathPattern=output-generator -t "generateBadgeUrl precision"` and verify all T026–T033 tests pass; if any fail (e.g., wrong color at boundary, missing `?style=flat`), fix `generateBadgeUrl()` in `src/output-generator.ts`, then re-run until green

**Checkpoint**: Badge URL precision tests complete — all 8 new URL structure and boundary tests pass

---

## Phase 7: User Story 5 — Complexity Formatting (Priority: P5)

**Goal**: Complexity values render with correct decimal places per legacy formatting rules:
integer value → no decimal point; non-integer → exactly 4 decimal places; zero → `"0"`.

**Independent Test**: `npm test -- --testPathPattern=output-generator -t "formatComplexity"`

### Tests for User Story 5

> **TDD**: Write all tests first, then run — fix `formatComplexity()` in `src/output-generator.ts`
> only if a test fails. `formatComplexity` is not exported; test via `generateTextOutput` output.

- [X] T035 [P] [US5] In `__tests__/output-generator.test.ts`, add `describe('formatComplexity via generateTextOutput')` block with test `integer complexity renders without decimal point`: call `generateTextOutput` with `makeSummary({ complexity: 5, packages: [{ name: 'P', lineRate: 0.83, branchRate: 0.69, complexity: 5 }] })` and `makeOptions({ hideComplexity: false })`, assert output contains `'Complexity = 5'` and does NOT contain `'Complexity = 5.'`
- [X] T036 [P] [US5] In `describe('formatComplexity via generateTextOutput')` in `__tests__/output-generator.test.ts`, add test `non-integer complexity renders with exactly 4 decimal places`: use `complexity: 3.14159` in both summary and package, assert output contains `'Complexity = 3.1416'`
- [X] T037 [P] [US5] In `describe('formatComplexity via generateTextOutput')` in `__tests__/output-generator.test.ts`, add test `zero complexity renders as "0" with no decimal point`: use `complexity: 0` in both summary and package, assert output contains `'Complexity = 0'` and does NOT contain `'Complexity = 0.'`
- [X] T038 [P] [US5] In `describe('formatComplexity via generateTextOutput')` in `__tests__/output-generator.test.ts`, add test `0.0 (float zero) renders as "0"`: use `complexity: 0.0` (equivalent to 0 in JS), assert output contains `'Complexity = 0'` and does NOT contain `'Complexity = 0.'`
- [X] T039 [US5] Run `npm test -- --testPathPattern=output-generator -t "formatComplexity"` and verify all T035–T038 tests pass; if any fail, fix `formatComplexity()` in `src/output-generator.ts`, then re-run until green

**Checkpoint**: Complexity formatting tests complete — all 4 decimal-rule tests pass

---

## Phase 8: Polish & Edge Cases

**Purpose**: Cover the remaining 4 edge cases from spec.md that span multiple user stories,
then run the full suite to confirm no regressions.

> **Likely source fix**: The zero-branch-rate suppression edge case (T040/T041) is expected
> to fail against the current implementation because `buildPackageTextLine` and
> `buildPackageMarkdownRow` in `src/output-generator.ts` do not guard against zero branch
> values. If T040/T041 fail, add `pkg.branchRate !== 0` guards before the branch-rate append
> statements in both functions (and the matching summary guard in `buildSummaryTextLine` and
> `buildSummaryMarkdownRow`).

- [X] T040 [P] In `__tests__/output-generator.test.ts`, add `describe('edge cases')` block with test `branch output suppressed in text format when all branch values are zero`: call `generateTextOutput` with `makeSummary({ branchRate: 0, branchesCovered: 0, branchesValid: 0, packages: [{ name: 'P', lineRate: 0.83, branchRate: 0, complexity: 0 }] })` and `makeOptions({ hideBranchRate: false })`; assert output does NOT contain `'Branch Rate'`
- [X] T041 [P] In `describe('edge cases')` in `__tests__/output-generator.test.ts`, add test `branch output suppressed in markdown format when all branch values are zero`: same zero-branch summary fixture, call `generateMarkdownOutput` with `hideBranchRate: false`; assert output does NOT contain `'Branch Rate'`
- [X] T042 [P] In `describe('edge cases')` in `__tests__/output-generator.test.ts`, add test `no badge content appears when badgeUrl is null`: call both `generateTextOutput` and `generateMarkdownOutput` with `makeOptions({ badgeUrl: null })`; assert neither output contains `'shields.io'` or `'![Code Coverage]'`
- [X] T043 [P] In `describe('edge cases')` in `__tests__/output-generator.test.ts`, add test `markdown header is exactly "Package | Line Rate" when hideBranchRate=true, hideComplexity=true, indicators=false`: call `generateMarkdownOutput` with `makeOptions({ hideBranchRate: true, hideComplexity: true, indicators: false, badgeUrl: null })`; assert `output.split('\n')[0]` equals `'Package | Line Rate'` with no additional pipe-delimited columns
- [X] T044 Run `npm test -- --testPathPattern=output-generator -t "edge cases"` and verify all T040–T043 pass; if T040/T041 fail (branch not suppressed for zero values), add zero-branch guards to `buildPackageTextLine`, `buildPackageMarkdownRow`, `buildSummaryTextLine`, and `buildSummaryMarkdownRow` in `src/output-generator.ts`, then re-run until green
- [X] T045 Run full test suite `npm test` and verify all tests pass with zero regressions; address any failures before proceeding
- [X] T046 [P] Confirm TypeScript compilation succeeds after any source changes: run `npm run build` (or `npx tsc --noEmit`) and verify no type errors in `src/output-generator.ts` or `__tests__/output-generator.test.ts`
- [X] T047 [P] Verify action interface parity: confirm `__tests__/index.test.ts` and `__tests__/coverage-parser.test.ts` still pass (no regressions from any source edits); if failures appear, revert only the breaking change and find an alternative fix

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 passing
- **User Story phases (3–7)**: All depend on Phase 2; each story phase is independent and
  can proceed in parallel with the others
- **Polish (Phase 8)**: Depends on all T003–T039 being complete and green

### User Story Dependencies

- **US1 (P1) — Text Report**: Independent; start after Phase 2
- **US2 (P2) — Markdown Report**: Independent; start after Phase 2 (parallel with US1)
- **US3 (P3) — Health Indicators**: Independent; start after Phase 2 (parallel)
- **US4 (P4) — Badge URL**: Independent; start after Phase 2 (parallel)
- **US5 (P5) — Complexity**: Independent; start after Phase 2 (parallel)

### TDD Order Within Each Story

1. Write all `[P]`-marked test bodies in the story's `describe` block
2. Run the story's focused test command (the `[non-P]` run task)
3. Fix `src/output-generator.ts` only if tests fail
4. Re-run until the story's describe block is fully green
5. Proceed to next story

### Parallel Opportunities

Within each user story, all test-authoring tasks are marked `[P]` — they populate different
`test()` bodies in the same `describe` block and have no ordering constraint. The run/fix
task is sequential (requires all test bodies to exist first).

Stories US1–US5 have no cross-story dependency and can be worked simultaneously by
different team members once Phase 2 is complete.

---

## Parallel Example: User Story 1 (Text Report)

```bash
# Author all 6 test bodies simultaneously (all marked [P]):
Task T003: "badge URL is on line[0] and blank string is on line[1]"
Task T004: "first line contains package name when badgeUrl is null"
Task T005: "branch rate appears in package row when hideBranchRate is false"
Task T006: "branch totals appear in summary row when hideBranchRate is false"
Task T007: "complexity appears in package row when hideComplexity is false"
Task T008: "failBelowMin message shows threshold as whole-number percentage"

# After all 6 test bodies are written, run (sequential):
Task T009: npm test -- --testPathPattern=output-generator -t "generateTextOutput precision"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Baseline verification (T001)
2. Complete Phase 2: Fixture audit (T002)
3. Complete Phase 3: US1 text precision tests (T003–T009)
4. **STOP and VALIDATE**: All 6 text precision tests pass
5. Expand to remaining stories in priority order

### Incremental Delivery

1. US1 text report → US2 markdown → US3 indicators → US4 badge URL → US5 complexity → edge cases
2. Each story's describe block goes fully green before moving to the next
3. Run full `npm test` after each story's run/fix task to guard against regressions

### Full Parallel Strategy

With multiple developers or a full-toolset agent:

1. Complete T001–T002 together (Phase 1 + 2)
2. Once Phase 2 is done, author all five story `describe` blocks simultaneously (T003–T038)
3. Run each story's focused test command sequentially per story (T009, T018, T025, T034, T039)
4. Complete Phase 8 edge cases (T040–T047)

---

## Notes

- All new tests go in `__tests__/output-generator.test.ts` inside new `describe` blocks;
  existing `describe` blocks and `test()` calls are **never modified**
- `formatComplexity()` and `healthIndicator()` are not exported — verify their behaviour
  via the `generateTextOutput()` and `generateMarkdownOutput()` return values
- `generateBadgeUrl()` IS exported — call it directly in Phase 6 tests
- Most tests are expected to pass without source changes (implementation is already complete);
  the most likely source fix is zero-branch-rate suppression (T040/T041)
- `[P]` tasks = different `test()` bodies, no file conflicts within a story
- `[US#]` labels map every task to a specific spec.md user story for traceability
- Commit after each story's run/fix task passes (T009, T018, T025, T034, T039, T044)
- Run `npm test` after every source change to catch regressions immediately
