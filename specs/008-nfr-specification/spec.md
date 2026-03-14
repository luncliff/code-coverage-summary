# Feature Specification: Non-Functional Requirements Compliance

## Overview

This specification defines the non-functional requirements (NFRs) for the Code Coverage Summary GitHub Action, ensuring cross-platform compatibility, security, reliability, and maintainability.

## User Stories

### US-1: Cross-Platform Workflow Execution
**As a** workflow author  
**I want** the action to run on Linux, Windows, and macOS runners without modification  
**So that** I can use the same workflow configuration across different environments

**Acceptance Criteria:**
- Action runs successfully on ubuntu-latest, windows-latest, and macos-latest
- No platform-specific workarounds or conditional logic required in workflow files
- Identical output format across all platforms
- No Docker or .NET runtime dependencies required

### US-2: Secure Input Handling
**As a** security-conscious user  
**I want** all inputs and coverage files to be treated as untrusted  
**So that** malicious input cannot compromise my workflow or leak secrets

**Acceptance Criteria:**
- XML parsing does not execute external entities (XXE prevention)
- Parser does not resolve external content
- Error messages do not leak sensitive environment data
- No secrets are logged in any scenario

### US-3: Deterministic Execution
**As a** CI/CD engineer  
**I want** the action to produce identical output for the same inputs  
**So that** my builds are reproducible and reliable

**Acceptance Criteria:**
- Output content is identical across multiple runs with same inputs
- Output ordering is deterministic
- No timestamps or random values in output
- No locale-dependent formatting

### US-4: Integrated GitHub Actions Logging
**As a** workflow debugger  
**I want** proper logging using GitHub Actions mechanisms  
**So that** I can troubleshoot issues efficiently

**Acceptance Criteria:**
- Uses @actions/core logging methods (info, debug, warning, error)
- Debug logs appear when ACTIONS_STEP_DEBUG=true
- Errors use core.setFailed() to mark step as failed
- Log grouping for multi-step operations

### US-5: Comprehensive Test Coverage
**As a** maintainer  
**I want** comprehensive automated tests  
**So that** I can confidently make changes without breaking functionality

**Acceptance Criteria:**
- Test coverage ≥80% for all source files
- Tests cover edge cases and error conditions
- Tests use representative coverage fixtures
- Tests run on all supported platforms

### US-6: Legacy Artifact Preservation
**As a** repository maintainer  
**I want** to preserve historical Docker/.NET implementation  
**So that** users can reference the original implementation and migration path

**Acceptance Criteria:**
- Docker and .NET source files remain in repository
- Documentation explains relationship between legacy and current implementation
- No deletion of legacy artifacts without documented deprecation plan

## Requirements

### NFR-001: Node 20 JavaScript Action
**Category:** Runtime and Portability (SI-N1)

**Statement:** The action shall be implemented as a Node 20 JavaScript action using `runs.using: node20` in action.yml.

**Test Approach:** Verify action.yml contains `runs.using: node20` and action executes successfully on Node 20 runtime.

### NFR-002: Cross-Platform Compatibility
**Category:** Runtime and Portability (SI-N1)

**Statement:** The action shall run successfully on GitHub-hosted runners for Linux, Windows, and macOS without platform-specific dependencies.

**Test Approach:** Execute action in CI matrix across ubuntu-latest, windows-latest, and macos-latest; verify identical outputs.

### NFR-003: No Docker Dependency
**Category:** Runtime and Portability (SI-N1)

**Statement:** The action shall not require Docker at runtime.

**Test Approach:** Verify action.yml does not use `runs.using: docker` and no Docker commands are executed.

### NFR-004: No .NET Runtime Dependency
**Category:** Runtime and Portability (SI-N1)

**Statement:** The action shall not require .NET runtime at runtime.

**Test Approach:** Verify no .NET executables or libraries are invoked during action execution.

### NFR-005: Standard JavaScript Dependencies Only
**Category:** Runtime and Portability (SI-N1)

**Statement:** The action shall use only standard npm packages compatible with Node 20 across all platforms.

