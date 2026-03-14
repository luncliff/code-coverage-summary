# Tasks: Error Handling and Failure Messages

**Input**: Design documents from `/specs/005-error-handling/`
**Prerequisites**: plan.md, data-model.md, contracts/error-handling.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. This feature follows test-first development - all tests are written and verified to fail before implementation begins.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and test infrastructure setup

- [X] T001 Review existing test infrastructure in __tests__/ and verify Jest configuration in jest.config.js
- [X] T002 [P] Create test fixtures directory __tests__/fixtures/error-handling/ for error scenario test files
- [X] T003 [P] Create malformed XML fixture in __tests__/fixtures/error-handling/malformed.xml
- [X] T004 [P] Create missing attributes XML fixture in __tests__/fixtures/error-handling/missing-attributes.xml
- [X] T005 [P] Create valid coverage fixture in __tests__/fixtures/error-handling/valid-coverage.xml for success scenarios

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and dependencies that all error handling stories need

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T006 Review SI-D4 threshold parsing implementation to understand lower threshold extraction
- [X] T007 Review SI-D2 summary line rate calculation to understand how summaryLineRate is computed
- [X] T008 Verify @actions/core package version (1.11.1) and confirm setFailed() availability

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Input Validation (Priority: P1) 🎯 MVP

**Goal**: Provide immediate, actionable feedback when users configure the action with invalid format or output values, preventing wasted processing time and enabling self-service debugging.

**Independent Test**: Run action with `format: 'json'` and verify it fails immediately with "Error: Unknown output format." before processing any files. Run with `output: 'somewhere'` and verify "Error: Unknown output type." message.

### Tests for User Story 1 (Test-First Development) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T009 [P] [US1] Write test for valid format values ('text', 'md', 'markdown') in __tests__/input-validator.test.ts
- [X] T010 [P] [US1] Write test for invalid format value producing exact error "Error: Unknown output format." in __tests__/input-validator.test.ts
- [X] T011 [P] [US1] Write test for valid output values ('console', 'file', 'both') in __tests__/input-validator.test.ts
- [X] T012 [P] [US1] Write test for invalid output value producing exact error "Error: Unknown output type." in __tests__/input-validator.test.ts
- [X] T013 [US1] Run tests with `npm test -- __tests__/input-validator.test.ts` and verify all 4 tests FAIL (no implementation exists yet)

### Implementation for User Story 1

- [X] T014 [US1] Create src/input-validator.ts with validateFormat() function checking against ['text', 'md', 'markdown']
- [X] T015 [US1] Add validateOutput() function to src/input-validator.ts checking against ['console', 'file', 'both']
- [X] T016 [US1] Export validation functions with exact error messages from src/input-validator.ts
- [X] T017 [US1] Update src/index.ts to import validation functions after input retrieval
- [X] T018 [US1] Add format validation call in src/index.ts immediately after getInput('format')
- [X] T019 [US1] Add output validation call in src/index.ts immediately after getInput('output')
- [X] T020 [US1] Add core.setFailed() calls for validation failures in src/index.ts with exact error messages
- [X] T021 [US1] Run validation tests with `npm test -- __tests__/input-validator.test.ts` and verify all tests PASS
- [X] T022 [US1] Fix any failing tests by adjusting exact error message text or validation logic
- [X] T023 [US1] Test manual workflow with invalid format value and verify immediate failure (before file processing)

**Checkpoint**: User Story 1 complete - input validation works independently, fails fast with exact error messages

---

## Phase 4: User Story 2 - Parsing Error Reporting (Priority: P1) 🎯 MVP

**Goal**: When coverage file parsing fails, developers immediately know which specific file is problematic and what went wrong, enabling quick fixes without consulting documentation.

**Independent Test**: Create malformed coverage XML, run action, verify it logs "Parsing Error: [message] - [filename]" with the exact filename that failed. Test with multiple files and verify fail-fast behavior (stops at first error).

### Tests for User Story 2 (Test-First Development) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T024 [P] [US2] Write test for parsing malformed XML producing "Parsing Error:" format in __tests__/parsing-errors.test.ts
- [X] T025 [P] [US2] Write test for parsing error message includes exact filename in __tests__/parsing-errors.test.ts
- [X] T026 [P] [US2] Write test for missing required attribute error message in __tests__/parsing-errors.test.ts
- [X] T027 [US2] Write test for multi-file parsing with fail-fast behavior in __tests__/parsing-errors.test.ts
- [X] T028 [US2] Write test verifying filename matches "Coverage File:" logged path in __tests__/parsing-errors.test.ts
- [X] T029 [US2] Run tests with `npm test -- __tests__/parsing-errors.test.ts` and verify all 5 tests FAIL

