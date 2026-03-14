# Quickstart: Error Handling and Failure Messages

**Spec**: `/specs/005-error-handling/spec.md`

## Workflow Examples

### Example 1: Invalid Format Input

```yaml
name: Coverage with Invalid Format
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.xml'
          format: 'json'  # Invalid - only 'text', 'md', 'markdown' allowed
          output: 'console'
```

**Expected Output**:
```text
Error: Unknown output format.
```

**Step Result**: ❌ Failed

---

### Example 2: Invalid Output Type

```yaml
name: Coverage with Invalid Output
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.xml'
          format: 'markdown'
          output: 'somewhere'  # Invalid - only 'console', 'file', 'both' allowed
```

**Expected Output**:
```text
Error: Unknown output type.
```

**Step Result**: ❌ Failed

---

### Example 3: Parsing Error with Malformed XML

```yaml
name: Coverage with Malformed File
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'tests/malformed.xml'
          format: 'text'
          output: 'console'
```

**Expected Output** (example):
```text
Coverage File: tests/malformed.xml
Parsing Error: Invalid XML structure - tests/malformed.xml
```

**Step Result**: ❌ Failed

---

### Example 4: Threshold Enforcement - Coverage Below Minimum

```yaml
name: Coverage with Quality Gate
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.xml'
          format: 'markdown'
          output: 'console'
          thresholds: '60 80'
          fail_below_min: 'true'
```

**Expected Output** (when line rate is 45%):
```markdown
# Code Coverage Summary

Line Rate: 45%
_Minimum allowed line rate is 60%_

FAIL: Overall line rate below minimum threshold of 60%.
```

**Step Result**: ❌ Failed

---

### Example 5: Threshold Enforcement - Coverage Meets Minimum

```yaml
name: Coverage with Quality Gate (Passing)
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.xml'
          format: 'text'
          output: 'console'
          thresholds: '60 80'
          fail_below_min: 'true'
```

**Expected Output** (when line rate is 75%):
```text
Code Coverage Summary
Line Rate: 75%
Minimum allowed line rate is 60%
```

**Step Result**: ✅ Success

---

### Example 6: Threshold Annotation Without Enforcement

```yaml
name: Coverage Without Quality Gate
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage.xml'
          format: 'text'
          output: 'console'
          thresholds: '60 80'
          fail_below_min: 'false'  # Or any value except 'true'
```

**Expected Output** (even if line rate is 45%):
```text
Code Coverage Summary
Line Rate: 45%
```

**Note**: No "Minimum allowed line rate" annotation appears.

**Step Result**: ✅ Success (does not fail despite low coverage)

---

### Example 7: Multiple Files - One Fails Parsing

```yaml
name: Multi-file Coverage with Error
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run coverage summary
        uses: ./
        with:
          filename: 'coverage/unit.xml, coverage/integration.xml, coverage/broken.xml'
          format: 'markdown'
          output: 'console'
```

**Expected Output**:
```text
Coverage File: coverage/unit.xml
Coverage File: coverage/integration.xml
Coverage File: coverage/broken.xml
Parsing Error: Missing required attribute 'line-rate' - coverage/broken.xml
```

**Step Result**: ❌ Failed

**Note**: Processing stops at first parsing error (fail-fast behavior)

---

## Error Detection Quick Reference

| Error Type | When Detected | Error Message Format | Step Fails? |
|------------|---------------|---------------------|-------------|
| Invalid format | Before processing | `"Error: Unknown output format."` | Yes |
| Invalid output | Before processing | `"Error: Unknown output type."` | Yes |
| Parsing failure | During file parsing | `"Parsing Error: [message] - [filename]"` | Yes |
| Threshold violation | After report generation | `"FAIL: Overall line rate below minimum threshold of [X]%."` | Yes (only if `fail_below_min: 'true'`) |

## Debugging Tips

### Identifying Which Coverage File Failed

When processing multiple coverage files, look for the filename in the error message:
```text
Coverage File: tests/unit/coverage.xml
Coverage File: tests/integration/coverage.xml
Parsing Error: Invalid XML structure - tests/integration/coverage.xml
```
The file `tests/integration/coverage.xml` is the problematic one.

### Understanding Threshold Failures

If you see the "FAIL: Overall line rate below minimum threshold" message:
1. Check the summary line rate in the report (appears before the failure message)
2. Compare it to the lower threshold value in the error message
3. The line rate must be **equal to or above** the threshold to pass

Boundary case: 60% coverage with 60% threshold = **PASS** ✅

### Testing Error Messages in Development

To verify exact error message compatibility:
1. Intentionally provide invalid inputs
2. Check that error messages match exactly (including punctuation)
3. Verify step fails with exit code 1

## Validation Checklist

- [ ] Invalid `format` values produce "Error: Unknown output format."
- [ ] Invalid `output` values produce "Error: Unknown output type."
- [ ] Parsing errors include the filename in format "Parsing Error: [msg] - [file]"
- [ ] Threshold annotation appears when `fail_below_min: 'true'`
- [ ] Text reports use plain text annotation format
- [ ] Markdown reports use italic annotation format (`_text_`)
- [ ] Coverage below threshold fails with "FAIL: Overall line rate below minimum threshold of [X]%."
- [ ] Coverage equal to threshold succeeds (no false positive)
- [ ] Coverage above threshold succeeds
- [ ] Threshold enforcement disabled when `fail_below_min` is not "true"
