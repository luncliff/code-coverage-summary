# Implementation Plan: NFR Specification Compliance

## Overview

This plan outlines the approach for validating and documenting compliance with Non-Functional Requirements (NFRs) for the Code Coverage Summary GitHub Action.

## Objectives

1. Validate existing implementation against 39 NFR requirements
2. Add missing tests to achieve ≥80% coverage
3. Document NFR compliance and traceability
4. Ensure cross-platform compatibility
5. Strengthen security posture

## Phase 0: Research & Prerequisites

### Web Research Findings

#### 1. GitHub Actions Node 20 Runtime Best Practices

**Sources:**
- GitHub Docs: Creating a JavaScript Action - https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action
- GitHub Actions Toolkit - https://github.com/actions/toolkit
- Node 20 Release Notes - https://nodejs.org/en/blog/release/v20.0.0
- GitHub Actions Runner: Node 20 migration - https://github.blog/changelog/2023-09-22-github-actions-transitioning-from-node-16-to-node-20/

**Key Findings:**
- Node 20 EOL: April 2026; plan migration to Node 24 by Fall 2026
- Use `runs.using: node20` in action.yml
- JavaScript actions should be "pure JavaScript" and not rely on other binaries for cross-platform compatibility
- Use latest @actions packages (@actions/core@^1.11.1, @actions/glob@^0.5.0)
- Commit compiled dist/ folder for fast action loading
- Use npm ci for deterministic installs

**Application:**
- Verify action.yml specifies node20
- Confirm no native binary dependencies
- Update to latest @actions packages
- Add Node 24 to test matrix for forward compatibility

#### 2. Cross-Platform Compatibility for JavaScript Actions

**Sources:**
- GitHub Docs: Metadata syntax - https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions
- Node.js path module - https://nodejs.org/api/path.html
- Cross-platform testing guide - https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix

**Key Findings:**
- Use path module for path operations (never string concatenation)
- Handle line ending differences (CRLF on Windows, LF on Unix)
- Case sensitivity varies (Windows case-insensitive, Unix case-sensitive)
- Path separators differ (\ on Windows, / on Unix)
- Use matrix strategy to test on ubuntu-latest, windows-latest, macos-latest

**Application:**
- Audit code for hardcoded path separators
- Use path.join(), path.resolve() instead of string concat
- Test file discovery on all platforms
- Normalize line endings in test fixtures

#### 3. Secure XML Parsing in Node.js

**Sources:**
- OWASP XXE Prevention - https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html
- fast-xml-parser documentation - https://github.com/NaturalIntelligence/fast-xml-parser
- CWE-611: Improper Restriction of XML External Entity Reference - https://cwe.mitre.org/data/definitions/611.html

**Key Findings:**
- XXE (XML External Entity) attacks exploit XML parsers that resolve external entities
- fast-xml-parser is inherently safe: does NOT support DTD processing or external entities
- No special configuration needed for XXE prevention with fast-xml-parser
- Validate XML structure before processing to fail fast on malformed input

**Application:**
- Continue using fast-xml-parser (already XXE-safe)
- Add test with malicious XXE payload to verify safety
- Document XXE safety in security documentation
- Add input validation for XML structure

#### 4. GitHub Actions Logging and Debugging Mechanisms

**Sources:**
- Workflow commands - https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
- Enabling debug logging - https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging
- @actions/core logging - https://github.com/actions/toolkit/tree/main/packages/core

**Key Findings:**
- Use core.info() for informational messages visible in normal mode
- Use core.debug() for diagnostic messages visible only when ACTIONS_STEP_DEBUG=true
- Use core.warning() for non-fatal issues
- Use core.error() to log errors (does not fail step)
- Use core.setFailed() to log error AND fail step (exit code 1)
- Use core.startGroup()/core.endGroup() for collapsible log sections
- Debug logging enabled by setting repository secret ACTIONS_STEP_DEBUG=true

**Application:**
- Replace any console.log() with core.info()
- Add core.debug() for diagnostic details (file paths, parsed values)
- Use core.setFailed() for all failure paths
- Group file discovery and processing logs

#### 5. Test Coverage Strategies for GitHub Actions

**Sources:**
- Jest Coverage Documentation - https://jestjs.io/docs/configuration#coveragethreshold-object
- Testing GitHub Actions - https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#testing-your-action
- Industry standard coverage thresholds - https://testing.googleblog.com/2020/08/code-coverage-best-practices.html

**Key Findings:**
- 80% coverage is industry standard for production code
- Coverage should be enforced in CI to prevent regressions
- Test edge cases, error paths, and boundary conditions
- Use representative fixtures that mirror real-world inputs
- Configure Jest to fail build if coverage drops below threshold

