# Research: Error Handling and Failure Messages

**Spec**: `/specs/005-error-handling/spec.md`

## Sources

### Error Handling Best Practices in TypeScript/Node.js
- Error Handling in Node.js: Patterns and Practices (DEV 2024): https://dev.to/wallacefreitas/error-handling-in-nodejs-patterns-and-practices-1mg0
- TypeScript Error Handling - W3Schools: https://www.w3schools.com/typescript/typescript_error_handling.php
- Advanced Error Handling in TypeScript (overctrl.com, 2024): https://blog.overctrl.com/advanced-error-handling-in-typescript-best-practices-and-common-pitfalls/
- The Complete Guide to Error Handling in TypeScript (DhiWise): https://www.dhiwise.com/post/typescript-error-handling-pitfalls-and-how-to-avoid-them

### GitHub Actions Error Reporting Mechanisms
- Setting exit codes for actions - GitHub Docs: https://docs.github.com/en/actions/how-tos/create-and-publish-actions/set-exit-codes
- @actions/core npm package documentation: https://www.npmjs.com/package/@actions/core
- Workflow commands for GitHub Actions: https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-commands
- How to Handle Step and Job Errors in GitHub Actions (Ken Muse): https://www.kenmuse.com/blog/how-to-handle-step-and-job-errors-in-github-actions/

### Testing Error Scenarios in Jest
- Testing exceptions in Jest (Sync and Async code) - bobbyhadz: https://bobbyhadz.com/blog/jest-test-exception
- How to test the type of a thrown exception in Jest - Stack Overflow: https://stackoverflow.com/questions/46042613/how-to-test-the-type-of-a-thrown-exception-in-jest
- Testing errors with Jest - DEV Community: https://dev.to/danywalls/testing-errors-with-jest-hkj
- Error Handling Strategies for Reliable Jest Testing (MoldStud): https://moldstud.com/articles/p-error-handling-in-jest-tests-essential-tips-for-robust-and-reliable-testing

### Input Validation Patterns
- Yup vs Zod: Choosing the Right Validation Library (Better Stack): https://betterstack.com/community/guides/scaling-nodejs/yup-vs-zod/
- Schema validation in TypeScript with Zod (LogRocket): https://blog.logrocket.com/schema-validation-typescript-zod/
- Type Guards vs Schema Validation (Full Stack TypeScript): https://stevekinney.com/courses/full-stack-typescript/type-guards-vs-schema-validation

## Decisions

### Use simple validation without external schema libraries

- **Decision**: Implement input validation using straightforward TypeScript type guards and string matching without introducing Zod, Yup, or other validation libraries.
- **Rationale**: 
  - The validation requirements are simple: check if `format` is in `['text', 'md', 'markdown']` and `output` is in `['console', 'file', 'both']`
  - The error messages must match exact legacy text, which is simpler with direct string checks
  - Adding a validation library introduces unnecessary dependencies and bundle size for trivial validations
  - Type guards provide sufficient TypeScript integration for our use case
- **Alternatives considered**: 
  - Zod: Rejected - overkill for 2-3 string value checks; adds ~50KB+ to bundle
  - Yup: Rejected - same reasoning as Zod
  - Custom error classes: Rejected - not needed since we have exact error message requirements from legacy

### Use core.setFailed for all error scenarios

- **Decision**: Use `@actions/core.setFailed(message)` consistently for all error conditions (invalid inputs, parsing errors, threshold violations).
- **Rationale**:
  - Official GitHub Actions mechanism for reporting action failures (per NFR-4)
  - Sets exit code to 1 and logs the message with `::error::` annotation automatically
  - Consistent with existing @actions/core usage in the codebase
  - Stops workflow step execution as required by spec
- **Alternatives considered**:
  - Manual `process.exit(1)`: Rejected - not the official pattern and harder to test
  - Throwing errors: Rejected - uncaught errors produce generic messages, not our exact required text
  - core.error + process.exit: Rejected - redundant compared to setFailed which does both

### Validate inputs before processing (fail-fast pattern)

- **Decision**: Check format and output values immediately after retrieving inputs from @actions/core, before any file discovery or parsing.
- **Rationale**:
  - FR-G21 explicitly requires input validation before processing coverage files
  - Fail-fast reduces wasted processing time and provides immediate feedback
  - Matches user expectation: configuration errors should be caught first
  - Easier to test in isolation
- **Alternatives considered**:
  - Validate during report generation: Rejected - violates FR-G21 and wastes processing time
  - Lazy validation: Rejected - same issues as above

### Include filename in parsing error messages via structured logging

- **Decision**: Catch parsing exceptions, extract/preserve the filename being processed, and construct the error message as `Parsing Error: ${descriptiveMessage} - ${filename}` before calling setFailed.
- **Rationale**:
  - FR-G8 requires exact message format with filename
  - Filename must be the same path logged in "Coverage File:" messages (FR-G11)
  - Structured approach allows testing message format independently
  - Enables clear error messages for multi-file scenarios
