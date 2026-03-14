# Quickstart: Output Destination (006)

**Spec**: `specs/006-output-destination/spec.md`

## Workflow Examples

### Example 1: Console output (default)

```yaml
name: Coverage Summary (Console)
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.cobertura.xml'
          format: 'text'
          output: 'console'
```

**Expected behavior**:
- Report appears in the action log
- No `code-coverage-results.*` file is created

---

### Example 2: File output

```yaml
name: Coverage Summary (File)
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.cobertura.xml'
          format: 'markdown'
          output: 'file'

      - name: Verify report file exists
        run: test -f code-coverage-results.md
```

**Expected behavior**:
- `code-coverage-results.md` is created in the workspace root
- The report content is not printed to the log (beyond normal diagnostic lines like discovered coverage files)

---

### Example 3: Both output

```yaml
name: Coverage Summary (Both)
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.cobertura.xml'
          format: 'text'
          output: 'both'

      - name: Verify report file exists
        run: test -f code-coverage-results.txt
```

**Expected behavior**:
- Report appears in the action log
- `code-coverage-results.txt` is created in the workspace root

---

### Example 4: Invalid output type (fails)

```yaml
name: Coverage Summary (Invalid Output)
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.cobertura.xml'
          format: 'text'
          output: 'database'
```

**Expected log message**:
```text
Error: Unknown output type.
```

**Step result**: ❌ Failed

## Validation Checklist

- [ ] `output=console` prints report and creates no file
- [ ] `output=file` writes the correct legacy filename and does not print the report
- [ ] `output=both` prints and writes the correct legacy filename
- [ ] Invalid `output` fails with `Error: Unknown output type.`