**Application:**
- Set coverageThreshold in jest.config.js: 80% for all metrics
- Add tests for all NFR requirements
- Create comprehensive Cobertura XML fixtures (valid, malformed, edge cases)
- Include error path testing (no files found, parsing errors, validation failures)

#### 6. Deterministic Build Practices

**Sources:**
- npm ci vs npm install - https://docs.npmjs.com/cli/v10/commands/npm-ci
- Reproducible builds - https://reproducible-builds.org/docs/
- Date/time handling in tests - https://jestjs.io/docs/timer-mocks

**Key Findings:**
- Use npm ci (not npm install) in CI to respect package-lock.json exactly
- Commit package-lock.json for deterministic dependency resolution
- Avoid timestamps in output; use fixed values or omit entirely
- Sort output to avoid order variations
- Use locale-independent number formatting (always use en-US or explicit formats)

**Application:**
- Verify package-lock.json is committed
- Use npm ci in CI workflows
- Audit code for timestamp generation
- Use toFixed() or Intl.NumberFormat with explicit locale for number formatting
- Sort package rows consistently

### Technology Decisions

| Area | Technology | Rationale |
|------|-----------|-----------|
| Runtime | Node 20 JavaScript action | Cross-platform compatibility; official GitHub recommendation |
| XML Parsing | fast-xml-parser | XXE-safe by design; no DTD support; lightweight |
| Logging | @actions/core | Official GitHub Actions toolkit; proper integration |
| Testing | Jest | Industry standard; built-in coverage reporting |
| Glob Matching | @actions/glob | Official GitHub toolkit; consistent with other actions |

## Phase 1: Validation & Testing

### Task 1.1: NFR Compliance Audit
**Priority:** High  
**Estimated Effort:** 2 hours

**Activities:**
1. Review existing implementation against all 39 NFR requirements
2. Document current compliance status (pass/fail/partial)
3. Identify gaps requiring implementation changes
4. Identify gaps requiring additional tests only

**Deliverables:**
- Compliance matrix (NFR × current status)
- Gap analysis document

### Task 1.2: Cross-Platform Testing Enhancement
**Priority:** High  
**Estimated Effort:** 3 hours

**Activities:**
1. Expand test matrix to include Node 24
2. Add platform-specific test cases (path handling, line endings)
3. Verify glob pattern behavior across platforms
4. Test output consistency across platforms

**Deliverables:**
- Updated .github/workflows/test-action.yml with Node 24
- Platform-specific test cases in __tests__/
- Validation that outputs are identical across platforms

### Task 1.3: Security Testing
**Priority:** High  
**Estimated Effort:** 2 hours

**Activities:**
1. Create malicious XML fixtures (XXE payloads, billion laughs, etc.)
2. Test parser behavior with malicious input
3. Verify no external entity resolution
4. Test error handling doesn't leak sensitive data
5. Validate path traversal prevention

**Deliverables:**
- Security test fixtures in __tests__/fixtures/security/
- Security-focused test cases
- Documentation of security posture

### Task 1.4: Test Coverage Expansion
**Priority:** High  
**Estimated Effort:** 4 hours

**Activities:**
1. Run coverage report and identify gaps
2. Add tests for uncovered branches and error paths
3. Add tests for all NFR requirements
4. Configure Jest coverage threshold at 80%

**Deliverables:**
- Comprehensive test suite with ≥80% coverage
- jest.config.js with enforced coverage thresholds
- Tests mapping to each NFR requirement

### Task 1.5: Logging Enhancement
**Priority:** Medium  
**Estimated Effort:** 2 hours

**Activities:**
1. Audit code for console.log() usage
2. Replace with appropriate core logging methods
3. Add debug logging for diagnostic information
4. Implement log grouping for multi-step operations
5. Test debug logging with ACTIONS_STEP_DEBUG=true

**Deliverables:**
- All logging uses @actions/core methods
- Debug logs available when flag enabled
- Grouped logs for file discovery and processing

### Task 1.6: Determinism Validation
**Priority:** Medium  
**Estimated Effort:** 2 hours

**Activities:**
1. Run action multiple times with same inputs
2. Verify byte-for-byte output consistency
3. Test with different locales
4. Verify no timestamps or random values in output
5. Ensure sorted/deterministic output ordering

**Deliverables:**
- Determinism test cases
- Documentation of deterministic behavior
- Locale-independent formatting confirmed

## Phase 2: Documentation

