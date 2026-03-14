# Research: Non-Functional Requirements Implementation

## Overview

This document contains research findings for implementing and validating NFRs for the Code Coverage Summary GitHub Action.

## 1. GitHub Actions Node 20 Runtime

### Key Findings

**Node 20 Lifecycle:**
- Node 20 is currently the recommended runtime for JavaScript actions
- Node 20 EOL: April 2026 (approximately 1 month away)
- GitHub is deprecating Node 20 in favor of Node 24
- Actions should test on Node 24 now to prepare for migration

**Best Practices:**
- Use `runs.using: node20` in action.yml (current standard)
- Test with `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true` environment variable
- Bundle dependencies using `@vercel/ncc` or similar
- Commit bundled dist/ folder for portability
- Use npm ci for reliable dependency installs
- Add Node 24 to test matrix for forward compatibility

**Sources:**
- https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
- https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action
- https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions

### Application to Project

1. Verify action.yml specifies `runs.using: node20`
2. Add Node 24 to test matrix in .github/workflows/test-action.yml
3. Plan migration to Node 24 by Fall 2026 (before Node 20 deprecation)
4. Ensure dist/ folder is committed and bundled correctly

## 2. Cross-Platform Compatibility

### Key Findings

**Platform Differences:**
- Path separators: \ on Windows, / on Unix-like systems
- Line endings: CRLF (\r\n) on Windows, LF (\n) on Unix
- Case sensitivity: Windows is case-insensitive, Unix is case-sensitive
- File system limits vary by platform

**Best Practices:**
- Always use Node.js `path` module (path.join, path.resolve, path.normalize)
- Never use string concatenation for paths
- Use `os.EOL` for platform-specific line endings
- Test on all platforms: ubuntu-latest, windows-latest, macos-latest
- Use matrix strategy in CI for comprehensive testing

**Sources:**
- https://nodejs.org/api/path.html
- https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstrategymatrix
- https://nodejs.org/api/os.html

### Application to Project

1. Audit code for hardcoded path separators or string concatenation
2. Use path module throughout codebase
3. Verify test matrix includes all three platforms
4. Test file discovery glob patterns on all platforms
5. Ensure output formatting is consistent across platforms

## 3. Secure XML Parsing (XXE Prevention)

### Key Findings

**XXE (XML External Entity) Attacks:**
- Exploit XML parsers that resolve external entities
- Can lead to file disclosure, SSRF, DoS
- Prevented by disabling DTD processing and external entity resolution

**fast-xml-parser Security:**
- Does NOT support DTD (Document Type Definition) processing
- Does NOT resolve external entities
- Inherently safe from XXE attacks by design
- No special configuration required

**Best Practices:**
- Use parsers that don't support DTD/external entities (like fast-xml-parser)
- If using other parsers, explicitly disable: DTD processing, external entities, external parameter entities
- Validate XML structure before processing
- Set resource limits to prevent DoS via large files
- Test with known XXE payloads

**Sources:**
- https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html
- https://cwe.mitre.org/data/definitions/611.html
- https://github.com/NaturalIntelligence/fast-xml-parser

### Application to Project

1. Continue using fast-xml-parser (already XXE-safe)
2. Add test fixtures with XXE payloads to verify safety
3. Document XXE prevention in security documentation
4. Add malicious XML test cases (billion laughs, external entities, etc.)
5. Verify parser fails safely with malformed XML

**Example XXE Payload for Testing:**
```xml
<?xml version="1.0"?>
<!DOCTYPE foo [
  <!ENTITY xxe SYSTEM "file:///etc/passwd">
]>
<coverage line-rate="&xxe;" />
```

## 4. GitHub Actions Logging and Debugging

### Key Findings

**Official Logging Methods:**
- `core.info(message)` - Informational messages (always visible)
- `core.debug(message)` - Debug messages (only when ACTIONS_STEP_DEBUG=true)
- `core.warning(message)` - Non-fatal warnings (creates annotation)
- `core.error(message)` - Logs error (does NOT fail step)
- `core.setFailed(message)` - Logs error AND fails step (exit code 1)
- `core.startGroup(name)` / `core.endGroup()` - Collapsible log sections
- `core.group(name, fn)` - Async wrapper for grouped execution

**Debug Logging:**
- Enabled by setting repository secret `ACTIONS_STEP_DEBUG=true`
- Or by re-running workflow with "Enable debug logging" checkbox
- Debug logs should contain diagnostic information not needed in normal runs
- Do not log sensitive data even in debug mode

**Best Practices:**
- Never use console.log() in production code
- Use core.setFailed() for all failure paths (not process.exit())
- Group related operations for cleaner logs
- Include context in error messages (filenames, values, etc.)
- Use core.debug() for internal state and diagnostic info

**Sources:**
- https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
- https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging
- https://github.com/actions/toolkit/tree/main/packages/core

### Application to Project

1. Replace any console.log() with core.info()
2. Add core.debug() for file paths, parsed values, intermediate calculations
3. Use core.setFailed() for all error paths
4. Group file discovery logs with core.startGroup('File Discovery')
5. Group processing logs with core.startGroup('Processing Coverage Files')
6. Test debug logging with ACTIONS_STEP_DEBUG=true

## 5. Test Coverage Strategies

### Key Findings

**Industry Standards:**
- 80% coverage is generally considered good for production code
- 100% coverage is often impractical and can lead to diminishing returns
- Focus on edge cases, error paths, and critical business logic

