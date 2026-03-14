/**
 * Threshold enforcement logic for quality gate failures.
 * Provides annotation generation and violation checking.
 */

import { ThresholdConfig } from './output-generator'

/**
 * Checks if threshold enforcement is enabled.
 * @param failBelowMin - The fail_below_min input value
 * @returns true if enforcement is enabled (case-insensitive "true")
 */
export function isEnforcementEnabled(failBelowMin: string): boolean {
  return failBelowMin.toLowerCase() === 'true'
}

/**
 * Generates the threshold annotation text based on format.
 * @param format - The output format ('text', 'md', or 'markdown')
 * @param thresholds - The threshold configuration
 * @returns The formatted annotation line
 */
export function generateAnnotation(
  format: string,
  thresholds: ThresholdConfig
): string {
  const lowerPct = Math.round(thresholds.lower * 100)
  const annotationText = `Minimum allowed line rate is ${lowerPct}%`

  if (format === 'md' || format === 'markdown') {
    return `_${annotationText}_`
  }
  return annotationText
}

/**
 * Checks if coverage violates the minimum threshold.
 * @param summaryLineRate - The actual line rate (0-1)
 * @param thresholds - The threshold configuration
 * @returns Failure message if violated, null if passes
 */
export function checkThresholdViolation(
  summaryLineRate: number,
  thresholds: ThresholdConfig
): string | null {
  if (summaryLineRate < thresholds.lower) {
    const lowerPct = Math.round(thresholds.lower * 100)
    return `FAIL: Overall line rate below minimum threshold of ${lowerPct}%.`
  }
  return null
}
