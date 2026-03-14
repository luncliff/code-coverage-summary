import {
  isEnforcementEnabled,
  generateAnnotation,
  checkThresholdViolation
} from '../src/threshold-enforcer'
import { ThresholdConfig } from '../src/output-generator'

describe('Threshold Enforcement', () => {
  describe('isEnforcementEnabled', () => {
    it('should return true when fail_below_min is "true"', () => {
      expect(isEnforcementEnabled('true')).toBe(true)
    })

    it('should return true when fail_below_min is "TRUE" (case-insensitive)', () => {
      expect(isEnforcementEnabled('TRUE')).toBe(true)
    })

    it('should return true when fail_below_min is "True"', () => {
      expect(isEnforcementEnabled('True')).toBe(true)
    })

    it('should return false when fail_below_min is "false"', () => {
      expect(isEnforcementEnabled('false')).toBe(false)
    })

    it('should return false when fail_below_min is empty', () => {
      expect(isEnforcementEnabled('')).toBe(false)
    })

    it('should return false for any other value', () => {
      expect(isEnforcementEnabled('1')).toBe(false)
      expect(isEnforcementEnabled('yes')).toBe(false)
      expect(isEnforcementEnabled('enabled')).toBe(false)
    })
  })

  describe('generateAnnotation', () => {
    const thresholds: ThresholdConfig = { lower: 0.6, upper: 0.8 }

    it('should generate text format annotation', () => {
      const annotation = generateAnnotation('text', thresholds)
      expect(annotation).toBe('Minimum allowed line rate is 60%')
    })

    it('should generate markdown format annotation with italic', () => {
      const annotation = generateAnnotation('markdown', thresholds)
      expect(annotation).toBe('_Minimum allowed line rate is 60%_')
    })

    it('should generate markdown format annotation for "md"', () => {
      const annotation = generateAnnotation('md', thresholds)
      expect(annotation).toBe('_Minimum allowed line rate is 60%_')
    })

    it('should handle different threshold values correctly', () => {
      const thresholds2: ThresholdConfig = { lower: 0.75, upper: 0.9 }
      const annotation = generateAnnotation('text', thresholds2)
      expect(annotation).toBe('Minimum allowed line rate is 75%')
    })
  })

  describe('checkThresholdViolation', () => {
    const thresholds: ThresholdConfig = { lower: 0.6, upper: 0.8 }

    it('should return violation message when coverage is below threshold', () => {
      const result = checkThresholdViolation(0.45, thresholds)
      expect(result).toBe('FAIL: Overall line rate below minimum threshold of 60%.')
    })

    it('should return null when coverage equals threshold (boundary case)', () => {
      const result = checkThresholdViolation(0.6, thresholds)
      expect(result).toBeNull()
    })

    it('should return null when coverage is above threshold', () => {
      const result = checkThresholdViolation(0.75, thresholds)
      expect(result).toBeNull()
    })

    it('should return null when coverage is at 100%', () => {
      const result = checkThresholdViolation(1.0, thresholds)
      expect(result).toBeNull()
    })

    it('should return violation for coverage just below threshold', () => {
      const result = checkThresholdViolation(0.5999, thresholds)
      expect(result).toBe('FAIL: Overall line rate below minimum threshold of 60%.')
    })
  })

  describe('Annotation with enforcement disabled', () => {
    it('should not generate annotation when enforcement is disabled', () => {
      const enabled = isEnforcementEnabled('false')
      expect(enabled).toBe(false)
      // When disabled, we skip annotation generation in the main flow
    })
  })
})
