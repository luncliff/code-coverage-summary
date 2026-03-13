# Tasks: Action Contract Inputs (002)

**Input**: Design documents from `specs/002-action-input-contract/` and `specs/copilot/002-action-input-contract/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/action-inputs.md ✅, quickstart.md ✅

**Approach**: TDD — write tests first, confirm indicators tests fail (bug is present), apply the one-line fix, confirm all tests pass.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and validated independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared-state dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths are included in every task description

---

## Phase 1: Setup

**Purpose**: Confirm development environment and clean baseline before any changes.

- [X] T001 Verify feature branch `copilot/002-action-input-contract` is active, run `npm install` from repository root to confirm dependencies are installed, and confirm `__tests__/index.test.ts` does not yet exist

---

## Phase 2: Foundational (Blocking Prerequisite)

**Purpose**: Establish a clean test baseline — confirm all existing tests pass before new code is added.

**⚠️ CRITICAL**: Must complete before writing new tests or applying fixes.

- [X] T002 Run `npm test` from repository root and confirm `coverage-parser.test.ts` and `output-generator.test.ts` all pass (zero failures); record the passing test count as the pre-change baseline

**Checkpoint**: Baseline confirmed — new test file and fix can now be applied.

---

## Phase 3: User Story 1 — Configure action with defaults (Priority: P1) 🎯 MVP

**Goal**: Verify that the action reads all nine declared inputs by their exact names and that omitting optional inputs produces behavior identical to providing each documented default explicitly (FR-001, FR-002, SC-001, SC-004).

**Independent Test**: Create `__tests__/index.test.ts`, mock `@actions/core`, invoke the parsing logic with only `filename` set, and assert each option resolves to its documented default. No real files, runners, or network access required.

### Tests for User Story 1 (TDD — write first)

> **Write these tests FIRST. US1 tests should PASS immediately because defaults are already wired correctly in `src/index.ts`. Failure here indicates a regression.**

- [X] T003 [US1] Create `__tests__/index.test.ts`: add `jest.mock('@actions/core')` at the top of the file, import `getInput` and `setFailed` mocks, and add a `describe('FR-001: declared input names', () => { … })` block that calls `getInput` with each of the nine input names (`filename`, `badge`, `fail_below_min`, `format`, `hide_branch_rate`, `hide_complexity`, `indicators`, `output`, `thresholds`) and asserts the mock is invoked with the exact string names declared in `action.yml`

- [X] T004 [US1] Add a `describe('FR-002: default-equivalence contract', () => { … })` block to `__tests__/index.test.ts`: mock `getInput` to return `''` for every optional input (simulating omission) and assert that the resolved values equal the documented defaults — `badge=false`, `fail_below_min=false`, `format='text'`, `hide_branch_rate=false`, `hide_complexity=false`, `indicators=true`, `output='console'`, `thresholds='50 75'`; also assert that a second scenario that explicitly provides each default string yields identical resolved values, satisfying SC-001

### No implementation change required for User Story 1

The nine input names and their default strings are already correctly declared in `action.yml` and read in `src/index.ts`. No source edits are needed.

**Checkpoint**: US1 tests pass — default-equivalence contract verified.

---

## Phase 4: User Story 2 — Provide multiple coverage files (Priority: P2)

**Goal**: Verify that `filename` is split on commas into distinct patterns (FR-003), that each pattern (including globs) is passed separately to `@actions/glob` (FR-004), and that spaces inside individual paths are preserved (FR-005, SC-003).

**Independent Test**: Mock `@actions/core` to return controlled `filename` values and mock `@actions/glob` to capture what patterns are passed to `glob.create()`; assert the correct newline-joined pattern string is received.

### Tests for User Story 2 (TDD — write first)

> **Write these tests FIRST. US2 tests should PASS immediately because the CSV/glob parsing logic is already correct in `src/index.ts`. Failure here indicates a regression.**

- [X] T005 [P] [US2] Add a `describe('FR-003/FR-004/FR-005: filename parsing', () => { … })` block to `__tests__/index.test.ts` containing:
  - A test that mocks `getInput('filename')` returning `'a.xml,b.xml'` and asserts `glob.create` is called with the pattern string `'a.xml\nb.xml'` (two patterns joined by newline, per `@actions/glob` API)
  - A test that mocks `filename` returning a glob string `'coverage/**/coverage.cobertura.xml'` and asserts `glob.create` receives that single pattern unchanged (FR-004)
  - A test that mocks `filename` returning `'path with spaces/coverage.xml'` and asserts the internal spaces are preserved after trimming (FR-005)
  - A test that mocks `filename` returning `' a.xml , b.xml '` (leading/trailing spaces around commas) and asserts the resulting patterns are `'a.xml'` and `'b.xml'` (whitespace stripped at boundaries only)
  - A test that mocks `filename` returning `'a.xml,,b.xml,'` (consecutive and trailing commas) and asserts only two non-empty patterns (`'a.xml'`, `'b.xml'`) are produced

### No implementation change required for User Story 2

The `filename` split/trim/filter/join logic in `src/index.ts` is already correct and fully satisfies FR-003 through FR-005. No source edits are needed.

**Checkpoint**: US2 tests pass — filename CSV and glob parsing contract verified.

---

## Phase 5: User Story 3 — Boolean inputs behave predictably (Priority: P3)

**Goal**: Verify that every boolean-like input (`badge`, `fail_below_min`, `hide_branch_rate`, `hide_complexity`, `indicators`) evaluates to `true` only for case-insensitive `"true"` and to `false` for all other values (FR-006, SC-002); then apply the one-line fix that brings `indicators` into compliance.

**Independent Test**: Mock `@actions/core` to return each value in a test matrix and assert the parsed boolean; the `indicators` column with non-standard truthy values (`'1'`, `'yes'`, `'on'`) must FAIL before the fix and PASS after.

### Tests for User Story 3 (TDD — write and confirm FAILING before fix)

> **Write these tests FIRST. The `indicators` rows for `'1'`, `'yes'`, `'on'`, and `''` will FAIL with the current `!== 'false'` logic — that is the expected TDD red state.**

- [X] T006 [US3] Add a `describe('FR-006: strict boolean input parsing', () => { … })` block to `__tests__/index.test.ts` using `test.each` with the following matrix for each of the five boolean inputs (`badge`, `fail_below_min`, `hide_branch_rate`, `hide_complexity`, `indicators`):

  | Input string | Expected parsed result |
  |---|---|
  | `'true'` | `true` |
  | `'True'` | `true` |
  | `'TRUE'` | `true` |
  | `'false'` | `false` |
  | `'False'` | `false` |
  | `'FALSE'` | `false` |
  | `'1'` | `false` |
  | `'yes'` | `false` |
  | `'on'` | `false` |
  | `''` (empty / omitted) | `false` |
  | `'arbitrary'` | `false` |

  Each test case mocks `getInput('<input-name>')` to return the input string and asserts the resulting boolean fed into `OutputOptions` (or verified via `core.info` output) equals the expected result; the `indicators` input is the critical case because the current `!== 'false'` logic will produce wrong results for `'1'`, `'yes'`, `'on'`, and `''`

- [X] T007 [US3] Run `npm test` from repository root and confirm the FR-006 `indicators` test cases for `'1'`, `'yes'`, `'on'`, and `''` FAIL — this documents that the bug exists and the TDD red state is established

### Implementation for User Story 3

- [X] T008 [US3] Apply the one-line fix in `src/index.ts` line 21: change

  ```ts
  const indicators = core.getInput('indicators').toLowerCase() !== 'false'
  ```

  to

  ```ts
  const indicators = core.getInput('indicators').toLowerCase() === 'true'
  ```

  No other changes to `src/index.ts` — all other boolean inputs already use `=== 'true'`.

- [X] T009 [US3] Run `npm test` from repository root and confirm **all** tests pass — FR-001 through FR-006 across all three user stories — with zero failures and zero regressions in `coverage-parser.test.ts` and `output-generator.test.ts`

**Checkpoint**: US3 tests pass — strict boolean contract enforced; `indicators` bug resolved.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Rebuild the distributable bundle, verify interface parity, and confirm quality gates are satisfied.

- [X] T010 [P] Rebuild the distributable bundle by running `npm run build` from repository root and confirm `dist/index.js` is updated with no TypeScript compiler errors — this is required for the action fix to take effect on GitHub-hosted runners

- [X] T011 [P] Verify interface parity: compare the nine input names read by `core.getInput(…)` in `src/index.ts` against the nine inputs declared in `action.yml` and confirm they match exactly (no additions, removals, or renames); satisfies SC-004

- [ ] T012 Validate the quickstart scenario from `specs/copilot/002-action-input-contract/quickstart.md`: confirm the workflow example with `indicators: 'true'` produces the expected enabled-indicator behavior and the `indicators: '1'` example now correctly resolves to disabled (demonstrating the fix)

- [X] T013 [P] Confirm `sonar-project.properties` test source paths include `__tests__/index.test.ts` (or the project-wide glob already covers it) so the new test file is picked up by SonarCloud static analysis

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion
- **User Stories (Phases 3–5)**: Depend on Phase 2 (baseline must be clean)
  - US1 (Phase 3) must complete before US2 (Phase 4) because both write to `__tests__/index.test.ts` (sequential file edits)
  - US2 (Phase 4) must complete before US3 (Phase 5) for the same reason
- **Polish (Phase 6)**: Depends on all user story phases completing (all tests green)

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Phase 2 — independent, no dependencies on US2/US3
- **US2 (P2)**: Can start after US1 completes (same file — sequential)
- **US3 (P3)**: Can start after US2 completes (same file — sequential); the one-line fix in `src/index.ts` is the implementation step

### Within Each User Story

```
Tests written (file created/extended)
    → npm test (confirm expected pass or expected fail)
    → Source fix applied (US3 only)
    → npm test (confirm all green)
