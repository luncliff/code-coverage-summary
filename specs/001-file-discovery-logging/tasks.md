---

description: "Task list for file discovery and diagnostic logging"
---

# Tasks: File discovery and diagnostic logging

**Input**: Design documents from `/specs/001-file-discovery-logging/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included because the specification calls for automated coverage of discovery, failure messaging, and deterministic logging.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shared fixtures and scaffolding for discovery tests.

- [ ] T001 Create discovery fixtures in __tests__/fixtures/file-discovery/coverage/unit.xml, __tests__/fixtures/file-discovery/coverage/integration.xml, and __tests__/fixtures/file-discovery/reports/coverage.xml

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared test harness used by all user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T002 [P] Add action test harness helpers in __tests__/helpers/action-test-harness.ts to stub @actions/core inputs/logs and capture info/setFailed output
- [ ] T003 [P] Update src/index.ts to export run() for tests and enable the action-test-harness usage without removing the existing run() invocation

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel.

---

## Phase 3: User Story 1 - Discover coverage files from patterns (Priority: P1) 🎯 MVP

**Goal**: Allow workflow authors to supply comma-separated glob patterns that resolve to coverage files in the workspace.

**Independent Test**: Run the action against the fixture workspace and verify the matched file list includes every pattern match, handles whitespace/empty entries, and resolves paths relative to the workspace.

### Tests for User Story 1

- [ ] T004 [P] [US1] Add discovery parsing tests in __tests__/file-discovery.test.ts covering comma-separated patterns, whitespace trimming, empty entries, and workspace-relative globbing using fixtures

### Implementation for User Story 1

- [ ] T005 [P] [US1] Create src/file-discovery.ts with parseCoveragePatterns to split, trim, and filter filename input entries
- [ ] T006 [US1] Implement discoverCoverageFiles in src/file-discovery.ts using @actions/glob.create with newline-joined patterns and returning globber.glob() results
- [ ] T007 [US1] Update src/index.ts to use discoverCoverageFiles for coverage file discovery in place of inline parsing logic

**Checkpoint**: User Story 1 should be fully functional and independently testable.

---

## Phase 4: User Story 2 - Fail fast when no files match (Priority: P2)

**Goal**: Fail with the compatibility-preserving error message when no files match any pattern.

**Independent Test**: Run the action with patterns that match nothing and assert the step fails with the exact error message.

### Tests for User Story 2

- [ ] T008 [P] [US2] Add no-match failure coverage in __tests__/file-discovery.test.ts asserting core.setFailed receives `Error: No files found matching glob pattern.`

### Implementation for User Story 2

- [ ] T009 [US2] Update src/index.ts to handle an empty discovery result by calling core.setFailed('Error: No files found matching glob pattern.') and returning early

**Checkpoint**: User Story 2 should be fully functional and independently testable.

---

## Phase 5: User Story 3 - See which files were used (diagnostic logging) (Priority: P3)

**Goal**: Log each matched coverage file exactly once and ensure the ordering is deterministic across runs.

**Independent Test**: Run the action twice against the same fixture workspace and confirm identical `Coverage File:` lines in the same order with no duplicates.

### Tests for User Story 3

- [ ] T010 [P] [US3] Add logging/determinism tests in __tests__/file-discovery.test.ts verifying `Coverage File:` output order, no duplicates when multiple patterns match the same file, and stable ordering across runs

### Implementation for User Story 3

- [ ] T011 [US3] Ensure src/index.ts logs each discovered file once in discovery order via core.info(`Coverage File: ${file}`), relying on @actions/glob deterministic ordering/deduping

**Checkpoint**: User Story 3 should be fully functional and independently testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation updates and cross-story validation.

- [ ] T012 [P] Update README-original.md to document comma-separated filename patterns, deterministic ordering, and `Coverage File:` logging behavior
- [ ] T013 [P] Refresh wording in specs/001-file-discovery-logging/quickstart.md to mirror the final logging/deterministic ordering behavior

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (staff permitting)
- **Polish (Phase 6)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Starts after Foundational; no dependencies on other stories
- **User Story 2 (P2)**: Starts after Foundational; can proceed independently of US1
- **User Story 3 (P3)**: Starts after Foundational; can proceed independently of US1/US2

### Within Each User Story

- Tests (if included) should be written and fail before implementation
- Shared helper modules before index.ts integration
- Core implementation before integration/logging verification

### Parallel Opportunities

- T002 and T003 can run in parallel (separate files)
- T004, T005, and T006 can run in parallel (separate files)
- T008 and T010 can run in parallel (tests in the same file should still be coordinated)
- T012 and T013 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Tests + helper module tasks that can run together:
Task: "Add discovery parsing tests in __tests__/file-discovery.test.ts"
Task: "Create src/file-discovery.ts with parseCoveragePatterns"
```

## Parallel Example: User Story 2

```bash
# Failure-message test can run alongside other story work once foundation is ready:
Task: "Add no-match failure coverage in __tests__/file-discovery.test.ts"
```

## Parallel Example: User Story 3

```bash
# Logging tests can run in parallel with documentation updates once implementation is ready:
Task: "Add logging/determinism tests in __tests__/file-discovery.test.ts"
Task: "Update README-original.md to document deterministic logging"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently against fixture files

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. User Story 1 → test independently → MVP ready
3. User Story 2 → test independently → add failure message support
4. User Story 3 → test independently → add diagnostic logging
5. Polish documentation updates

---

## Notes

- [P] tasks indicate parallelizable work in separate files.
- Each user story is independently testable and deliverable.
- Maintain action interface parity and exact error/log strings from the specification.
