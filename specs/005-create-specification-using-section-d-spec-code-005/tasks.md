---

description: "Task list for Coverage Aggregation & Threshold Classification"
---

# Tasks: Coverage Aggregation & Threshold Classification

**Input**: Design documents from `/specs/005-create-specification-using-section-d-spec-code-005/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Regression tests are requested to validate aggregation, branch suppression, and threshold parsing.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add deterministic fixtures needed for aggregation regression tests.

- [X] T001 Add deterministic Cobertura fixtures for aggregation tests in src/coverage.aggregate-a.xml and src/coverage.aggregate-b.xml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared summary metadata required for all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Update CoverageSummary and createEmptySummary to track fileCount and branchFileCount for averaging in src/coverage-parser.ts

**Checkpoint**: Foundation ready - user story implementation can now begin.

---

## Phase 3: User Story 1 - Aggregate multi-file coverage results (Priority: P1) �� MVP

**Goal**: Aggregate multi-file coverage totals and compute legacy-compatible average rates.

**Independent Test**: Run the action against the two aggregation fixtures and verify summed totals plus unweighted average rates match expectations.

### Tests for User Story 1

- [X] T003 [US1] Add multi-file aggregation regression test using coverage.aggregate fixtures in __tests__/coverage-parser.test.ts

### Implementation for User Story 1

- [X] T004 [P] [US1] Update parseCoverageFile to increment fileCount/branchFileCount and accumulate per-file root rates and counts in src/coverage-parser.ts
- [X] T005 [P] [US1] Update aggregation in src/index.ts to compute lineRate averages from fileCount and branchRate averages from branchFileCount while preserving summed totals in src/index.ts

**Checkpoint**: User Story 1 is fully functional and independently testable.

---

## Phase 4: User Story 2 - Hide branch rate when branch data is absent (Priority: P2)

**Goal**: Suppress branch-rate output whenever branch metrics are absent or zero.

**Independent Test**: Generate text/markdown output from a summary with zero branch metrics and verify branch columns are omitted.

### Tests for User Story 2

- [X] T006 [US2] Add branch-suppression regression tests for zero branch metrics in __tests__/output-generator.test.ts

### Implementation for User Story 2

- [X] T007 [P] [US2] Update branch output suppression to honor branchMetricsPresent plus zero totals in src/output-generator.ts
- [X] T008 [P] [US2] Adjust effective hideBranchRate calculation for branchMetricsPresent/branchFileCount logic in src/index.ts

**Checkpoint**: User Story 2 is fully functional and independently testable.

---

## Phase 5: User Story 3 - Parse thresholds and classify badge color (Priority: P3)

**Goal**: Parse thresholds with legacy clamping rules and classify badge color from summary line rate.

**Independent Test**: Validate threshold parsing across single/dual values, out-of-range inputs, and lower>upper adjustments, then verify badge classification boundaries.

### Tests for User Story 3

- [X] T009 [US3] Extend threshold parsing and badge classification tests for negative/out-of-range and lower>upper cases in __tests__/output-generator.test.ts

### Implementation for User Story 3

- [X] T010 [US3] Update parseThresholds to clamp inputs to 0–1, handle negatives, and enforce upper-adjustment rules in src/output-generator.ts

**Checkpoint**: User Story 3 is fully functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and validation across stories.

- [X] T011 [P] Update aggregation, branch suppression, and threshold parsing notes in README-original.md
- [X] T012 [P] Validate and update the multi-file example in specs/005-create-specification-using-section-d-spec-code-005/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories.
- **User Stories (Phase 3+)**: Depend on Foundational completion.
- **Polish (Phase 6)**: Depends on completion of all desired user stories.

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Foundational phase only.
- **User Story 2 (P2)**: Depends on Foundational phase; uses aggregation output from US1.
- **User Story 3 (P3)**: Depends on Foundational phase; uses aggregation output from US1.

### Parallel Opportunities

- T004 and T005 can proceed in parallel after T002 (different files).
- T007 and T008 can proceed in parallel after T006 (different files).
- Documentation tasks T011 and T012 can run in parallel after user story completion.

---

## Parallel Example: User Story 1

```bash
Task: "Update parseCoverageFile to increment fileCount/branchFileCount and accumulate per-file root rates and counts in src/coverage-parser.ts"
Task: "Update aggregation in src/index.ts to compute lineRate averages from fileCount and branchRate averages from branchFileCount while preserving summed totals in src/index.ts"
```

## Parallel Example: User Story 2

```bash
Task: "Update branch output suppression to honor branchMetricsPresent plus zero totals in src/output-generator.ts"
Task: "Adjust effective hideBranchRate calculation for branchMetricsPresent/branchFileCount logic in src/index.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Extend threshold parsing and badge classification tests for negative/out-of-range and lower>upper cases in __tests__/output-generator.test.ts"
Task: "Update parseThresholds to clamp inputs to 0–1, handle negatives, and enforce upper-adjustment rules in src/output-generator.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. **Stop and validate**: Run the US1 regression test and verify aggregation outputs.

### Incremental Delivery

1. Complete Setup + Foundational.
2. Deliver User Story 1 → validate aggregation output.
3. Deliver User Story 2 → validate branch suppression.
4. Deliver User Story 3 → validate threshold parsing and badge classification.
5. Finish with documentation polish.

---

## Notes

- [P] tasks = different files, no dependencies.
- Each user story should be independently completable and testable.
- Tests should fail before implementation, then pass after the change.
