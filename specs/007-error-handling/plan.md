# Implementation Plan: Error Handling and Failure Messages

**Branch**: `007-error-handling` | **Date**: 2025-03-14 | **Spec**: `/specs/007-error-handling/spec.md`  
**Input**: Feature specification from `/specs/007-error-handling/spec.md`

## Summary

Implement comprehensive error handling for the code coverage action, including input validation for `format` and `output` values, parsing error reporting with filenames, and threshold enforcement with quality gate failures. All error messages match exact legacy implementation text to preserve compatibility. Uses `@actions/core.setFailed()` for all failure scenarios following official GitHub Actions patterns.

## Technical Context

**Language/Version**: TypeScript 5.9 targeting Node.js 20  
**Primary Dependencies**: @actions/core 1.11.1, @actions/glob 0.5.0, fast-xml-parser 5.4.2  
**Storage**: N/A (filesystem only)  
**Testing**: Jest + ts-jest  
**Target Platform**: GitHub Actions runners (Linux/Windows/macOS) using node20  
**Project Type**: GitHub Action (Node.js runtime)  
**Performance Goals**: Error detection must be immediate (input validation <1ms, fail-fast on parse errors)  
**Constraints**: Exact legacy error message compatibility, deterministic behavior, cross-platform error handling  
**Scale/Scope**: Handles single or multiple coverage files per run, typical workflows with 1-100 coverage files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Reference: `.specify/memory/constitution.md`

- **Action interface parity preserved**: ✅ Pass - Error messages match exact legacy text (FR-20, FR-21, FR-22), preserving observable behavior
- **Cross-platform support confirmed**: ✅ Pass - Pure validation and error reporting logic, no platform-specific dependencies
- **Upstream artifacts preserved**: ✅ Pass - No deletions required; additive behavior for Node.js implementation
- **Security posture maintained**: ✅ Pass - Error messages don't leak sensitive data; parsing errors don't expose file contents; threshold values are user-configured
- **Quality gates defined**: ✅ Pass - Tests planned for exact error message matching, all error scenarios covered

**No constitution violations to record.**

## Project Structure

### Documentation (this feature)

```text
specs/007-error-handling/
├── plan.md              # This file
├── research.md          # Phase 0 output - COMPLETED
├── data-model.md        # Phase 1 output - COMPLETED
├── quickstart.md        # Phase 1 output - COMPLETED
├── contracts/           # Phase 1 output - COMPLETED
│   └── error-handling.md
└── tasks.md             # Phase 2 output (created by /speckit.tasks - NOT created by this command)
```

### Source Code (repository root)

```text
src/
├── index.ts                 # Main entry point - add input validation
├── input-validator.ts       # NEW: Input validation logic
├── coverage-parser.ts       # MODIFY: Add parsing error handling
├── output-generator.ts      # MODIFY: Add threshold annotation logic
├── threshold-enforcer.ts    # NEW: Threshold enforcement logic
└── CodeCoverageSummary/     # legacy upstream artifacts (unchanged)

__tests__/
├── input-validator.test.ts           # NEW: Input validation tests
├── parsing-errors.test.ts            # NEW: Parsing error tests
├── threshold-enforcement.test.ts     # NEW: Threshold enforcement tests
└── fixtures/
    ├── malformed.xml                 # NEW: Test fixture for parsing errors
    ├── missing-attributes.xml        # NEW: Test fixture for parsing errors
    └── valid-coverage.xml            # Existing or new

dist/                        # Compiled output (generated)
action.yml                   # Action metadata (unchanged)
```

**Structure Decision**: Single TypeScript action with modular error handling components. New files for validation and enforcement keep concerns separated. Legacy artifacts remain untouched.

## Complexity Tracking

No constitution violations to record.

## Phase 0: Research Summary

**Status**: ✅ COMPLETED

Research documented in `/specs/007-error-handling/research.md` covering:

- **Error handling best practices in TypeScript/Node.js**: Custom error classes, validation patterns, graceful degradation, type guards, and error message clarity
- **GitHub Actions error reporting**: `@actions/core.setFailed()`, `core.error()`, `core.warning()`, workflow commands, and failure mechanisms
- **Testing error scenarios in Jest**: `toThrow()` matcher for sync errors, `rejects.toThrow()` for async errors, exact message matching, custom error types
- **Input validation patterns**: Type guards vs schema validation libraries (Zod/Yup), decision to use simple type guards for our use case

**Key Decisions Made**:
1. Use simple type guards instead of Zod/Yup (validation is trivial: 2-3 string checks)
2. Use `core.setFailed()` consistently for all failures (official GitHub Actions pattern)
3. Validate inputs before processing (fail-fast per FR-G21)
4. Include filename in parsing errors via structured error construction
5. Test with Jest's `toThrow` for exact message matching
6. Add threshold annotation during report generation, check violations after

## Phase 1: Design & Contracts Summary

**Status**: ✅ COMPLETED

Design artifacts completed in `/specs/007-error-handling/`:

