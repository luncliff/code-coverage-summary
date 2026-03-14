# Quickstart: Cobertura XML parsing (003)

**Spec**: `specs/003-cobertura-xml-parsing/spec.md`  
**Branch**: `003-cobertura-xml-parsing`

---

## Workflow Example

```yaml
name: Coverage Summary
on: [push]

jobs:
  coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
      - name: Code Coverage Summary
        uses: .
        with:
          filename: 'coverage/**/*.cobertura.xml'
          format: 'markdown'
          output: 'console'
```

## Cobertura XML Expectations

### Minimal valid coverage root

```xml
<coverage line-rate="0.8" lines-covered="80" lines-valid="100">
  <packages>
    <package name="core" line-rate="0.9" branch-rate="0.0" complexity="0" />
  </packages>
</coverage>
```

### Line-only coverage (branch metrics omitted)

```xml
<coverage line-rate="0.75" lines-covered="75" lines-valid="100">
  <packages>
    <package name="utils" line-rate="0.75" />
  </packages>
</coverage>
```

## Expected Behavior

- Files missing any required root attribute (`line-rate`, `lines-covered`, `lines-valid`) fail the step with a parsing error that includes the filename.
- Files that omit branch metrics still parse successfully, and branch output is suppressed when *all* files omit branch data.
- Each `<package>` element yields one report row; unnamed packages fall back to `<basename> Package <i>` and missing numeric attributes default to `0`.

## Quick Validation Checklist

- ✅ A Cobertura file with required root attributes parses without error.
- ✅ A file without branch metrics still produces line-rate output only.
- ✅ A file with no `<package>` elements yields zero package rows but still reports summary metrics.
- ✅ Missing required root attributes fail the step with a filename in the error message.
