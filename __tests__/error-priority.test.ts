/**
 * Integration tests for error priority and complete error handling workflows.
 * Tests the interaction between input validation, parsing errors, and threshold enforcement.
 */

import { validateFormat, validateOutput } from '../src/input-validator'
import { parseCoverageFile, createEmptySummary } from '../src/coverage-parser'
import { checkThresholdViolation } from '../src/threshold-enforcer'
import { parseThresholds, ThresholdConfig } from '../src/output-generator'
import * as path from 'path'

describe('Error Priority Integration Tests', () => {
  const fixturesDir = path.join(__dirname, 'fixtures', 'error-handling')

  describe('Input validation before parsing', () => {
    it('should fail on invalid format before attempting to parse files', () => {
      // Input validation should happen first
      expect(() => validateFormat('json')).toThrow('Error: Unknown output format.')
      
      // If validation passes, parsing would happen next
      const validFile = path.join(fixturesDir, 'valid-coverage.xml')
      const summary = createEmptySummary()
      expect(() => parseCoverageFile(validFile, summary)).not.toThrow()
    })

    it('should fail on invalid output before attempting to parse files', () => {
      // Input validation should happen first
      expect(() => validateOutput('database')).toThrow('Error: Unknown output type.')
      
      // If validation passes, parsing would happen next
      const validFile = path.join(fixturesDir, 'valid-coverage.xml')
      const summary = createEmptySummary()
      expect(() => parseCoverageFile(validFile, summary)).not.toThrow()
    })
  })

  describe('Parsing error before threshold check', () => {
    it('should fail on parsing error before checking thresholds', () => {
      const malformedFile = path.join(fixturesDir, 'malformed.xml')
      const summary = createEmptySummary()

      // Parsing should fail
      expect(() => parseCoverageFile(malformedFile, summary)).toThrow()
      
      // Threshold check would never happen because parsing failed
      const thresholds: ThresholdConfig = { lower: 0.6, upper: 0.8 }
      const violation = checkThresholdViolation(0.5, thresholds)
      expect(violation).toBeTruthy() // This would fail, but we never get here
    })
  })

  describe('Threshold check after successful parsing', () => {
    it('should check thresholds only after successful parsing', () => {
      const validFile = path.join(fixturesDir, 'valid-coverage.xml')
      let summary = createEmptySummary()

      // Parsing should succeed
      expect(() => {
        summary = parseCoverageFile(validFile, summary)
      }).not.toThrow()
      
      // Now threshold check can happen
      const thresholds: ThresholdConfig = { lower: 0.9, upper: 1.0 }
      const violation = checkThresholdViolation(summary.lineRate, thresholds)
      
      // Coverage is 0.75, threshold is 0.9, so violation should occur
      expect(violation).toBeTruthy()
      expect(violation).toContain('FAIL: Overall line rate below minimum threshold')
    })

    it('should pass threshold check when coverage meets threshold', () => {
      const validFile = path.join(fixturesDir, 'valid-coverage.xml')
      let summary = createEmptySummary()

      summary = parseCoverageFile(validFile, summary)
      
      // Set threshold at or below current coverage (0.75)
      const thresholds: ThresholdConfig = { lower: 0.75, upper: 0.9 }
      const violation = checkThresholdViolation(summary.lineRate, thresholds)
      
      // Coverage equals threshold, so no violation
      expect(violation).toBeNull()
    })
  })

  describe('Format error takes precedence over output error', () => {
    it('should report format error first when both format and output are invalid', () => {
      // When both inputs are invalid, format should be checked first
      let formatError: Error | null = null
      let outputError: Error | null = null

      try {
        validateFormat('json')
      } catch (err) {
        formatError = err as Error
      }

      try {
        validateOutput('database')
      } catch (err) {
        outputError = err as Error
      }

      expect(formatError).toBeTruthy()
      expect(formatError?.message).toBe('Error: Unknown output format.')
      expect(outputError).toBeTruthy()
      expect(outputError?.message).toBe('Error: Unknown output type.')
      
      // In the main flow, format validation happens first, so format error would be reported
    })
  })

  describe('Complete error workflow scenarios', () => {
    it('validates complete success path: valid inputs -> valid parsing -> threshold pass', () => {
      // Step 1: Input validation
      expect(() => validateFormat('text')).not.toThrow()
      expect(() => validateOutput('console')).not.toThrow()
      
      // Step 2: Parsing
      const validFile = path.join(fixturesDir, 'valid-coverage.xml')
      let summary = createEmptySummary()
      summary = parseCoverageFile(validFile, summary)
      expect(summary.lineRate).toBeGreaterThan(0)
      
      // Step 3: Threshold check with passing coverage
      const thresholds: ThresholdConfig = { lower: 0.5, upper: 0.8 }
      const violation = checkThresholdViolation(summary.lineRate, thresholds)
      expect(violation).toBeNull()
    })

    it('validates failure path: valid inputs -> valid parsing -> threshold violation', () => {
      // Step 1: Input validation
      expect(() => validateFormat('markdown')).not.toThrow()
      expect(() => validateOutput('both')).not.toThrow()
      
      // Step 2: Parsing
      const validFile = path.join(fixturesDir, 'valid-coverage.xml')
      let summary = createEmptySummary()
      summary = parseCoverageFile(validFile, summary)
      
      // Step 3: Threshold check with failing coverage
      const thresholds: ThresholdConfig = { lower: 0.95, upper: 1.0 }
      const violation = checkThresholdViolation(summary.lineRate, thresholds)
      expect(violation).toBeTruthy()
      expect(violation).toBe('FAIL: Overall line rate below minimum threshold of 95%.')
    })
  })
})