**Jest Configuration:**
- `coverageThreshold` enforces minimum coverage percentages
- Can specify thresholds globally or per-file pattern
- Thresholds apply to: lines, branches, functions, statements
- Build fails if coverage drops below threshold

**Best Practices:**
- Cover all major code paths and edge cases
- Test error conditions explicitly
- Use representative fixtures that mirror real-world data
- Enforce coverage thresholds in CI to prevent regressions
- Aim for high coverage of critical paths, lower for error handling

**Configuration Example:**
```javascript
module.exports = {
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**Sources:**
- https://jestjs.io/docs/configuration#coveragethreshold-object
- https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#testing-your-action
- https://testing.googleblog.com/2020/08/code-coverage-best-practices.html

### Application to Project

1. Set coverageThreshold in jest.config.js: 80% for all metrics
2. Add tests for all 39 NFR requirements
3. Create comprehensive Cobertura XML fixtures (valid, edge cases, malformed)
4. Test all error paths (no files found, parsing errors, validation failures)
5. Verify coverage threshold is enforced in npm test script

## 6. Deterministic Build Practices

### Key Findings

**npm ci vs npm install:**
- `npm ci` (clean install) respects package-lock.json exactly
- Faster and more reliable than npm install in CI
- Removes node_modules/ before installing
- Fails if package.json and package-lock.json are out of sync
- Use npm ci in CI, npm install for development

**Reproducible Builds:**
- Commit package-lock.json to version control
- Avoid timestamps in output
- Sort output to prevent order variations
- Use explicit locale for number formatting (not system locale)
- Avoid random values or non-deterministic operations

**Best Practices:**
- Always use npm ci in CI pipelines
- Pin dependency versions in package.json
- Use toFixed() or Intl.NumberFormat with explicit locale
- Sort arrays/objects before output
- Test reproducibility by running multiple times

**Sources:**
- https://docs.npmjs.com/cli/v10/commands/npm-ci
- https://reproducible-builds.org/docs/
- https://jestjs.io/docs/timer-mocks
- https://nodejs.org/api/intl.html

### Application to Project

1. Verify package-lock.json is committed
2. Use npm ci in .github/workflows/test-action.yml
3. Audit code for timestamp generation or Date.now()
4. Use explicit formatting for percentages (e.g., toFixed(2))
5. Sort package rows deterministically
6. Add test: run action twice, compare outputs byte-for-byte

## Summary of Recommended Actions

### Immediate (Required for NFR Compliance)

1. **Runtime:**
   - Verify action.yml has `runs.using: node20`
   - Add Node 24 to test matrix

2. **Security:**
   - Add XXE test payload fixtures
   - Verify fast-xml-parser usage is safe

3. **Logging:**
   - Replace console.log() with core.info()
   - Add core.debug() for diagnostics
   - Implement log grouping

4. **Testing:**
   - Add jest.config.js coverageThreshold: 80%
   - Create comprehensive test fixtures
   - Add tests for all NFR requirements

5. **Determinism:**
   - Verify npm ci usage in CI
   - Test output reproducibility
   - Ensure locale-independent formatting

### Short-term (Enhancement)

1. Add security documentation
2. Create NFR traceability matrix
3. Document migration path from Docker/.NET
4. Add Node 24 migration plan

### Long-term (Maintenance)

1. Monitor Node 20 EOL (April 2026)
2. Migrate to Node 24 by Fall 2026
3. Keep dependencies updated
4. Review security advisories regularly

## Web Search Queries Performed

1. "GitHub Actions Node 20 runtime best practices JavaScript actions"
2. "cross-platform JavaScript GitHub Actions path handling"
3. "XXE prevention XML parsing Node.js fast-xml-parser"
4. "GitHub Actions logging debugging ACTIONS_STEP_DEBUG"
5. "Jest test coverage threshold best practices"
6. "deterministic builds npm ci reproducible"

## References

### Official GitHub Documentation
- Creating a JavaScript action: https://docs.github.com/en/actions/tutorials/create-actions/create-a-javascript-action
- Action metadata syntax: https://docs.github.com/en/actions/creating-actions/metadata-syntax-for-github-actions
- Workflow commands: https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
- Enabling debug logging: https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/enabling-debug-logging
- Workflow syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

### GitHub Actions Toolkit
- @actions/core: https://github.com/actions/toolkit/tree/main/packages/core
- @actions/glob: https://github.com/actions/toolkit/tree/main/packages/glob
- Toolkit repository: https://github.com/actions/toolkit

### Node.js Documentation
- Path module: https://nodejs.org/api/path.html
- OS module: https://nodejs.org/api/os.html
- Intl API: https://nodejs.org/api/intl.html

### Security
- OWASP XXE Prevention: https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html
- CWE-611 (XXE): https://cwe.mitre.org/data/definitions/611.html
- fast-xml-parser: https://github.com/NaturalIntelligence/fast-xml-parser

### Testing
- Jest configuration: https://jestjs.io/docs/configuration
- Jest coverage: https://jestjs.io/docs/configuration#coveragethreshold-object
- Timer mocks: https://jestjs.io/docs/timer-mocks

### Dependencies
- npm ci: https://docs.npmjs.com/cli/v10/commands/npm-ci
- Reproducible builds: https://reproducible-builds.org/docs/

### Additional Resources
- Node 20 deprecation: https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/
- Google testing blog on coverage: https://testing.googleblog.com/2020/08/code-coverage-best-practices.html