### Data Model (`data-model.md`)

Defined error handling entities:
- **InputValidationError**: Represents invalid format/output values with exact error messages
- **ParsingError**: Represents parsing failures with filename and descriptive message
- **ThresholdEnforcementConfig**: Configuration for quality gate enforcement
- **ThresholdViolation**: Represents threshold enforcement failures
- **ReportAnnotation**: Threshold annotation added to reports

Validation flow documented with clear error priority order (input validation → parsing → threshold enforcement).

### Contract (`contracts/error-handling.md`)

Documented precise contracts for:
- **Input validation**: Exact valid values, error messages, and failure behavior for `format` and `output`
- **Parsing errors**: Message format `"Parsing Error: [message] - [filename]"`, fail-fast behavior, multi-file handling
- **Threshold enforcement**: Annotation format (text vs markdown), violation check logic, boundary cases
- **Error priority**: Execution order ensuring input validation before processing, threshold checks after report generation

### Quickstart (`quickstart.md`)

Provided 7 comprehensive workflow examples demonstrating:
- Invalid format input
- Invalid output type
- Parsing errors with malformed XML
- Threshold enforcement (failing and passing scenarios)
- Threshold annotation without enforcement
- Multi-file scenarios with parsing errors

Includes debugging tips, validation checklist, and error detection quick reference table.

## Post-Design Constitution Check

- **Action interface parity preserved**: ✅ Pass - All error messages verified against legacy text
- **Cross-platform, Node-only runtime maintained**: ✅ Pass - Pure TypeScript validation/error logic
- **Upstream artifacts preserved**: ✅ Pass - No changes to legacy artifacts
- **Security posture maintained**: ✅ Pass - Error messages sanitized, no sensitive data exposure
- **Quality gates defined**: ✅ Pass - Comprehensive test strategy documented

**No violations identified.**

## Phase 2: Planning Notes

### Implementation Tasks (High-Level)

1. **Create input validation module** (`src/input-validator.ts`)
   - Validate `format` against `['text', 'md', 'markdown']`
   - Validate `output` against `['console', 'file', 'both']`
   - Return exact error messages matching legacy text
   - Export validation functions for use in main flow

2. **Update main entry point** (`src/index.ts`)
   - Call input validators immediately after retrieving inputs
   - If validation fails, call `core.setFailed()` with exact error message and exit
   - Ensure validation runs before any file discovery or parsing

3. **Update coverage parser** (`src/coverage-parser.ts`)
   - Wrap parsing logic in try/catch blocks
   - On parse error, construct message as `"Parsing Error: ${descriptiveMessage} - ${filename}"`
   - Ensure filename matches the path logged in "Coverage File:" lines
   - Call `core.setFailed()` with formatted error message
   - Implement fail-fast: stop processing on first parse error

4. **Create threshold enforcement module** (`src/threshold-enforcer.ts`)
   - Check if `fail_below_min` equals "true" (case-insensitive)
   - Retrieve lower threshold from parsed thresholds (SI-D4 dependency)
   - Generate annotation text based on format type
   - Export functions for annotation generation and violation checking

5. **Update output generator** (`src/output-generator.ts`)
   - When threshold enforcement is enabled, inject annotation line into report
   - Use plain text format for text reports: `"Minimum allowed line rate is ${lower}%"`
   - Use markdown format for markdown reports: `"_Minimum allowed line rate is ${lower}%_"`
   - Add annotation regardless of whether coverage passes threshold

6. **Add threshold violation check** (in main flow after report generation)
   - Compare `summaryLineRate < lowerThreshold`
   - If true and enforcement enabled, call `core.setFailed()` with exact message
   - Message: `"FAIL: Overall line rate below minimum threshold of ${lower}%."`
   - Ensure check happens after report output

7. **Create comprehensive test suites**
   - `__tests__/input-validator.test.ts`: Test all valid/invalid input combinations
   - `__tests__/parsing-errors.test.ts`: Test parsing error message format and filename inclusion
   - `__tests__/threshold-enforcement.test.ts`: Test annotation generation and violation checking
   - Create test fixtures for malformed XML, missing attributes, valid coverage files
   - Test boundary cases (coverage exactly equal to threshold)
   - Test error priority order

8. **Update documentation**
   - Add error handling section to README (if applicable)
   - Document error messages in action documentation
   - Update troubleshooting guide with error scenarios

### Comment Step: Web Search References and Usage in Implementation

The following references from web search results will be used during implementation:

#### Error Handling Best Practices (TypeScript/Node.js)

**Reference**: 
- Error Handling in Node.js: Patterns and Practices: https://dev.to/wallacefreitas/error-handling-in-nodejs-patterns-and-practices-1mg0
- Advanced Error Handling in TypeScript: https://blog.overctrl.com/advanced-error-handling-in-typescript-best-practices-and-common-pitfalls/