### Task 2.1: NFR Traceability Matrix
**Priority:** Medium  
**Estimated Effort:** 1 hour

**Activities:**
1. Create matrix mapping NFR → Implementation → Tests
2. Document how each NFR is satisfied
3. Link to relevant code and test files

**Deliverables:**
- NFR traceability matrix in specs/008-nfr-specification/
- Updated spec.md with implementation references

### Task 2.2: Security Documentation
**Priority:** Medium  
**Estimated Effort:** 1 hour

**Activities:**
1. Document XXE prevention approach
2. Document input validation strategy
3. Document error handling that prevents secret leakage
4. Add security section to README

**Deliverables:**
- specs/008-nfr-specification/contracts/security.md
- Updated README with security information

### Task 2.3: Migration Documentation
**Priority:** Low  
**Estimated Effort:** 1 hour

**Activities:**
1. Document relationship between Docker/.NET and JavaScript implementations
2. Explain behavioral compatibility
3. Note any intentional differences

**Deliverables:**
- Migration guide in specs/008-nfr-specification/
- README section on legacy implementation

## Phase 3: Continuous Validation

### Task 3.1: CI Enforcement
**Priority:** High  
**Estimated Effort:** 1 hour

**Activities:**
1. Ensure coverage threshold enforced in CI
2. Ensure tests run on all platforms
3. Add Node 24 to test matrix for forward compatibility
4. Verify deterministic behavior in CI

**Deliverables:**
- Updated .github/workflows/test-action.yml
- Coverage enforcement in npm test

### Task 3.2: Monitoring & Maintenance
**Priority:** Low  
**Estimated Effort:** Ongoing

**Activities:**
1. Monitor Node.js EOL schedule (Node 20 EOL: April 2026)
2. Track GitHub Actions runtime updates
3. Review security advisories for dependencies
4. Maintain test fixtures as coverage formats evolve

**Deliverables:**
- Maintenance schedule documented
- Dependency update process

## Success Criteria

### Phase 1 Completion Criteria
- [ ] All 39 NFR requirements validated
- [ ] Test coverage ≥80% achieved
- [ ] All tests pass on ubuntu/windows/macos
- [ ] All tests pass on Node 20 and Node 24
- [ ] Security tests confirm XXE prevention
- [ ] Determinism tests pass (identical outputs)
- [ ] Logging uses @actions/core exclusively

### Phase 2 Completion Criteria
- [ ] NFR traceability matrix complete
- [ ] Security documentation published
- [ ] Migration documentation complete

### Phase 3 Completion Criteria
- [ ] Coverage threshold enforced in CI
- [ ] Platform matrix includes Node 24
- [ ] Maintenance schedule documented

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Platform differences in glob behavior | High | Medium | Comprehensive cross-platform testing; use @actions/glob |
| Coverage threshold too aggressive | Medium | Low | Start at 80%; adjust if blocking legitimate changes |
| Node 20 → 24 migration issues | Medium | Low | Add Node 24 to matrix early; test compatibility |
| Security test false positives | Low | Medium | Use well-known XXE payloads; verify with security tools |

## Dependencies

### External Dependencies
- Node 20 runtime (available on GitHub-hosted runners)
- Node 24 runtime (for forward compatibility testing)
- GitHub Actions toolkit packages (@actions/core, @actions/glob)
- fast-xml-parser (current dependency)
- Jest (current dev dependency)

### Internal Dependencies
- Existing test infrastructure
- Current implementation in src/
- Legacy implementation in Dockerfile and src/CodeCoverageSummary/ (preserved)

## Timeline Estimate

- Phase 1: 15 hours (validation & testing)
- Phase 2: 3 hours (documentation)
- Phase 3: 1 hour (CI enforcement) + ongoing monitoring

**Total:** ~19 hours + ongoing maintenance

## Next Steps

1. Execute Phase 1 tasks in priority order
2. Achieve ≥80% test coverage
3. Validate compliance with all NFR requirements
4. Document findings and create traceability matrix
5. Enforce NFR compliance in CI pipeline

## References

### Official Documentation
- GitHub Actions: https://docs.github.com/en/actions
- Node.js: https://nodejs.org/
- Jest: https://jestjs.io/
- OWASP XXE Prevention: https://cheatsheetseries.owasp.org/

### Project Context
- specification-items.md: NFR definitions (SI-N1 through SI-N8)
- project-requirements.md: Derived requirements (NFR-1 through NFR-9)
- .github/workflows/test-action.yml: Current test configuration
- specs/008-nfr-specification/spec.md: Detailed NFR specification (NFR-001 through NFR-039)
