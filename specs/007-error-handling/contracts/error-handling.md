# Contract: Error Handling and Failure Messages

**Spec**: `/specs/005-error-handling/spec.md`  
**Scope**: Input validation, parsing error reporting, and threshold enforcement failure behavior

## Input Validation Contract

### Inputs Subject to Validation

#### `format` (required)

- **Type**: string
- **Valid values**: `'text'`, `'md'`, `'markdown'`
- **Validation timing**: Immediately after input retrieval, before any file processing
- **Failure behavior**: 
  - **Condition**: Value is not one of the valid values
  - **Error message**: Exactly `"Error: Unknown output format."`
  - **Step result**: Failed (exit code 1)
  - **Mechanism**: `core.setFailed()`

#### `output` (required)

- **Type**: string
- **Valid values**: `'console'`, `'file'`, `'both'`
- **Validation timing**: Immediately after input retrieval, before any file processing
- **Failure behavior**:
  - **Condition**: Value is not one of the valid values
  - **Error message**: Exactly `"Error: Unknown output type."`
  - **Step result**: Failed (exit code 1)
  - **Mechanism**: `core.setFailed()`

#### `fail_below_min` (optional)

- **Type**: string
- **Interpretation**: Case-insensitive check for `"true"` to enable enforcement
- **Default behavior**: Enforcement disabled if not "true"
- **No validation error**: Invalid values are treated as false (enforcement disabled)

### Validation Order

If both `format` and `output` are invalid, the action MUST report the format error first and fail immediately (no report of output error in same run).

## Parsing Error Contract

### Behavior

When coverage file parsing fails for any reason:

1. **Construct error message** in exact format: `"Parsing Error: ${descriptiveMessage} - ${filename}"`
   - `${descriptiveMessage}`: Clear explanation of what went wrong (e.g., "Invalid XML structure", "Missing required attribute 'line-rate'")
   - `${filename}`: Full path to the file that failed (must match the path logged in "Coverage File: " line)

2. **Log and fail** using `core.setFailed(errorMessage)`

3. **Step result**: Failed (exit code 1)

### Examples

Valid parsing error messages:
- `"Parsing Error: Invalid XML structure - coverage/unit/malformed.xml"`
- `"Parsing Error: Missing required attribute 'line-rate' - tests/coverage.xml"`
- `"Parsing Error: Root element 'coverage' not found - output.xml"`

### Multi-file Behavior

When processing multiple coverage files:
- Parsing continues file-by-file until first error
- First parsing error stops all processing (fail-fast)
- Error message identifies the specific file that failed

## Threshold Enforcement Contract

### Inputs

#### `fail_below_min`

- **Type**: string
- **Enforcement enabled when**: Value equals `"true"` (case-insensitive)
- **Enforcement disabled when**: Any other value (including empty, "false", "1", etc.)

#### `thresholds`

- **Type**: string
- **Format**: Parsed per SI-D4 rules (separate feature)
- **Usage**: Lower threshold value is used for enforcement

### Behavior When Enforcement Enabled

#### Report Annotation (Always Added)

The generated report MUST include a minimum threshold annotation line:

**Text format reports**:
```
Minimum allowed line rate is ${lowerThreshold}%
```

**Markdown format reports**:
```markdown
_Minimum allowed line rate is ${lowerThreshold}%_
```

- Annotation appears regardless of whether coverage passes or fails threshold
- Annotation timing: Added during report generation, before output

#### Threshold Violation Check (After Report Generation)

**Condition**: `summaryLineRate < lowerThreshold`

**Failure behavior**:
- **Error message**: Exactly `"FAIL: Overall line rate below minimum threshold of ${lowerThreshold}%."`
- **Step result**: Failed (exit code 1)
- **Mechanism**: `core.setFailed()`
- **Timing**: After report is fully generated and output

**Success condition**: `summaryLineRate >= lowerThreshold`
- Step succeeds (no failure)
- Report was still annotated with threshold

### Behavior When Enforcement Disabled

- No threshold annotation in reports
- No threshold violation check
- Step succeeds regardless of coverage level

### Threshold Comparison Details

- **Summary line rate**: Computed per SI-D2 (unweighted average of file line rates)
- **Comparison**: Strictly less-than (`<`), not less-than-or-equal
- **Boundary case**: If coverage exactly equals threshold (e.g., 60% with 60% threshold), step succeeds

## Error Priority and Execution Order

Errors are checked in strict order:

1. **Input Validation** → Checked first, before any processing
   - If invalid: Fail immediately
   - If valid: Continue to file discovery

2. **Parsing Errors** → Checked during file processing
   - If parsing fails: Fail immediately (fail-fast)
   - If parsing succeeds: Continue to report generation

3. **Threshold Violations** → Checked last, after successful report generation
   - If enabled and violated: Fail after report output
   - If not enabled or not violated: Succeed

## Outputs

This feature does not introduce new action outputs. Existing action outputs remain unchanged.

## Failure Mechanism

All failures MUST use the official GitHub Actions mechanism:
- **Method**: `@actions/core.setFailed(message)`
- **Effect**: Sets step exit code to 1, logs error with `::error::` annotation, stops workflow step

## Compatibility Notes

- All error messages match exact legacy implementation text
- Message format changes are breaking changes (require major version bump)
- Existing workflows parsing logs will continue to work
- Error messages are deterministic (same inputs = same messages)
