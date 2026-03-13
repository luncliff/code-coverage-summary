# Quickstart: Action Contract Inputs (002)

**Feature**: Fix `indicators` boolean parsing + input-contract test suite  
**Branch**: `copilot/002-action-input-contract`

---

## What changed

A single-line bug fix in `src/index.ts`:

```diff
- const indicators = core.getInput('indicators').toLowerCase() !== 'false'
+ const indicators = core.getInput('indicators').toLowerCase() === 'true'
```

**Why**: Before the fix, any value that was not `"false"` (including `"1"`, `"yes"`,
`"on"`, or an empty string) would silently enable health indicators. The fix aligns
`indicators` with every other boolean-like input and with FR-006.

---

## For workflow authors

### What stays the same

All nine input names, their defaults, and all normal usage patterns are unchanged:

```yaml
- uses: irongut/CodeCoverageSummary@v2
  with:
    filename: '**/coverage.cobertura.xml'
    # badge, fail_below_min, format, hide_branch_rate, hide_complexity,
    # indicators, output, thresholds — all defaults preserved
```

### Boolean inputs — recommended usage

Pass `'true'` or `'false'` (case-insensitive). Avoid `'1'`, `'yes'`, `'on'` —
they are explicitly treated as `false`.

```yaml
# ✅ Correct — works before and after the fix
- uses: irongut/CodeCoverageSummary@v2
  with:
    filename: '**/coverage.cobertura.xml'
    indicators: 'true'
    badge: 'true'
    fail_below_min: 'true'
    thresholds: '60 80'

# ⚠️  Was silently true before the fix; now correctly false
- uses: irongut/CodeCoverageSummary@v2
  with:
    filename: '**/coverage.cobertura.xml'
    indicators: '1'   # ← was true before fix; is false after fix
```

### Impact on existing workflows

Workflows that pass `indicators: 'false'` (to disable) or `indicators: 'true'` (to
enable, or rely on the default) are **unaffected**.

The only workflows that change behavior are those that pass a non-standard truthy string
(like `'1'`, `'yes'`, `'on'`) to `indicators` expecting it to enable health indicators.
Such usage was undocumented and unsupported.

---

## For developers

### Running tests

```bash
npm test
```

### Running a single test file

```bash
npx jest __tests__/index.test.ts
```

### Building the bundle

```bash
npm run build
```

The `dist/index.js` bundle must be rebuilt and committed before the action change takes
effect on GitHub-hosted runners.

---

## Minimal workflow example

```yaml
name: Coverage Summary
on: [push]
jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run tests and generate coverage
        run: dotnet test --collect:"XPlat Code Coverage"

      - name: Code Coverage Summary
        uses: irongut/CodeCoverageSummary@v2
        with:
          filename: '**/coverage.cobertura.xml'
          badge: 'true'
          fail_below_min: 'true'
          format: markdown
          hide_branch_rate: 'false'
          hide_complexity: 'true'
          indicators: 'true'
          output: both
          thresholds: '60 80'

      - name: Add PR comment
        uses: marocchino/sticky-pull-request-comment@v2
        if: github.event_name == 'pull_request'
        with:
          recreate: true
          path: code-coverage-results.md
```
