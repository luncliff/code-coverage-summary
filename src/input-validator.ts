/**
 * Input validation functions for GitHub Action inputs.
 * Validates format and output values against allowed options.
 */

const VALID_FORMATS = ['text', 'md', 'markdown']
const VALID_OUTPUTS = ['console', 'file', 'both']

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
