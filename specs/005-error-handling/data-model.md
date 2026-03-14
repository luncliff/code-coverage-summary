# Data Model: Error Handling and Failure Messages

**Spec**: `/specs/005-error-handling/spec.md`

## Entities

### InputValidationError

Represents an error condition when action inputs contain invalid values.

- **Fields**
  - `inputName` (string): Name of the invalid input ('format' or 'output')
  - `providedValue` (string): The actual value that was provided
  - `validValues` (string[]): List of acceptable values
  - `errorMessage` (string): Exact error message to display (legacy-compatible)
- **Validation Rules**
  - `inputName` must be one of the known input names
  - `errorMessage` must exactly match legacy error text:
    - Format errors: "Error: Unknown output format."
    - Output errors: "Error: Unknown output type."
- **State Transitions**
  - Detected → Logged → Step Failed (no recovery path)

### ParsingError

Represents an error condition when coverage file parsing fails.

- **Fields**
  - `filename` (string): Full path to the file that failed parsing (matches "Coverage File:" log)
  - `descriptiveMessage` (string): Human-readable description of what went wrong
  - `underlyingError` (Error | unknown): Original error object from parser (for debugging)
  - `formattedMessage` (string): Final message in format "Parsing Error: ${descriptiveMessage} - ${filename}"
- **Validation Rules**
  - `filename` must be non-empty and match the path being processed
  - `descriptiveMessage` should be clear and actionable (e.g., "Missing required attribute 'line-rate'", "Invalid XML structure")
  - `formattedMessage` must follow exact pattern per FR-G8
- **State Transitions**
  - Parser exception thrown → Error caught → ParsingError constructed → Logged → Step Failed

### ThresholdEnforcementConfig

Represents the configuration for threshold-based quality gate enforcement.

- **Fields**
  - `enabled` (boolean): Whether enforcement is active (derived from fail_below_min input)
  - `lowerThreshold` (number): Minimum allowed line rate percentage (0-100)
  - `upperThreshold` (number): Upper threshold for badge classification (0-100)
  - `summaryLineRate` (number): Actual coverage summary line rate (0-100)
- **Validation Rules**
  - `lowerThreshold` and `upperThreshold` are parsed per SI-D4 rules
  - `summaryLineRate` is computed per SI-D2 (unweighted average)
  - `enabled` is true only when fail_below_min input equals "true" (case-insensitive)
- **State Transitions**
  - Config loaded → Report generated with annotation (if enabled) → Threshold checked (if enabled) → Step fails if below threshold

### ThresholdViolation

Represents a threshold enforcement failure.

- **Fields**
  - `summaryLineRate` (number): Actual line rate achieved
  - `minimumRequired` (number): Lower threshold that must be met
  - `failureMessage` (string): Exact message: "FAIL: Overall line rate below minimum threshold of ${minimumRequired}%."
  - `reportIncludesAnnotation` (boolean): Whether the report was annotated with minimum threshold
- **Validation Rules**
  - `summaryLineRate < minimumRequired` must be true for violation to exist
  - `failureMessage` must match exact legacy text per FR-G17
  - Violation is checked only if `ThresholdEnforcementConfig.enabled` is true
- **State Transitions**
  - Threshold check performed → Violation detected → Message logged → Step Failed

### ReportAnnotation

Represents the threshold annotation added to reports when enforcement is enabled.

- **Fields**
  - `format` ('text' | 'markdown'): Report format type
  - `lowerThreshold` (number): Minimum threshold percentage
  - `annotationText` (string): Formatted annotation line
- **Validation Rules**
  - Text format: `annotationText` = "Minimum allowed line rate is ${lowerThreshold}%"
  - Markdown format: `annotationText` = "_Minimum allowed line rate is ${lowerThreshold}%_"
  - Annotation is added only when `ThresholdEnforcementConfig.enabled` is true
  - Annotation appears regardless of whether coverage passes threshold (FR-G16)
- **State Transitions**
  - Enforcement enabled → Report generation → Annotation inserted → Report output

## Relationships

- `InputValidationError` → triggers → Step Failure (1:1)
- `ParsingError` → triggers → Step Failure (1:1)
- `ThresholdEnforcementConfig` → may create → `ReportAnnotation` (1:0..1, based on enabled flag)
- `ThresholdEnforcementConfig` → may create → `ThresholdViolation` (1:0..1, based on comparison)
- `ReportAnnotation` → inserted into → Report (1:1 when enforcement enabled)
- `ThresholdViolation` → triggers → Step Failure (1:1)

## Validation Flow

```
Input Received
    ↓
InputValidation Check
    ├─ Invalid → InputValidationError → FAIL
    └─ Valid → Continue
         ↓
File Discovery & Parsing
    ├─ Parse Error → ParsingError → FAIL
    └─ Success → Continue
         ↓
Threshold Config Loaded
    ├─ enabled: false → Skip annotation & enforcement
    └─ enabled: true → Continue
         ↓
Report Generation
    ├─ Add ReportAnnotation
    └─ Generate Report
         ↓
Threshold Enforcement Check
    ├─ summaryLineRate < lowerThreshold → ThresholdViolation → FAIL
    └─ summaryLineRate >= lowerThreshold → SUCCESS
```

## Error Priority Order

Based on FR-G21, FR-G22, FR-G23:

1. **Input Validation Errors** (highest priority)
   - Checked before any file processing
   - Format error takes precedence over output error if both are invalid
   
2. **Parsing Errors** (medium priority)
   - Checked during file processing
   - Fail-fast: first parsing error stops processing
   - Filename included for multi-file clarity

3. **Threshold Violations** (lowest priority)
   - Checked only after successful parsing and report generation
   - Does not prevent report output
   - Fails step as final action

## Notes

- All error entities lead to `core.setFailed()` calls with exact legacy message text
- Error messages are deterministic: same input/file state produces same messages (NFR-6)
- Filename paths in ParsingError must match those logged in "Coverage File:" lines (FR-G11)
- ThresholdEnforcementConfig depends on SI-D4 (threshold parsing) and SI-D2 (summary rate calculation)
- No error recovery or retry logic: all errors are terminal and fail the step immediately
