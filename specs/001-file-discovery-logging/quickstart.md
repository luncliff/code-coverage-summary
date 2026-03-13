# Quickstart: File discovery and diagnostic logging

**Spec**: `/specs/001-file-discovery-logging/spec.md`

## Workflow Example

```yaml
name: Coverage Summary
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage/**/*.xml, reports/coverage.xml'
          format: 'markdown'
          output: 'console'
```

## Expected Behavior

- The action treats `filename` as a comma-separated list, trimming whitespace and ignoring empty entries.
- Patterns are evaluated relative to the workspace and follow `@actions/glob` rules (globstar, excludes, comments, tilde expansion).
- Each matched file emits one log line:

```text
Coverage File: coverage/unit/coverage.xml
Coverage File: coverage/integration/coverage.xml
Coverage File: reports/coverage.xml
```

- If no files match, the step fails with:

```text
Error: No files found matching glob pattern.
```

## Deterministic Ordering Check

To validate deterministic ordering, re-run the workflow without changing the workspace contents and confirm the `Coverage File:` lines appear in the same order.
