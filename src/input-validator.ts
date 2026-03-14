/**
 * Input validation functions for GitHub Action inputs.
 * Validates format and output values against allowed options.
 */

const VALID_FORMATS = ['text', 'md', 'markdown']
const VALID_OUTPUTS = ['console', 'file', 'both']
const VALID_BOOLEANS = ['true', 'false']

/**
 * Validates the format input value.
 * @param format - The format value to validate
 * @throws Error with exact message "Error: Unknown output format." if invalid
 */
export function validateFormat(format: string): void {
  if (!VALID_FORMATS.includes(format)) {
    throw new Error('Error: Unknown output format.')
  }
}

/**
 * Validates the output input value.
 * @param output - The output value to validate
 * @throws Error with exact message "Error: Unknown output type." if invalid
 */
export function validateOutput(output: string): void {
  if (!VALID_OUTPUTS.includes(output)) {
    throw new Error('Error: Unknown output type.')
  }
}

/**
 * Validates boolean input values.
 * @param value - The boolean string to validate
 * @param name - The name of the input (for error messages)
 * @throws Error if value is not 'true' or 'false'
 */
export function validateBoolean(value: string, name: string): void {
  if (!VALID_BOOLEANS.includes(value.toLowerCase())) {
    throw new Error(`Error: ${name} must be 'true' or 'false'.`)
  }
}

/**
 * Validates all action inputs.
 * @param inputs - Object containing all input values
 * @throws Error if any input is invalid
 */
export interface ActionInputs {
  filename: string
  badge?: string
  fail_below_min?: string
  format?: string
  hide_branch_rate?: string
  hide_complexity?: string
  indicators?: string
  output?: string
  thresholds?: string
}

export function validateInputs(inputs: ActionInputs): void {
  // Filename is required
  if (!inputs.filename || inputs.filename.trim() === '') {
    throw new Error('Error: filename is required.')
  }

  // Validate filename doesn't contain obvious malicious patterns
  const maliciousPatterns = [
    /';.*DROP/i,  // SQL injection
    /<script/i,   // XSS
    /\$\(/,       // Command injection
    /`.*`/        // Template injection
  ]

  maliciousPatterns.forEach(pattern => {
    if (pattern.test(inputs.filename)) {
      throw new Error('Error: filename contains invalid characters.')
    }
  })

  // Validate format if provided
  if (inputs.format) {
    validateFormat(inputs.format)
  }

  // Validate output if provided
  if (inputs.output) {
    validateOutput(inputs.output)
  }

  // Validate boolean inputs if provided
  if (inputs.badge) {
    validateBoolean(inputs.badge, 'badge')
  }

  if (inputs.fail_below_min) {
    validateBoolean(inputs.fail_below_min, 'fail_below_min')
  }

  if (inputs.hide_branch_rate) {
    validateBoolean(inputs.hide_branch_rate, 'hide_branch_rate')
  }

  if (inputs.hide_complexity) {
    validateBoolean(inputs.hide_complexity, 'hide_complexity')
  }

  if (inputs.indicators) {
    validateBoolean(inputs.indicators, 'indicators')
  }

  // Validate thresholds if provided
  if (inputs.thresholds) {
    const trimmed = inputs.thresholds.trim()
    if (!trimmed) {
      throw new Error('Error: Threshold parameter set incorrectly.')
    }

    const parts = trimmed.split(' ')
    if (parts.length > 2) {
      throw new Error('Error: Threshold parameter set incorrectly.')
    }

    parts.forEach(part => {
      const num = parseInt(part, 10)
      if (isNaN(num)) {
        throw new Error('Error: Threshold parameter set incorrectly.')
      }
    })
  }
}