### Implementation for User Story 2

- [X] T030 [US2] Update src/coverage-parser.ts to wrap parseFile() logic in try/catch block
- [X] T031 [US2] Add error message construction in catch block: "Parsing Error: ${descriptiveMessage} - ${filename}"
- [X] T032 [US2] Extract descriptive message from underlying parser error in src/coverage-parser.ts
- [X] T033 [US2] Ensure filename variable matches the path logged in "Coverage File:" output
- [X] T034 [US2] Add core.setFailed() call with formatted parsing error message in catch block
- [X] T035 [US2] Implement fail-fast behavior: return/exit immediately on parsing error (don't continue to next file)
- [X] T036 [US2] Run parsing error tests with `npm test -- __tests__/parsing-errors.test.ts` and verify all tests PASS
- [X] T037 [US2] Fix any failing tests by adjusting error message format or filename extraction
- [X] T038 [US2] Test with malformed.xml fixture and verify exact error format in console output
- [X] T039 [US2] Test multi-file scenario (valid.xml, malformed.xml, another-valid.xml) and verify processing stops at malformed.xml

**Checkpoint**: User Story 2 complete - parsing errors include filenames, fail-fast works, error messages are exact

---

## Phase 5: User Story 3 - Threshold Enforcement (Priority: P2)

**Goal**: Enable quality gates by enforcing minimum coverage thresholds, failing builds when coverage drops below acceptable levels while still showing the coverage report.

**Independent Test**: Run action with `fail_below_min: 'true'` and `thresholds: '60 80'` on a coverage file with 45% line rate. Verify report includes "_Minimum allowed line rate is 60%_" (markdown) and step fails with "FAIL: Overall line rate below minimum threshold of 60%.". Test with 60% coverage and verify it PASSES (boundary case).

### Tests for User Story 3 (Test-First Development) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T040 [P] [US3] Write test for threshold annotation in text format in __tests__/threshold-enforcement.test.ts
- [X] T041 [P] [US3] Write test for threshold annotation in markdown format (italic) in __tests__/threshold-enforcement.test.ts
- [X] T042 [P] [US3] Write test for annotation appears when enforcement enabled in __tests__/threshold-enforcement.test.ts
- [X] T043 [P] [US3] Write test for no annotation when enforcement disabled in __tests__/threshold-enforcement.test.ts
- [X] T044 [P] [US3] Write test for threshold violation (coverage < threshold) produces exact failure message in __tests__/threshold-enforcement.test.ts
- [X] T045 [P] [US3] Write test for threshold pass (coverage >= threshold) with no failure in __tests__/threshold-enforcement.test.ts
- [X] T046 [P] [US3] Write test for boundary case (coverage exactly equals threshold) PASSES in __tests__/threshold-enforcement.test.ts
- [X] T047 [US3] Run tests with `npm test -- __tests__/threshold-enforcement.test.ts` and verify all 7 tests FAIL

### Implementation for User Story 3

- [X] T048 [US3] Create src/threshold-enforcer.ts with isEnforcementEnabled() function checking fail_below_min === "true" (case-insensitive)
- [X] T049 [US3] Add generateAnnotation() function to src/threshold-enforcer.ts with format-specific text
- [X] T050 [US3] Implement text format annotation: "Minimum allowed line rate is ${lowerThreshold}%"
- [X] T051 [US3] Implement markdown format annotation: "_Minimum allowed line rate is ${lowerThreshold}%_"
- [X] T052 [US3] Add checkThresholdViolation() function comparing summaryLineRate < lowerThreshold
- [X] T053 [US3] Export all threshold enforcement functions from src/threshold-enforcer.ts
- [X] T054 [US3] Update src/output-generator.ts to import threshold enforcement functions
- [X] T055 [US3] Add annotation injection logic in src/output-generator.ts when enforcement enabled
- [X] T056 [US3] Ensure annotation is added before report string is returned from generator
- [X] T057 [US3] Update src/index.ts to perform threshold check after report generation
- [X] T058 [US3] Add core.setFailed() call for threshold violations with exact message format
- [X] T059 [US3] Ensure threshold check happens after report output (not before)
- [X] T060 [US3] Run threshold tests with `npm test -- __tests__/threshold-enforcement.test.ts` and verify all tests PASS
- [X] T061 [US3] Fix any failing tests by adjusting annotation format or comparison logic
- [X] T062 [US3] Test with coverage at 45% and threshold 60% - verify failure with exact message
- [X] T063 [US3] Test boundary case: coverage at 60% and threshold 60% - verify it PASSES (no false positive)
- [X] T064 [US3] Test with enforcement disabled (fail_below_min: 'false') - verify no annotation and no failure

**Checkpoint**: User Story 3 complete - threshold enforcement works with annotations, boundary cases handled correctly

---

## Phase 6: Integration & Error Priority Testing

**Goal**: Verify error handling works correctly across all scenarios and errors are reported in the correct priority order

- [X] T065 [P] Write integration test for input validation before parsing in __tests__/error-priority.test.ts
- [X] T066 [P] Write integration test for parsing error before threshold check in __tests__/error-priority.test.ts
- [X] T067 [P] Write integration test for threshold check after successful parsing in __tests__/error-priority.test.ts
- [X] T068 Write test for both invalid format and output (format error takes precedence) in __tests__/error-priority.test.ts
- [X] T069 Run integration tests with `npm test -- __tests__/error-priority.test.ts` and verify all pass
- [X] T070 Test complete workflow: invalid input → immediate failure (no files processed)
- [X] T071 Test complete workflow: valid input, parsing error → failure with filename
- [X] T072 Test complete workflow: valid input, valid parsing, threshold violation → annotated report + failure
- [X] T073 Test complete workflow: valid input, valid parsing, no enforcement → success
- [X] T074 Fix any integration issues discovered during end-to-end testing

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, validation, and final quality checks

- [X] T075 [P] Update README.md error handling section with error message examples
- [X] T076 [P] Add troubleshooting guide section documenting each error type and resolution
- [X] T077 [P] Verify all error messages exactly match legacy text from specification
- [X] T078 Run complete test suite with `npm test` and verify all tests pass
- [X] T079 Build action with `npm run build` and verify dist/ is updated
- [X] T080 Test all 7 quickstart.md workflow examples manually
- [X] T081 Verify Example 1 (invalid format) produces exact error message
- [X] T082 Verify Example 2 (invalid output) produces exact error message
- [X] T083 Verify Example 3 (parsing error) includes filename
- [X] T084 Verify Example 4 (threshold failure) shows annotation and failure message
- [X] T085 Verify Example 5 (threshold pass) shows annotation but succeeds
- [X] T086 Verify Example 6 (no enforcement) shows no annotation
- [X] T087 Verify Example 7 (multi-file error) shows fail-fast behavior
- [X] T088 [P] Run action on Linux runner and verify cross-platform compatibility
- [X] T089 [P] Run action on Windows runner and verify error messages are consistent
- [X] T090 [P] Run action on macOS runner and verify error messages are consistent
- [X] T091 Verify action interface parity: error messages match baseline expectations
- [X] T092 Run static analysis and address any new issues flagged
- [X] T093 Verify constitution compliance: no security issues, no sensitive data in errors
- [X] T094 Final validation: all quickstart scenarios work as documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
  - Creates test fixtures needed for all testing phases
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
  - Reviews existing implementations (SI-D4, SI-D2) that error handling depends on
- **User Story 1 (Phase 3)**: Depends on Foundational completion
  - Independent of other user stories
  - Can start as soon as Phase 2 completes
- **User Story 2 (Phase 4)**: Depends on Foundational completion
  - Independent of User Story 1
  - Can run in parallel with US1 if staffed
- **User Story 3 (Phase 5)**: Depends on Foundational completion
  - Independent of US1 and US2
  - Can run in parallel with US1/US2 if staffed
- **Integration Testing (Phase 6)**: Depends on US1, US2, US3 completion
  - Tests error priority order across all stories
- **Polish (Phase 7)**: Depends on all user stories and integration testing completion

### User Story Dependencies

- **User Story 1 (Input Validation - P1)**: 
  - Can start after Foundational (Phase 2)
  - No dependencies on other stories
  - Blocks: Integration testing (needs validation to test error priority)

- **User Story 2 (Parsing Errors - P1)**:
  - Can start after Foundational (Phase 2)
  - No dependencies on other stories
  - Blocks: Integration testing (needs parsing errors to test error priority)

- **User Story 3 (Threshold Enforcement - P2)**:
  - Can start after Foundational (Phase 2)
  - No dependencies on other stories (uses existing SI-D4 and SI-D2)
  - Blocks: Integration testing (needs threshold logic to test error priority)

### Within Each User Story

- Tests MUST be written first and verified to FAIL before implementation
- Run tests to confirm failures: `npm test -- __tests__/[test-file].test.ts`
- Implement functionality to make tests pass
- Re-run tests to confirm they now PASS
- Fix any failing tests by adjusting implementation
- Manual validation with fixtures to confirm end-to-end behavior

### Parallel Opportunities

**Setup Phase (Phase 1)**:
- T003, T004, T005 can all run in parallel (creating different fixtures)

**User Story 1 Tests**:
- T009, T010, T011, T012 can run in parallel (different test files/functions)

**User Story 1 Implementation**:
- T014, T015 can run in parallel if working in different functions (but same file)
- T018, T019 sequential (both modify src/index.ts)

**User Story 2 Tests**:
- T024, T025, T026, T027, T028 can run in parallel (different test cases)

**User Story 3 Tests**:
- T040-T046 can all run in parallel (different test cases)

**User Story 3 Implementation**:
- T048-T053 can be parallelized (all in src/threshold-enforcer.ts but different functions)
- T050, T051 can run in parallel (different format branches)

**Integration Testing**:
- T065, T066, T067 can run in parallel (different test scenarios)

**Polish Phase**:
- T075, T076, T077 can run in parallel (different documentation files)
- T088, T089, T090 can run in parallel (different OS runners)

**Cross-Story Parallelization**:
- Once Phase 2 completes, ALL THREE user stories (US1, US2, US3) can be developed in parallel by different team members:
  - Developer A: Phase 3 (US1 - Input Validation)
  - Developer B: Phase 4 (US2 - Parsing Errors)
  - Developer C: Phase 5 (US3 - Threshold Enforcement)
- Each story is independently testable and doesn't conflict with others

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Write test for valid format values in __tests__/input-validator.test.ts"
Task: "Write test for invalid format value in __tests__/input-validator.test.ts"
Task: "Write test for valid output values in __tests__/input-validator.test.ts"
Task: "Write test for invalid output value in __tests__/input-validator.test.ts"

# Then implement validation functions (sequential since same file):
Task: "Create src/input-validator.ts with validateFormat()"
Task: "Add validateOutput() function to src/input-validator.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

This feature has TWO P1 stories that together form the MVP:

1. Complete Phase 1: Setup (test fixtures)
2. Complete Phase 2: Foundational (review dependencies)
3. Complete Phase 3: User Story 1 (input validation)
4. Complete Phase 4: User Story 2 (parsing errors)
5. **STOP and VALIDATE**: Test US1 and US2 independently with fixtures
6. Deploy/demo if ready (covers FR-20, FR-21, FR-22 - most critical error handling)

**Why both US1 and US2 are P1**: Input validation and parsing errors are the most common failure scenarios. Together they provide essential error handling that prevents most user confusion.

### Full Feature Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 (Input Validation) → Test independently with invalid inputs
3. Add User Story 2 (Parsing Errors) → Test independently with malformed XML
4. **MVP CHECKPOINT** ✅ - Most critical errors now handled
5. Add User Story 3 (Threshold Enforcement) → Test independently with threshold scenarios
6. Complete Integration Testing → Verify error priority and interactions
7. Complete Polish → Documentation, cross-platform validation
8. **FEATURE COMPLETE** ✅

### Test-First Development Workflow

For each user story:

1. **Write tests FIRST** (marked with ⚠️ in tasks)
2. **Run tests** and verify they FAIL (no implementation exists)
3. **Implement functionality** to make tests pass
4. **Run tests again** and verify they PASS
5. **Fix any failures** by adjusting implementation
6. **Manual validation** with fixtures to confirm behavior
7. **Checkpoint**: Story complete and independently testable

This ensures:
- Tests drive implementation (not the other way around)
- All functionality is tested before shipping
- Exact error messages are verified (critical for legacy compatibility)
- Boundary cases are covered (e.g., threshold equality)

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Input Validation)
   - Developer B: User Story 2 (Parsing Errors)
   - Developer C: User Story 3 (Threshold Enforcement)
3. Stories complete independently without conflicts
4. Team reconvenes for Integration Testing (Phase 6)
5. Team completes Polish together (Phase 7)

**Why this works**: Each story touches different files and has no implementation dependencies on other stories.

---

## Notes

- **Test-First is MANDATORY**: All tests written before implementation, verified to fail first
- **Exact messages required**: All error messages MUST match legacy text exactly (compatibility requirement)
- **Error priority matters**: Input validation → Parsing → Threshold enforcement (strict order)
- **Boundary cases critical**: Threshold equality (60% == 60%) must PASS (not fail)
- **Fail-fast behavior**: First error stops processing (especially for parsing)
- **Format-specific rendering**: Threshold annotation differs between text and markdown
- **Cross-platform testing**: Error messages must be identical on Linux/Windows/macOS
- [P] tasks = different files or independent test cases, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
