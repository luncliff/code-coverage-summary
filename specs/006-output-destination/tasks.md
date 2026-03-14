# Tasks: Output Destination (006)

**Input**: Design documents from `/specs/006-output-destination/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included (required by spec success criteria SC-004 and plan quality gates)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Align on existing behavior and prepare focused tests for output routing.

- [ ] T001 Review existing output routing and filenames in src/index.ts
- [ ] T002 [P] Review output validation error message in src/input-validator.ts
- [ ] T003 [P] Review existing input parsing defaults for `output` and `format` in src/index.ts
- [ ] T004 [P] Create test scaffolding for output routing in __tests__/output-destination.test.ts
- [ ] T005 [P] Confirm existing validation tests cover unknown output type message in __tests__/input-validator.test.ts

**Checkpoint**: Understanding of current behavior + test file scaffold exists.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Make output destination behavior independently testable without requiring XML parsing/globbing.

- [x] T006 Create a focused output routing helper in src/output-destination.ts
- [x] T007 Update src/index.ts to call the helper for `console|file|both` routing
- [x] T008 [P] Add unit tests for the helper's file naming logic in __tests__/output-destination.test.ts

**Checkpoint**: Output routing is encapsulated and unit-testable.

---

## Phase 3: User Story 1 - View the report in logs (Priority: P1) 🎯 MVP

**Goal**: When `output=console`, write the full report to the action log and do not create/modify any output file.

**Independent Test**: Run the routing helper tests to confirm `console` emits only to log and never writes a file.

### Tests for User Story 1

- [x] T009 [P] [US1] Add test: `output=console` does not call `fs.writeFileSync` in __tests__/output-destination.test.ts
- [x] T010 [P] [US1] Add test: `output=console` emits the report content to `core.info` in __tests__/output-destination.test.ts
- [x] T011 [P] [US1] Add test: `output=console` does not modify an existing report file in __tests__/output-destination.test.ts

### Implementation for User Story 1

- [x] T012 [US1] Implement/adjust `console` routing semantics in src/output-destination.ts (if needed)

**Checkpoint**: US1 behavior is fully covered by unit tests and passes.

---

## Phase 4: User Story 2 - Save the report to a file (Priority: P2)

**Goal**: When `output=file`, write the report to the correct legacy filename in the workspace root and do not print the report to the log.

**Independent Test**: Run routing helper tests to confirm file output uses the correct filename and avoids emitting report content.

### Tests for User Story 2

- [x] T013 [P] [US2] Add test: `output=file` writes `code-coverage-results.txt` when `format=text` in __tests__/output-destination.test.ts
- [x] T014 [P] [US2] Add test: `output=file` writes `code-coverage-results.md` when `format=markdown` in __tests__/output-destination.test.ts
- [x] T015 [P] [US2] Add test: `output=file` does not emit report content to `core.info` in __tests__/output-destination.test.ts
- [x] T016 [P] [US2] Add test: file contents exactly equal the provided report string in __tests__/output-destination.test.ts
- [x] T017 [P] [US2] Add test: file write failure triggers `core.setFailed` in __tests__/output-destination.test.ts
- [x] T018 [P] [US2] Add test: file output content equals console output content for the same report string in __tests__/output-destination.test.ts

### Implementation for User Story 2

- [x] T019 [US2] Implement/adjust `file` routing semantics and error handling in src/output-destination.ts

**Checkpoint**: US2 file output and error paths are covered and pass.

---

## Phase 5: User Story 3 - Write the report to both places (Priority: P3)

**Goal**: When `output=both`, write the report to both the action log and the correct legacy filename.

**Independent Test**: Run routing helper tests to confirm both logging and file writing occur in a single invocation.

### Tests for User Story 3

- [x] T020 [P] [US3] Add test: `output=both` emits report content to `core.info` in __tests__/output-destination.test.ts
- [x] T021 [P] [US3] Add test: `output=both` writes the correct legacy filename for `text|markdown` in __tests__/output-destination.test.ts

### Implementation for User Story 3

- [x] T022 [US3] Implement/adjust `both` routing semantics in src/output-destination.ts (if needed)

**Checkpoint**: US3 behavior passes and remains independent of parsing/discovery.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Keep the repo consistent and ensure the tasks fully support the plan’s quality gates.

- [x] T023 [P] Align quickstart examples with final behavior in specs/006-output-destination/quickstart.md
- [x] T024 [P] Ensure contract stays accurate (filenames + report-vs-diagnostic logging note) in specs/006-output-destination/contracts/action-output-destination.md
- [x] T025 Run unit tests and confirm green: update expectations if needed in __tests__/output-destination.test.ts
- [x] T026 Run `npm run build` and ensure `dist/index.js` output remains correct (entry still `src/index.ts`)


---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies
- **Foundational (Phase 2)**: Depends on Setup
- **User Stories (Phase 3–5)**: Depend on Foundational (Phase 2)
- **Polish (Phase 6)**: Depends on completing desired user stories

### User Story Dependencies

- **US1 (P1)**: Depends on Phase 2 only
- **US2 (P2)**: Depends on Phase 2 only
- **US3 (P3)**: Depends on Phase 2 and benefits from US1/US2 patterns, but should remain independently testable

### Parallel Opportunities

- All test-writing tasks marked [P] can run in parallel once the helper contract is decided.
- Documentation alignment tasks in Phase 6 marked [P] can run in parallel.

---

## Parallel Example: User Story 2

```bash
Task: "Add test: output=file writes code-coverage-results.txt when format=text in __tests__/output-destination.test.ts"
Task: "Add test: output=file writes code-coverage-results.md when format=markdown in __tests__/output-destination.test.ts"
Task: "Add test: output=file does not emit report content to core.info in __tests__/output-destination.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1–2
2. Complete Phase 3 (US1)
3. Validate via unit tests that `console` mode prints report and never writes files

### Incremental Delivery

1. Add US1 coverage
2. Add US2 coverage
3. Add US3 coverage
4. Finish with Phase 6 cleanup/verification
