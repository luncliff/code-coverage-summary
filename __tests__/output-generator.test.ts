import {
  parseThresholds,
  generateBadgeUrl,
  generateTextOutput,
  generateMarkdownOutput,
  OutputOptions,
  ThresholdConfig
} from '../src/output-generator'
import { CoverageSummary } from '../src/coverage-parser'

function makeSummary(overrides: Partial<CoverageSummary> = {}): CoverageSummary {
  return {
    lineRate: 0.83,
    branchRate: 0.69,
    linesCovered: 1212,
    linesValid: 1460,
    branchesCovered: 262,
    branchesValid: 378,
    complexity: 671,
    packages: [
      { name: 'MyPackage', lineRate: 0.83, branchRate: 0.69, complexity: 671 }
    ],
    ...overrides
  }
}

function makeOptions(overrides: Partial<OutputOptions> = {}): OutputOptions {
  const thresholds: ThresholdConfig = { lower: 0.5, upper: 0.75 }
  return {
    badgeUrl: null,
    indicators: true,
    hideBranchRate: false,
    hideComplexity: false,
    thresholds,
    failBelowMin: false,
    ...overrides
  }
}

describe('parseThresholds', () => {
  test('parses two-value threshold string', () => {
    const t = parseThresholds('60 80')
    expect(t.lower).toBeCloseTo(0.6, 5)
    expect(t.upper).toBeCloseTo(0.8, 5)
  })

  test('parses single-value threshold string', () => {
    const t = parseThresholds('50')
    expect(t.lower).toBeCloseTo(0.5, 5)
    expect(t.upper).toBeCloseTo(0.75, 5)
  })

  test('clamps lower threshold to 1.0', () => {
    const t = parseThresholds('150')
    expect(t.lower).toBe(1.0)
  })

  test('adjusts upper when lower exceeds upper', () => {
    const t = parseThresholds('90 70')
    expect(t.lower).toBeCloseTo(0.9, 5)
    expect(t.upper).toBeCloseTo(1.0, 5)
  })

  test('throws on invalid input', () => {
    expect(() => parseThresholds('')).toThrow()
    expect(() => parseThresholds('abc')).toThrow()
  })
})

describe('generateBadgeUrl', () => {
  const thresholds: ThresholdConfig = { lower: 0.5, upper: 0.75 }

  test('returns critical badge when below lower threshold', () => {
    const summary = makeSummary({ lineRate: 0.4 })
    expect(generateBadgeUrl(summary, thresholds)).toContain('critical')
  })

  test('returns yellow badge when between thresholds', () => {
    const summary = makeSummary({ lineRate: 0.6 })
    expect(generateBadgeUrl(summary, thresholds)).toContain('yellow')
  })

  test('returns success badge when above upper threshold', () => {
    const summary = makeSummary({ lineRate: 0.9 })
    expect(generateBadgeUrl(summary, thresholds)).toContain('success')
  })

  test('includes correct coverage percentage', () => {
    const summary = makeSummary({ lineRate: 0.83 })
    expect(generateBadgeUrl(summary, thresholds)).toContain('83')
  })
})

describe('generateTextOutput', () => {
  test('contains package name and line rate', () => {
    const text = generateTextOutput(makeSummary(), makeOptions())
    expect(text).toContain('MyPackage')
    expect(text).toContain('83%')
  })

  test('contains summary line', () => {
    const text = generateTextOutput(makeSummary(), makeOptions())
    expect(text).toContain('Summary:')
    expect(text).toContain('1212')
    expect(text).toContain('1460')
  })

  test('includes badge URL when provided', () => {
    const opts = makeOptions({ badgeUrl: 'https://example.com/badge.svg' })
    const text = generateTextOutput(makeSummary(), opts)
    expect(text).toContain('https://example.com/badge.svg')
  })

  test('hides branch rate when configured', () => {
    const opts = makeOptions({ hideBranchRate: true })
    const text = generateTextOutput(makeSummary(), opts)
    expect(text).not.toContain('Branch Rate')
  })

  test('hides complexity when configured', () => {
    const opts = makeOptions({ hideComplexity: true })
    const text = generateTextOutput(makeSummary(), opts)
    expect(text).not.toContain('Complexity')
  })

  test('includes health indicators when enabled', () => {
    const opts = makeOptions({ indicators: true })
    const text = generateTextOutput(makeSummary(), opts)
    expect(text).toMatch(/[❌➖✔]/)
  })

  test('includes fail threshold message when failBelowMin is true', () => {
    const opts = makeOptions({ failBelowMin: true })
    const text = generateTextOutput(makeSummary(), opts)
    expect(text).toContain('Minimum allowed line rate is')
  })
})

describe('generateMarkdownOutput', () => {
  test('contains markdown table header', () => {
    const text = generateMarkdownOutput(makeSummary(), makeOptions())
    expect(text).toContain('Package | Line Rate')
    expect(text).toContain('-------- | ---------')
  })

  test('contains bold Summary row', () => {
    const text = generateMarkdownOutput(makeSummary(), makeOptions())
    expect(text).toContain('**Summary**')
  })

  test('includes badge image when provided', () => {
    const opts = makeOptions({ badgeUrl: 'https://example.com/badge.svg' })
    const text = generateMarkdownOutput(makeSummary(), opts)
    expect(text).toContain('![Code Coverage](https://example.com/badge.svg)')
  })

  test('hides branch rate column when configured', () => {
    const opts = makeOptions({ hideBranchRate: true })
    const text = generateMarkdownOutput(makeSummary(), opts)
    expect(text).not.toContain('Branch Rate')
  })

  test('hides complexity column when configured', () => {
    const opts = makeOptions({ hideComplexity: true })
    const text = generateMarkdownOutput(makeSummary(), opts)
    expect(text).not.toContain('Complexity')
  })

  test('includes fail threshold note when failBelowMin is true', () => {
    const opts = makeOptions({ failBelowMin: true })
    const text = generateMarkdownOutput(makeSummary(), opts)
    expect(text).toContain('_Minimum allowed line rate is')
  })
})