- **Alternatives considered**:
  - Global error handler: Rejected - harder to guarantee filename availability in context
  - Template literals inline: Accepted - simplest approach for exact string matching

### Test error scenarios using Jest's toThrow matcher

- **Decision**: Use `expect(() => functionCall()).toThrow('exact message')` pattern for synchronous errors and `await expect(asyncFunction()).rejects.toThrow('exact message')` for async errors.
- **Rationale**:
  - Jest's built-in matchers provide exact string matching for error messages
  - Aligns with research findings on Jest best practices
  - Synchronous validation can use simpler toThrow syntax
  - Async parsing errors require rejects.toThrow pattern
  - Enables testing exact legacy message compatibility
- **Alternatives considered**:
  - Try/catch in tests: Rejected - verbose and easy to forget expect.assertions
  - Custom matchers: Rejected - unnecessary complexity for exact string matching
  - Snapshot testing: Rejected - too brittle for error messages we must match exactly

### Parse threshold from input for enforcement checks

- **Decision**: Retrieve the lower threshold value from the thresholds input (already parsed per SI-D4) and use it for both annotation text and comparison logic.
- **Rationale**:
  - SI-D4 threshold parsing is a dependency of this feature
  - Lower threshold is used in both report annotation and failure message
  - Comparison logic: `summaryLineRate < lowerThreshold` triggers failure (FR-G17)
  - Equality is NOT failure (FR-G19): 60% coverage with 60% threshold = pass
- **Alternatives considered**:
  - Re-parse thresholds: Rejected - duplicates logic and violates DRY
  - Use upper threshold: Rejected - spec explicitly uses lower threshold for enforcement

### Add threshold annotation only when fail_below_min is true

- **Decision**: Check if `fail_below_min` input equals "true" (case-insensitive) and only then add the "Minimum allowed line rate is X%" annotation to reports.
- **Rationale**:
  - FR-G13/G20: annotation only appears when enforcement is enabled
  - Matches legacy behavior of conditional annotation
  - Format differs by output type: plain text vs markdown italic (FR-G14/G15)
  - Annotation appears regardless of pass/fail (FR-G16)
- **Alternatives considered**:
  - Always show annotation: Rejected - violates FR-G20
  - Add annotation during threshold check: Rejected - violates FR-G16 (must show even on pass)

### Format-specific threshold annotation rendering

- **Decision**: Inject threshold annotation line into report string based on format type: `Minimum allowed line rate is ${lower}%` for text, `_Minimum allowed line rate is ${lower}%_` for markdown.
- **Rationale**:
  - FR-G14 and FR-G15 specify exact format including markdown italics
  - Simple string concatenation matches exact legacy output
  - Format is already validated at input stage
- **Alternatives considered**:
  - Template engine: Rejected - overkill for single line difference
  - Unified format: Rejected - spec requires format-specific rendering

### Check threshold violations after report generation

- **Decision**: Perform threshold comparison and call setFailed after successfully generating the report, as the final step before returning.
- **Rationale**:
  - FR-G23: threshold checks only after successful parsing and report generation
  - Report must be generated (and potentially output) even if threshold will fail
  - Enables users to see coverage summary in logs before failure message
  - Matches logical flow: validate → parse → generate → enforce
- **Alternatives considered**:
  - Check before report generation: Rejected - violates FR-G23 and prevents seeing results
  - Check during parsing: Rejected - threshold depends on aggregated summary, not available during parse

## Integration Notes

### Dependencies with other specification items

- **SI-D4 (Threshold parsing)**: Must be implemented to provide lower threshold value for enforcement
- **SI-D2 (Multi-file aggregation)**: Threshold comparison uses summary line rate (unweighted average)
- **SI-F1/F2/F3 (Output destination)**: Threshold annotation must be added before output formatting
- **NFR-4 (Official logging mechanisms)**: All failures use @actions/core.setFailed

### Error precedence order (based on workflow execution flow)

1. Input validation errors (format/output) - checked first per FR-G21
2. Parsing errors - occur during file processing, fail-fast on first error
3. Threshold violations - checked last after successful report generation per FR-G23

### Testing strategy based on research

- **Synchronous validation tests**: Use `expect(() => validateInput(value)).toThrow('exact message')`
- **Async parsing tests**: Use `await expect(parseFile(path)).rejects.toThrow(expect.stringContaining('Parsing Error:'))`
- **Message format tests**: Test exact string matching for legacy compatibility
- **Integration tests**: Test complete flows with actual coverage fixtures
- **Edge case tests**: Test exact threshold boundary (equal vs below), multiple errors, etc.