```

### Parallel Opportunities

- T010 (build) and T011 (parity check) and T013 (sonar config check) can all run in parallel once T009 passes
- Within Phase 5: T007 (confirm fail) is a verification step with no file output — it can overlap with reading plan/contracts for context

---

## Parallel Example: User Story 3 (Polish Phase)

```bash
# Once T009 (all tests pass) is confirmed, launch polish tasks together:
Task T010: "Rebuild dist bundle with npm run build"
Task T011: "Verify interface parity against action.yml"
Task T013: "Confirm sonar-project.properties covers __tests__/index.test.ts"
# T012 depends on T010 (needs the built bundle to validate quickstart)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational baseline
3. Complete Phase 3: US1 — write defaults tests, confirm they pass
4. **STOP and VALIDATE**: `npm test` — all tests green, US1 contract verified
5. Demo: Action correctly reads all 9 inputs and applies documented defaults

### Incremental Delivery

1. Setup + Foundational → clean baseline
2. US1 → defaults contract tested → demo (MVP)
3. US2 → filename parsing tested → demo
4. US3 → boolean contract tested + `indicators` bug fixed → demo (bug resolved)
5. Polish → bundle rebuilt, parity verified → ready for merge

### Single-Developer Linear Strategy

Since all three user stories write to the same file (`__tests__/index.test.ts`), a single developer working sequentially is the most natural fit:

```
T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → T010‖T011‖T013 → T012
```

---

## Notes

- [P] tasks = can run simultaneously (different files, no overlapping writes)
- [US1]/[US2]/[US3] labels map tasks to spec.md user stories for traceability
- **TDD discipline**: T006 tests MUST be written before T008 (fix); T007 MUST confirm failure before proceeding to T008
- **One-line fix**: The only production code change is line 21 of `src/index.ts` (`!== 'false'` → `=== 'true'`); all other behavior is unchanged
- **Zero new dependencies**: `jest`, `ts-jest`, and `@actions/core` mock support are already present in `package.json`
- Commit after T009 (all tests pass) and after T010 (bundle rebuilt) as logical checkpoints
- The `dist/` bundle must be committed along with the source fix for the action to deploy correctly