**Test Approach:** Run `npm ci` and verify all dependencies install successfully on all platforms; check package.json engines field.

### NFR-006: Offline Execution
**Category:** No Network Dependency (SI-N2)

**Statement:** Normal execution shall not require network calls.

**Test Approach:** Execute action with network disabled; verify it completes successfully (badge generation creates URL but doesn't fetch it).

### NFR-007: No External Resource Fetching
**Category:** No Network Dependency (SI-N2)

**Statement:** Badge generation shall create URLs without fetching external resources.

**Test Approach:** Monitor network activity during badge generation; verify no HTTP requests are made.

### NFR-008: Local File Processing Only
**Category:** No Network Dependency (SI-N2)

**Statement:** All coverage file processing shall be performed locally without network access.

**Test Approach:** Verify all file reads use local filesystem APIs; no network protocols in file paths.

### NFR-009: GitHub Actions Toolkit Logging
**Category:** Official Logging Mechanisms (SI-N3)

**Statement:** All logging shall use @actions/core logging methods or equivalent workflow commands.

**Test Approach:** Code review to verify all logging uses core.info(), core.debug(), core.warning(), core.error(); no console.log() in production code.

### NFR-010: Error Logging via setFailed
**Category:** Official Logging Mechanisms (SI-N3)

**Statement:** Failures shall be communicated via core.setFailed() to set exit code and log error.

**Test Approach:** Trigger error conditions; verify workflow step fails with exit code 1 and error message appears in logs.

### NFR-011: Info Level for Normal Operations
**Category:** Official Logging Mechanisms (SI-N3)

**Statement:** Normal operations shall log using core.info() or higher severity.

**Test Approach:** Run action successfully; verify informational messages appear in workflow logs using core.info().

### NFR-012: Warning Level for Recoverable Issues
**Category:** Official Logging Mechanisms (SI-N3)

**Statement:** Recoverable issues shall log using core.warning().

**Test Approach:** Trigger recoverable issues (e.g., missing optional data); verify warnings appear without failing step.

### NFR-013: Log Grouping for Multi-Step Operations
**Category:** Official Logging Mechanisms (SI-N3)

**Statement:** Multi-step operations shall use core.startGroup()/core.endGroup() for collapsible log sections.

**Test Approach:** Verify file discovery and processing use log groups; check workflow logs show collapsible sections.

### NFR-014: Debug Logging Support
**Category:** Debug Log Behavior (SI-N4)

**Statement:** When ACTIONS_STEP_DEBUG=true, the action shall emit debug-level logs via core.debug().

**Test Approach:** Run action with ACTIONS_STEP_DEBUG=true; verify debug messages appear in logs.

### NFR-015: Debug Logs Not Required in Normal Mode
**Category:** Debug Log Behavior (SI-N4)

**Statement:** Debug logs shall not appear when ACTIONS_STEP_DEBUG is not enabled.

**Test Approach:** Run action normally; verify debug messages do not appear in workflow logs.

### NFR-016: Diagnostic Information in Debug Logs
**Category:** Debug Log Behavior (SI-N4)

**Statement:** Debug logs shall include internal diagnostic information useful for troubleshooting.

**Test Approach:** Enable debug logging; verify logs include file paths, parsed values, intermediate calculations.

### NFR-017: Deterministic Output Content
**Category:** Determinism (SI-N5)

**Statement:** For fixed inputs and input files, output content shall be identical across runs.

**Test Approach:** Run action twice with identical inputs; compare outputs byte-for-byte.

### NFR-018: Deterministic Output Ordering
**Category:** Determinism (SI-N5)

**Statement:** Output ordering shall be deterministic and not dependent on filesystem or object enumeration order.

**Test Approach:** Run action multiple times; verify package rows appear in same order.

### NFR-019: Locale-Independent Formatting
**Category:** Determinism (SI-N5)

**Statement:** Number and percentage formatting shall be locale-independent.

**Test Approach:** Run action with different LANG/LC_* environment variables; verify output formatting is identical.

### NFR-020: No Timestamps in Output
**Category:** Determinism (SI-N5)

**Statement:** Output shall not include timestamps or time-dependent values.

**Test Approach:** Verify output files contain no timestamp fields; outputs are identical when run at different times.

### NFR-021: Legacy Docker Files Preserved
**Category:** Preserve Legacy Artifacts (SI-N6)

**Statement:** The Dockerfile and related Docker configuration shall remain in the repository.

**Test Approach:** Verify Dockerfile exists in repository root.

### NFR-022: Legacy .NET Source Preserved
**Category:** Preserve Legacy Artifacts (SI-N6)

**Statement:** The src/CodeCoverageSummary/ .NET source code shall remain in the repository.

**Test Approach:** Verify src/CodeCoverageSummary/ directory exists with original .NET code.

### NFR-023: Migration Documentation
**Category:** Preserve Legacy Artifacts (SI-N6)

**Statement:** Documentation shall explain the relationship between legacy and current implementation.

**Test Approach:** Verify README or docs explain Docker/.NET legacy implementation and migration to JavaScript.

### NFR-024: Test Coverage Threshold
**Category:** Test Coverage for Behavior (SI-N7)

**Statement:** Automated tests shall achieve ≥80% code coverage.

**Test Approach:** Run `npm run test:coverage`; verify coverage report shows ≥80% for lines, branches, functions, statements.

### NFR-025: Multi-File Aggregation Tests
**Category:** Test Coverage for Behavior (SI-N7)

**Statement:** Tests shall cover multi-file rate averaging behavior (unweighted mean).

**Test Approach:** Verify test suite includes cases for multiple coverage files with different rates; assert correct averaging.

### NFR-026: Branch Rate Hiding Tests
**Category:** Test Coverage for Behavior (SI-N7)

**Statement:** Tests shall cover branch-rate hiding logic.

**Test Approach:** Verify test suite includes cases for missing branch data and hide_branch_rate=true/false.

### NFR-027: Threshold Parsing Tests
**Category:** Test Coverage for Behavior (SI-N7)

**Statement:** Tests shall cover threshold parsing edge cases (single value, lower > upper, clamping).

**Test Approach:** Verify test suite includes threshold parsing tests for "50", "50 75", "80 60", "110 120".

### NFR-028: Complexity Formatting Tests
**Category:** Test Coverage for Behavior (SI-N7)

**Statement:** Tests shall cover complexity formatting (integer vs 4 decimal places).

**Test Approach:** Verify test suite includes complexity values like 10, 10.5, 10.12345; assert correct formatting.

### NFR-029: Error Message Tests
**Category:** Test Coverage for Behavior (SI-N7)

**Statement:** Tests shall verify exact error messages for failure conditions.

**Test Approach:** Verify test suite asserts error message text matches expected format for all error conditions.

### NFR-030: Representative Fixtures
**Category:** Test Coverage for Behavior (SI-N7)

**Statement:** Tests shall use representative Cobertura XML fixtures covering common and edge cases.

**Test Approach:** Verify test fixtures include: valid multi-package, missing branches, unnamed packages, malformed XML.

### NFR-031: Cross-Platform Test Execution
**Category:** Test Coverage for Behavior (SI-N7)

**Statement:** Tests shall run successfully on all supported platforms.

**Test Approach:** Run test suite in CI matrix on ubuntu/windows/macos; verify all tests pass on all platforms.

### NFR-032: Untrusted Input Assumption
**Category:** Security Posture (SI-N8)

**Statement:** All inputs and coverage XML files shall be treated as untrusted.

**Test Approach:** Code review to verify no `eval()`, `Function()`, or code generation from input; all inputs validated.

### NFR-033: No External Entity Resolution
**Category:** Security Posture (SI-N8)

**Statement:** XML parser shall not execute or resolve external entities (XXE prevention).

**Test Approach:** Test with malicious XML containing XXE payload; verify parser does not resolve external entities.

### NFR-034: Safe XML Parser Configuration
**Category:** Security Posture (SI-N8)

**Statement:** XML parser shall be configured with safe defaults (DTD processing disabled, external entities disabled).

**Test Approach:** Verify fast-xml-parser usage does not enable DTD processing or external entity resolution.

### NFR-035: No Secret Leakage in Logs
**Category:** Security Posture (SI-N8)

**Statement:** Failure modes shall not leak secrets or sensitive environment data in logs.

**Test Approach:** Trigger errors with GITHUB_TOKEN set; verify token does not appear in error logs.

### NFR-036: No Sensitive Data in Error Messages
**Category:** Security Posture (SI-N8)

**Statement:** Error messages shall not include file content that could contain sensitive data.

**Test Approach:** Trigger parsing errors; verify error messages reference filenames but not file content.

### NFR-037: Input Validation
**Category:** Security Posture (SI-N8)

**Statement:** All action inputs shall be validated before use.

**Test Approach:** Verify code validates format, output, boolean inputs; handles invalid values gracefully.

### NFR-038: Path Traversal Prevention
**Category:** Security Posture (SI-N8)

**Statement:** File paths from glob patterns shall be validated to prevent path traversal attacks.

**Test Approach:** Test with glob pattern containing "../"; verify action doesn't access files outside workspace.

### NFR-039: Resource Limits
**Category:** Security Posture (SI-N8)

**Statement:** Parsing shall have reasonable resource limits to prevent DoS via extremely large files.

**Test Approach:** Test with very large XML files (>100MB); verify action handles gracefully or fails safely with clear error.

## Success Criteria

### SC-001: Platform Compatibility
**Measurement:** Action executes successfully in CI matrix on ubuntu-latest, windows-latest, macos-latest with Node 20.

**Target:** 100% success rate across all platform/Node combinations.

### SC-002: Output Consistency
**Measurement:** Byte-for-byte comparison of outputs from same inputs on different platforms.

**Target:** Identical outputs across all platforms.

### SC-003: No Runtime Dependencies
**Measurement:** Count of external runtime dependencies beyond Node and npm packages.

**Target:** Zero (no Docker, no .NET runtime, no native binaries).

### SC-004: Deterministic Results
**Measurement:** Multiple executions with same inputs produce identical outputs.

**Target:** 100% reproducibility across 10 consecutive runs.

### SC-005: Network Independence
**Measurement:** Action completes successfully with network disabled.

**Target:** 100% success rate in offline mode (for normal execution without badge fetching).

### SC-006: Badge Generation
**Measurement:** Badge URL generation does not make network calls.

**Target:** Zero network requests during badge URL generation.

### SC-007: Logging Integration
**Measurement:** All logging uses @actions/core methods.

**Target:** 100% of log statements use core.info/debug/warning/error (zero console.log in production).

### SC-008: Debug Logging
**Measurement:** Debug logs appear when ACTIONS_STEP_DEBUG=true, absent otherwise.

**Target:** Debug messages visible with flag, invisible without flag.

### SC-009: Error Reporting
**Measurement:** Errors use core.setFailed() and set exit code.

**Target:** 100% of error paths use core.setFailed(); workflow step fails appropriately.

### SC-010: Log Grouping
**Measurement:** Multi-step operations use log groups.

**Target:** File discovery and processing operations use collapsible log sections.

### SC-011: Code Coverage
**Measurement:** Test coverage percentage from `npm run test:coverage`.

**Target:** ≥80% coverage for lines, branches, functions, statements.

### SC-012: Comprehensive Test Cases
**Measurement:** Count of test scenarios covering requirements and edge cases.

**Target:** All 39 NFR requirements have corresponding test cases.

### SC-013: Test Fixtures
**Measurement:** Count and variety of Cobertura XML test fixtures.

**Target:** Minimum 10 fixtures covering valid, malformed, edge cases.

### SC-014: Cross-Platform Tests
**Measurement:** Test suite passes on all supported platforms.

**Target:** 100% test pass rate on ubuntu/windows/macos.

### SC-015: XXE Prevention
**Measurement:** Malicious XML with external entity declarations does not resolve.

**Target:** Zero external entity resolution; test with XXE payload fails safely.

### SC-016: Error Handling
**Measurement:** All error paths log appropriate message and fail gracefully.

**Target:** Zero uncaught exceptions; all errors logged with context.

### SC-017: Input Validation
**Measurement:** Invalid inputs rejected with clear error messages.

**Target:** 100% of invalid inputs handled gracefully.

### SC-018: Resource Limits
**Measurement:** Extremely large files handled without timeout or crash.

**Target:** Files up to 100MB processed or fail with clear error within 5 minutes.

### SC-019: Legacy Preservation
**Measurement:** Existence of Dockerfile and src/CodeCoverageSummary/ in repository.

**Target:** Both legacy artifacts present and unchanged.

### SC-020: Migration Documentation
**Measurement:** Documentation describes legacy implementation and migration path.

**Target:** README or docs explain Docker/.NET → JavaScript migration.

### SC-021: Requirement Traceability
**Measurement:** Each NFR maps to at least one test case.

**Target:** 100% NFR coverage in test suite.

## Edge Cases

### EC-001: Missing Branch Coverage
**Scenario:** Coverage file has no branch-rate attribute or branch-rate=0 with branches-valid=0

**Expected Behavior:** Branch rate output is hidden regardless of hide_branch_rate input

**Test:** Verify output does not include branch rate column/row when all branch metrics are zero/missing

### EC-002: Single Threshold Value
**Scenario:** thresholds input contains only lower value (e.g., "60")

**Expected Behavior:** Upper threshold defaults to legacy value while lower is parsed

**Test:** Verify threshold parsing handles single value correctly

### EC-003: Invalid Threshold Order
**Scenario:** lower > upper (e.g., "80 60")

**Expected Behavior:** upper is adjusted to lower + 10, then clamped to 100

**Test:** Verify "80 60" results in thresholds [80, 90]

### EC-004: Threshold Clamping
**Scenario:** Threshold values exceed 100 (e.g., "110 120")

**Expected Behavior:** Values clamped to 100

**Test:** Verify "110 120" results in thresholds [100, 100]

### EC-005: No File Matches
**Scenario:** Glob pattern matches no files

**Expected Behavior:** Action fails with error: "Error: No files found matching glob pattern."

**Test:** Verify exact error message and failure exit code

### EC-006: Malformed XML
**Scenario:** Coverage file contains invalid XML

**Expected Behavior:** Action fails with error: "Parsing Error: <details> - <filename>"

**Test:** Verify error message includes filename and parsing details

### EC-007: Network Isolation
**Scenario:** Action runs in environment without network access

**Expected Behavior:** Action completes successfully; badge URL generated but not fetched

**Test:** Run in network-isolated container; verify success

### EC-008: Node Version Compatibility
**Scenario:** Action runs on Node 20 and Node 24

**Expected Behavior:** Identical behavior on both versions

**Test:** CI matrix tests both Node 20 and Node 24

### EC-009: Complexity Formatting
**Scenario:** Complexity values include integers and decimals

**Expected Behavior:** Integers formatted without decimals; decimals with 4 decimal places

**Test:** Verify complexity=10 formats as "10", complexity=10.12345 formats as "10.1235"

## Dependencies

- Node 20 runtime (target environment)
- @actions/core package (logging, inputs, outputs)
- @actions/glob package (file pattern matching)
- fast-xml-parser package (XML parsing, XXE-safe)
- Jest (test framework with coverage reporting)

## Assumptions

- GitHub-hosted runners provide Node 20 runtime
- Workspace has read/write permissions for file operations
- ACTIONS_STEP_DEBUG environment variable controls debug logging
- fast-xml-parser does not support DTD processing (inherently XXE-safe)
- Coverage files follow Cobertura XML schema

## Out of Scope

- Support for non-Cobertura coverage formats
- Real-time coverage monitoring or streaming
- Coverage trend analysis across commits
- Integration with external coverage services
- Generating coverage reports (only summarizing existing reports)
- Node versions other than 20 and 24
- Custom badge rendering or styling beyond Shields.io URLs
- Breaking compatibility with legacy Docker/.NET implementation behavior
