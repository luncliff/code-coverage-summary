---

description: "Task list for Cobertura XML parsing (003)"
---

# Tasks: Cobertura XML Parsing (003)

**Input**: Design documents from `/specs/003-cobertura-xml-parsing/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Tests are REQUIRED for this feature (see Constitution quality gates and plan.md).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared test fixtures required by multiple user stories.

- [X] T001 [P] Add missing-root fixture in src/coverage.missing-root.xml (omit a required root attribute)
- [X] T002 [P] Add invalid-root fixture in src/coverage.invalid-root.xml (non-numeric required root attribute)
- [X] T003 [P] Add no-branches fixture in src/coverage.no-branches.xml (required root attributes, no branch metrics)
- [X] T004 [P] Add no-packages fixture in src/coverage.no-packages.xml (required root attributes, zero <package> elements)
- [X] T005 [P] Add unnamed-packages fixture in src/coverage.unnamed-packages.xml (multiple packages with missing names and numeric attributes)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared data structures required for branch-metric detection across stories.

- [X] T006 Update CoverageSummary and createEmptySummary in src/coverage-parser.ts to include a branchMetricsPresent boolean defaulting to false
- [X] T007 [P] Update test helpers in __tests__/output-generator.test.ts to include branchMetricsPresent in CoverageSummary fixtures

**Checkpoint**: Shared summary structure ready; user story work can proceed.

---

## Phase 3: User Story 1 - Parse required Cobertura root metrics (Priority: P1) 🎯 MVP

**Goal**: Fail fast when required root metrics are missing or malformed, with filename-aware error reporting.

**Independent Test**: Run parsing against fixtures with and without required root attributes; verify failures include the filename and valid files parse.

### Tests for User Story 1 (write FIRST, expect failures) ⚠️

- [X] T008 [US1] Add failing tests in __tests__/coverage-parser.test.ts for missing/invalid root attributes using src/coverage.missing-root.xml and src/coverage.invalid-root.xml

### Implementation for User Story 1

- [X] T009 [P] [US1] Enforce required root attribute parsing with descriptive errors in src/coverage-parser.ts
- [X] T010 [P] [US1] Confirm parsing error messages include filenames in src/index.ts (adjust `Parsing Error` formatting if needed)

**Checkpoint**: Required root metrics validation works and is independently testable.

---

## Phase 4: User Story 2 - Allow optional branch metrics (Priority: P2)

**Goal**: Accept Cobertura files without branch metrics and suppress branch output only when all files omit branch data.

**Independent Test**: Run parsing against a no-branch fixture and a fixture with branch metrics; verify branch output suppression only when all files omit branch data.

### Tests for User Story 2 (write FIRST, expect failures) ⚠️

- [X] T011 [US2] Add tests in __tests__/coverage-parser.test.ts for src/coverage.no-branches.xml asserting parsing succeeds, branch metrics default to 0, and branchMetricsPresent is false

### Implementation for User Story 2

- [X] T012 [P] [US2] Track branch metric presence when parsing in src/coverage-parser.ts (set branchMetricsPresent when any branch attributes exist)
- [X] T013 [P] [US2] Use branchMetricsPresent to compute effectiveHideBranchRate in src/index.ts so branch output is suppressed only when all files lack branch metrics

**Checkpoint**: Branch metrics are optional and branch output suppression matches the specification.

---

## Phase 5: User Story 3 - Extract package rows with stable naming (Priority: P3)

**Goal**: Produce one package row per <package> element with deterministic fallback names and numeric defaults, even when packages are missing.

**Independent Test**: Parse fixtures with no packages and unnamed packages; verify zero rows for empty files and deterministic fallback names with numeric defaults.

### Tests for User Story 3 (write FIRST, expect failures) ⚠️

- [X] T014 [US3] Add tests in __tests__/coverage-parser.test.ts for src/coverage.no-packages.xml verifying parsing succeeds with zero package rows
- [X] T015 [US3] Add tests in __tests__/coverage-parser.test.ts for src/coverage.unnamed-packages.xml verifying fallback names (`<basename> Package <i>`) and numeric defaults of 0

### Implementation for User Story 3

- [X] T016 [P] [US3] Allow missing/empty <packages> elements without throwing in src/coverage-parser.ts while preserving fallback naming/defaults
- [X] T017 [P] [US3] Remove the zero-packages failure guard in src/index.ts so line-only coverage succeeds when no packages exist

**Checkpoint**: Package row extraction is stable and zero-package files succeed.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and quality checks.

- [X] T018 Run Jest unit tests covering __tests__/coverage-parser.test.ts and __tests__/output-generator.test.ts after all story work completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - blocks all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Depends on Phase 2 only
- **User Story 2 (P2)**: Depends on Phase 2 only
- **User Story 3 (P3)**: Depends on Phase 2 only

### Within Each User Story

- Tests MUST be written and fail before implementation tasks.
- Update parser logic before adjusting action-level behaviors (index.ts).

### Parallel Opportunities

- **Setup**: T001–T005 can run in parallel (distinct fixture files)
- **Foundational**: T007 can run in parallel with other foundational updates (separate file)
- **User Story 1**: T009 and T010 can run in parallel after T008
- **User Story 2**: T012 and T013 can run in parallel after T011 and T006
- **User Story 3**: T016 and T017 can run in parallel after T014–T015

---

## Parallel Example: User Story 1

```bash
# After completing the US1 tests (T008), implement these in parallel:
Task: "T009 [US1] Enforce required root attribute parsing in src/coverage-parser.ts"
Task: "T010 [US1] Confirm parsing error messages include filenames in src/index.ts"
```

## Parallel Example: User Story 2

```bash
# After completing the US2 tests (T011), implement these in parallel:
Task: "T012 [US2] Track branch metric presence in src/coverage-parser.ts"
Task: "T013 [US2] Use branchMetricsPresent for hide-branch logic in src/index.ts"
```

## Parallel Example: User Story 3

```bash
# After completing the US3 tests (T014–T015), implement these in parallel:
Task: "T016 [US3] Allow missing packages in src/coverage-parser.ts"
Task: "T017 [US3] Remove zero-packages failure guard in src/index.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **Stop and validate**: Run US1 tests only; confirm required root metric failures/successes

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → validate required root metrics (MVP)
3. User Story 2 → validate optional branch metrics and suppression behavior
4. User Story 3 → validate package row fallbacks and zero-package handling
5. Polish phase → run full parser/output test suite

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Keep fixtures minimal but representative of required/optional Cobertura attributes