**Usage**:
- Guide implementation of type guards for input validation (simple boolean returns)
- Inform error message construction patterns (clear, actionable, context-rich)
- Ensure we're following best practices for not swallowing errors
- Validate our decision to use simple validation vs custom error classes (we chose simple for this use case)
- Reference for try/catch patterns in parsing error handling

#### GitHub Actions Error Reporting

**Reference**:
- Setting exit codes for actions - GitHub Docs: https://docs.github.com/en/actions/how-tos/create-and-publish-actions/set-exit-codes
- @actions/core npm documentation: https://www.npmjs.com/package/@actions/core
- Workflow commands for GitHub Actions: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands

**Usage**:
- Reference for correct `core.setFailed()` usage in all failure scenarios
- Confirm that setFailed sets exit code 1 and logs with `::error::`
- Validate that we don't need additional `core.error()` calls (setFailed does both)
- Ensure we're using official mechanisms per NFR-4 requirement
- Reference for alternatives (workflow commands) if needed for future debugging

#### Jest Testing Patterns

**Reference**:
- Testing exceptions in Jest: https://bobbyhadz.com/blog/jest-test-exception
- How to test the type of a thrown exception in Jest: https://stackoverflow.com/questions/46042613/how-to-test-the-type-of-a-thrown-exception-in-jest
- Testing errors with Jest: https://dev.to/danywalls/testing-errors-with-jest-hkj

**Usage**:
- Guide test implementation for synchronous validation errors: `expect(() => validate(input)).toThrow('exact message')`
- Guide async parsing error tests: `await expect(parse(file)).rejects.toThrow(expect.stringContaining('Parsing Error:'))`
- Ensure we wrap function calls in arrow functions for toThrow matcher (common mistake)
- Reference for testing exact error messages (critical for legacy compatibility)
- Inform test structure for error message format validation

#### Input Validation Patterns

**Reference**:
- Type Guards vs Schema Validation: https://stevekinney.com/courses/full-stack-typescript/type-guards-vs-schema-validation
- Yup vs Zod comparison: https://betterstack.com/community/guides/scaling-nodejs/yup-vs-zod/

**Usage**:
- Validate our decision to use simple type guards vs Zod/Yup (our validation is 2-3 string checks)
- Reference for type guard implementation patterns if we need to expand validation
- Inform future decisions if validation becomes more complex (when to graduate to schema libraries)
- Document rationale for not using validation libraries in code comments

### Dependencies and Integration Points

**Depends on**:
- SI-D4 (Threshold parsing): Must be implemented to provide lower threshold value
- SI-D2 (Multi-file aggregation): Threshold comparison uses summary line rate
- SI-F1/F2/F3 (Output destination): Reports must be generated before threshold annotation

**Provides**:
- Input validation errors for invalid format/output
- Parsing error reporting with filenames
- Threshold enforcement with quality gates
- Exact legacy error message compatibility

### Testing Strategy

**Unit Tests**:
- Input validation functions (all valid/invalid combinations)
- Error message formatting functions
- Threshold annotation generation (text vs markdown)
- Threshold comparison logic (boundary cases)

**Integration Tests**:
- Complete flow: invalid input → immediate failure
- Complete flow: parsing error → failure with filename
- Complete flow: threshold violation → annotated report + failure
- Multi-file parsing with one failure (fail-fast behavior)

**Test Fixtures**:
- `malformed.xml`: Invalid XML structure
- `missing-attributes.xml`: Missing required `line-rate` attribute
- `valid-coverage.xml`: Valid coverage file for success scenarios
- Coverage files with various line rates for threshold testing

**Exact Message Testing**:
- All error messages tested with exact string matching
- Legacy compatibility validated against specification-items.md
- No flexibility in error text (breaking change if modified)

### Rollout Considerations

- All error messages are backward compatible (exact legacy text)
- No new inputs introduced (uses existing `format`, `output`, `fail_below_min`, `thresholds`)
- Error handling is defensive: preserves action interface parity
- Deterministic: same inputs always produce same errors (NFR-6)

### Success Metrics (from spec)

- 100% of invalid format/output values receive exact error messages
- 100% of parsing errors include filename in message
- All threshold violations (when enabled) produce exact failure message
- Zero false positives on threshold enforcement (equality = pass)
- Developers can resolve errors without consulting documentation

## Verification Plan

Before marking feature complete:

1. ✅ All unit tests passing (100% coverage of error scenarios)
2. ✅ Integration tests validate complete error flows
3. ✅ Manual testing with workflow examples from quickstart.md
4. ✅ Error messages verified against exact legacy text
5. ✅ Cross-platform testing (Linux/Windows/macOS)
6. ✅ Constitution compliance verified (no violations)
7. ✅ Documentation updated (README, troubleshooting guide)
8. ✅ Static analysis passes (SonarCloud quality gates)

## Notes

- This feature is foundational for user experience: clear error messages prevent support burden
- Error message text is part of the public interface: changes require major version bump
- Threshold enforcement enables quality gates for CI/CD pipelines
- All error scenarios are testable and deterministic
- Implementation preserves fail-fast behavior: errors stop processing immediately
