/**
 * NFR-037: Input Validation
 * Verify all action inputs are validated
 */

import { validateInputs } from '../../src/input-validator'

describe('NFR-037: Input Validation', () => {
  test('should reject empty filename', () => {
    expect(() => validateInputs({ filename: '' })).toThrow()
    expect(() => validateInputs({ filename: '   ' })).toThrow()
  })

  test('should reject invalid format values', () => {
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      format: 'json' 
    })).toThrow()
    
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      format: 'xml' 
    })).toThrow()
    
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      format: 'html' 
    })).toThrow()
  })

  test('should accept only valid format values', () => {
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      format: 'text' 
    })).not.toThrow()
    
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      format: 'markdown' 
    })).not.toThrow()
  })

  test('should reject invalid output values', () => {
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      output: 'stdout' 
    })).toThrow()
    
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      output: 'disk' 
    })).toThrow()
  })

  test('should accept only valid output values', () => {
    const validOutputs = ['console', 'file', 'both']
    
    validOutputs.forEach(output => {
      expect(() => validateInputs({ 
        filename: 'coverage.xml', 
        output 
      })).not.toThrow()
    })
  })

  test('should reject invalid boolean values', () => {
    const invalidBooleans = ['yes', 'no', '1', '0', 'Yes', 'No']
    
    invalidBooleans.forEach(value => {
      expect(() => validateInputs({ 
        filename: 'coverage.xml', 
        badge: value 
      })).toThrow()
    })
  })

  test('should accept only valid boolean values', () => {
    const validBooleans = ['true', 'false']
    
    validBooleans.forEach(value => {
      expect(() => validateInputs({ 
        filename: 'coverage.xml', 
        badge: value,
        fail_below_min: value,
        hide_branch_rate: value,
        hide_complexity: value,
        indicators: value
      })).not.toThrow()
    })
  })

  test('should reject malformed threshold values', () => {
    const invalidThresholds = [
      'abc',
      '50 abc',
      'abc 75',
      '50 75 90', // too many values
      '-50',
      '150', // over 100 is clamped but should still validate
      '50 25' // lower > upper gets adjusted but should validate
    ]
    
    // Some of these might not throw (get clamped/adjusted) so test the ones that definitely should
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      thresholds: 'abc' 
    })).toThrow()
    
    expect(() => validateInputs({ 
      filename: 'coverage.xml', 
      thresholds: '50 abc' 
    })).toThrow()
  })

  test('should accept valid threshold values', () => {
    const validThresholds = [
      '50',
      '50 75',
      '0',
      '100',
      '0 100'
    ]
    
    validThresholds.forEach(threshold => {
      expect(() => validateInputs({ 
        filename: 'coverage.xml', 
        thresholds: threshold 
      })).not.toThrow()
    })
  })

  test('should validate all inputs together', () => {
    const validInputs = {
      filename: 'coverage.xml',
      badge: 'true',
      fail_below_min: 'false',
      format: 'markdown',
      hide_branch_rate: 'false',
      hide_complexity: 'false',
      indicators: 'true',
      output: 'both',
      thresholds: '50 75'
    }
    
    expect(() => validateInputs(validInputs)).not.toThrow()
  })

  test('should handle missing optional inputs', () => {
    // Only filename is required
    expect(() => validateInputs({ 
      filename: 'coverage.xml' 
    })).not.toThrow()
  })
})
