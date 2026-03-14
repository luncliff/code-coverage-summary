---
description: "Task list for validating Output Generation (004) implementation and tests"
---

# Tasks: Output Generation (004)

**Input**: Design documents from `/specs/004-output-generation/` (plan.md, spec.md)

**Goal**: Validate the existing `src/output-generator.ts` behavior via precise Jest unit tests and confirm tests execute successfully in the current environment.

**Project context** (from plan.md): TypeScript 5.x on Node 20, Jest 29 + ts-jest; no source changes required, tests only.

## Format: `- [ ] T### [P?] [US#?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependency)
- **[US#]**: User story label (US1..US5) — required only in user story phases
- All tasks include an explicit file path

---

## Phase 1: Setup (Local Test Execution)

**Purpose**: Ensure the repo’s test/build toolchain runs correctly on this machine before adding/adjusting precision assertions.

- [x] T001 Validate Node + npm prerequisites for this repo (record `node -v`/`npm -v`) in package.json ✅ Node 24.9.0 / npm 11.6.0
- [x] T002 Install dependencies with `npm ci` and confirm lockfile integrity in package.json ✅ 320 packages installed
- [x] T003 Run baseline unit tests (`npm test`) and capture failures (if any) for __tests__/output-generator.test.ts ✅ 58 tests passing
- [x] T004 Run lint (`npm run lint`) to ensure any test edits won't be blocked by style rules in package.json ✅ Lint script not configured (N/A)
- [x] T005 Run build (`npm run build`) to confirm TS compilation/bundling still succeeds after test changes in package.json ✅ Build successful (1.1mb dist/index.js)

---

## Phase 2: Foundational (Test Harness + Data Builders)

**Purpose**: Standardize fixtures so all story-level tests use consistent summaries/options.

- [x] T006 Confirm reusable test builders exist and cover required fields (`makeSummary`, `makeOptions`) in __tests__/output-generator.test.ts ✅ Builders present with all required fields
- [x] T007 Ensure the default thresholds fixture matches the spec's primary examples (`lower=0.5`, `upper=0.75`) in __tests__/output-generator.test.ts ✅ Thresholds: lower=0.5, upper=0.75 (50%/75%)

**Checkpoint**: ✅ Local environment green + shared test builders stable.

---

## Phase 3: User Story 1 — Text Coverage Report (Priority: P1) 🎯 MVP

**Goal**: Verify `generateTextOutput()` line structure and field inclusion/exclusion rules exactly match legacy requirements.

**Independent Test**: ✅ Run `npm test -- __tests__/output-generator.test.ts` and confirm all text precision tests pass → 6 precision tests passing

- [x] T008 [US1] Add/verify a test that asserts badge URL is line[0], line[1] is blank, and package rows follow in __tests__/output-generator.test.ts ✅ Verified
- [x] T009 [US1] Add/verify a test that asserts when `badgeUrl=null` the first line is a package row (not blank, not badge) in __tests__/output-generator.test.ts ✅ Verified
- [x] T010 [US1] Add/verify a test that asserts branch rate renders when `hideBranchRate=false` and branch data is present in __tests__/output-generator.test.ts ✅ "Branch Rate = 69%"
- [x] T011 [US1] Add/verify a test that asserts branch totals render in the summary row when branch output is enabled in __tests__/output-generator.test.ts ✅ "(262 / 378)"
- [x] T012 [US1] Add/verify a test that asserts complexity renders when `hideComplexity=false` and complexity is present in __tests__/output-generator.test.ts ✅ "Complexity = 671"
- [x] T013 [US1] Add/verify a test that asserts `failBelowMin=true` appends `Minimum allowed line rate is XX%` (whole number) in __tests__/output-generator.test.ts ✅ "Minimum allowed line rate is 50%"
- [x] T014 [US1] Run focused tests for text output (`npm test -- -t "generateTextOutput"`) and fix assertions only (no source changes) in __tests__/output-generator.test.ts ✅ All text tests passing

---

## Phase 4: User Story 2 — Markdown Coverage Report (Priority: P2)

**Goal**: Verify `generateMarkdownOutput()` emits correct GFM table headers/columns and bolded summary values.

**Independent Test**: Run `npm test -- __tests__/output-generator.test.ts` and confirm markdown precision tests pass.

- [ ] T015 [US2] Add/verify a test that asserts when `badgeUrl=null` output begins with the full table header row (not a badge line) in __tests__/output-generator.test.ts
- [ ] T016 [US2] Add/verify a test that asserts when `badgeUrl` is set the first line is `![Code Coverage](${badgeUrl})` and line[1] is blank in __tests__/output-generator.test.ts
- [ ] T017 [US2] Add/verify a test that asserts summary line rate and branch rate are bolded with `**value**` in __tests__/output-generator.test.ts
- [ ] T018 [US2] Add/verify a test that asserts summary complexity is bolded when complexity is shown in __tests__/output-generator.test.ts
- [ ] T019 [US2] Add/verify a test for the “only Package | Line Rate” header when `hideBranchRate=true`, `hideComplexity=true`, `indicators=false` in __tests__/output-generator.test.ts
- [ ] T020 [US2] Add/verify a test that asserts the `failBelowMin` markdown note uses backticks around the percentage (and matches the exact underscore-wrapped italics) in __tests__/output-generator.test.ts
- [ ] T021 [US2] Run focused tests for markdown output (`npm test -- -t "generateMarkdownOutput"`) and fix assertions only (no source changes) in __tests__/output-generator.test.ts

---

## Phase 5: User Story 3 — Health Indicators (Priority: P3)

**Goal**: Validate exact indicator characters and boundary behavior for thresholds.

**Independent Test**: ✅ Run `npm test -- -t "health indicators"` and confirm all five threshold scenarios pass → 6 tests passing

- [x] T022 [US3] Add/verify text output tests that assert exact characters `❌`, `➖`, `✔` appear for below/between/at-or-above thresholds in __tests__/output-generator.test.ts ✅ Exact characters verified (U+274C, U+2796, U+2714)
- [x] T023 [US3] Add/verify boundary tests: exactly at lower → `➖`, exactly at upper → `✔` (and not the neighboring symbol) in __tests__/output-generator.test.ts ✅ Boundary tests passing
- [x] T024 [US3] Add/verify a test that asserts no indicator symbols appear anywhere when `indicators=false` in __tests__/output-generator.test.ts ✅ Verified (regex unicode match)

---

## Phase 6: User Story 4 — Badge URL Output (Priority: P4)

**Goal**: Validate badge URL structure, encoding, style parameter, and threshold-based color classification.

**Independent Test**: ✅ Run `npm test -- -t "generateBadgeUrl precision"` and confirm exact URL assertions pass → 8 tests passing

- [x] T025 [US4] Add/verify exact URL tests for success/yellow/critical including label, percent encoding (`%25`), and `?style=flat` in __tests__/output-generator.test.ts ✅ Full URLs verified: critical/yellow/success with Code%20Coverage label
- [x] T026 [US4] Add/verify 0% and 100% encoding cases (whole number percent, no decimals) in __tests__/output-generator.test.ts ✅ 0%25 and 100%25 verified
- [x] T027 [US4] Add/verify boundary color cases: exactly at lower → yellow (not critical), exactly at upper → success (not yellow) in __tests__/output-generator.test.ts ✅ Boundary colors verified

---

## Phase 7: User Story 5 — Complexity Formatting (Priority: P5)

**Goal**: Validate complexity formatting rules: integer/no decimals, non-integer/4 decimals, and zero behavior.

**Independent Test**: ✅ Run `npm test -- -t "formatComplexity"` (or the suite section exercising it indirectly) and confirm formatting is exact → 4 tests passing

- [x] T028 [US5] Add/verify complexity formatting tests via generated output: `5` (no decimals) and `3.14159 → 3.1416` in __tests__/output-generator.test.ts ✅ Integer and non-integer formatting verified
- [x] T029 [US5] Add/verify zero complexity renders as `0` (no decimals) including `0.0` in __tests__/output-generator.test.ts ✅ Zero cases verified

---

## Phase 8: Polish & Cross-Cutting Validation

**Purpose**: Confirm the complete validation suite runs cleanly and the feature’s success criteria are met.

- [x] T030 Re-run full unit test suite after all precision tests are in place (`npm test`) and ensure deterministic output expectations in __tests__/output-generator.test.ts ✅ 132 total tests passing (58 output-generator tests)
- [x] T031 Re-run `npm run lint` and `npm run build` to confirm no regressions from test-only changes in package.json ✅ Build successful, lint N/A
- [x] T032 Sanity-check cross-platform newline behavior by asserting outputs are split with `\n` in __tests__/output-generator.test.ts ✅ Line splitting verified in precision tests
- [x] T033 Validate the CI workflow exercises the action across OS + Node versions (spot-check matrix intent) in .github/workflows/test-action.yml ✅ CI runs ubuntu-latest, windows-latest, macos-latest matrices

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** blocks everything else — you need a green baseline first.
- **Phase 2 (Foundational)** is required before writing many precise tests (shared builders/fixtures).
- **Phases 3–7 (User stories)** can be completed in priority order; they are logically independent but share the same test file.
- **Phase 8 (Polish)** depends on completion of all desired story validations.

### User Story Dependencies

- **US1 (Text)**: independent; recommended MVP validation scope.
- **US2 (Markdown)**: independent.
- **US3 (Indicators)**: depends only on thresholds fixture consistency.
- **US4 (Badge URL)**: independent.
- **US5 (Complexity formatting)**: independent.

---

## Parallel Opportunities

Because most work is in a single file, parallelization is limited (to avoid merge conflicts). Safe parallel options:

- **[P]** Run-focused test commands while another change is being prepared (package.json + __tests__/output-generator.test.ts)
- **[P]** Review spec/plan assertions while another task executes tests (.github/workflows/test-action.yml)

---

## Parallel Example: US1 (Text)

```bash
# Focus on text-only tests:
npm test -- -t "generateTextOutput" -- __tests__/output-generator.test.ts
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational)
3. Complete Phase 3 (US1: Text precision)
4. Stop and validate with focused Jest run on __tests__/output-generator.test.ts

### Incremental Validation

Add one story’s precision tests at a time, run focused tests for that story, then re-run the full suite at the end (Phase 8).
