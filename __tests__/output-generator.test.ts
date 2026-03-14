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
    branchMetricsPresent: true,
    fileCount: 1,
    branchFileCount: 1,
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

  test('clamps negative and out-of-range thresholds', () => {
    const t = parseThresholds('-10 120')
    expect(t.lower).toBe(0)
    expect(t.upper).toBe(1.0)
  })

  test('adjusts upper when lower exceeds upper', () => {
    const t = parseThresholds('90 70')
    expect(t.lower).toBeCloseTo(0.9, 5)
    expect(t.upper).toBeCloseTo(1.0, 5)
  })

  test('adjusts upper after clamping when lower exceeds upper', () => {
    const t = parseThresholds('95 20')
    expect(t.lower).toBeCloseTo(0.95, 5)
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

  test('treats lower bound as warning and upper bound as success', () => {
    const lowerSummary = makeSummary({ lineRate: 0.5 })
    const upperSummary = makeSummary({ lineRate: 0.75 })
    expect(generateBadgeUrl(lowerSummary, thresholds)).toContain('yellow')
    expect(generateBadgeUrl(upperSummary, thresholds)).toContain('success')
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

  test('hides branch rate when branch metrics are zero', () => {
    const summary = makeSummary({
      branchRate: 0,
      branchesCovered: 0,
      branchesValid: 0,
      branchMetricsPresent: true,
      branchFileCount: 1
    })
    const opts = makeOptions({ hideBranchRate: false })
    const text = generateTextOutput(summary, opts)
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

  test('hides branch rate column when branch metrics are zero', () => {
    const summary = makeSummary({
      branchRate: 0,
      branchesCovered: 0,
      branchesValid: 0,
      branchMetricsPresent: true,
      branchFileCount: 1
    })
    const opts = makeOptions({ hideBranchRate: false })
    const text = generateMarkdownOutput(summary, opts)
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

// ─── SI-E1: Text output precision ────────────────────────────────────────────

describe('generateTextOutput precision', () => {
  test('badge URL is on line[0] and blank string is on line[1]', () => {
    const opts = makeOptions({ badgeUrl: 'https://example.com/badge.svg' })
    const lines = generateTextOutput(makeSummary(), opts).split('\n')
    expect(lines[0]).toBe('https://example.com/badge.svg')
    expect(lines[1]).toBe('')
  })

  test('first line contains package name when badgeUrl is null', () => {
    const opts = makeOptions({ badgeUrl: null })
    const output = generateTextOutput(makeSummary(), opts)
    const lines = output.split('\n')
    expect(lines[0]).toContain('MyPackage')
    expect(output).not.toMatch(/^\n/)
  })

  test('branch rate appears in package row when hideBranchRate is false', () => {
    const opts = makeOptions({ hideBranchRate: false })
    const output = generateTextOutput(makeSummary(), opts)
    expect(output).toContain('Branch Rate = 69%')
  })

  test('branch totals appear in summary row when hideBranchRate is false', () => {
    const opts = makeOptions({ hideBranchRate: false })
    const output = generateTextOutput(makeSummary(), opts)
    expect(output).toContain('(262 / 378)')
  })

  test('complexity appears in package row when hideComplexity is false', () => {
    const opts = makeOptions({ hideComplexity: false })
    const output = generateTextOutput(makeSummary(), opts)
    expect(output).toContain('Complexity = 671')
  })

  test('failBelowMin message shows threshold as whole-number percentage', () => {
    const opts = makeOptions({ failBelowMin: true })
    const output = generateTextOutput(makeSummary(), opts)
    expect(output).toContain('Minimum allowed line rate is 50%')
  })
})

// ─── SI-E2: Markdown output precision ────────────────────────────────────────

describe('generateMarkdownOutput precision', () => {
  test('first line is full table header when badgeUrl is null', () => {
    const opts = makeOptions({ badgeUrl: null })
    const lines = generateMarkdownOutput(makeSummary(), opts).split('\n')
    expect(lines[0]).toBe('Package | Line Rate | Branch Rate | Complexity | Health')
  })

  test('badge image tag is exact markdown syntax on line[0]', () => {
    const badgeUrl = 'https://img.shields.io/badge/Code%20Coverage-83%25-success?style=flat'
    const opts = makeOptions({ badgeUrl })
    const lines = generateMarkdownOutput(makeSummary(), opts).split('\n')
    expect(lines[0]).toBe(`![Code Coverage](${badgeUrl})`)
  })

  test('line[1] is blank string between badge image and table header', () => {
    const opts = makeOptions({ badgeUrl: 'https://example.com/badge.svg' })
    const lines = generateMarkdownOutput(makeSummary(), opts).split('\n')
    expect(lines[1]).toBe('')
  })

  test('summary line rate value is wrapped in double asterisks', () => {
    const output = generateMarkdownOutput(makeSummary({ lineRate: 0.83 }), makeOptions())
    expect(output).toContain('**83%**')
  })

  test('summary branch rate value is wrapped in double asterisks', () => {
    const opts = makeOptions({ hideBranchRate: false })
    const output = generateMarkdownOutput(makeSummary({ branchRate: 0.69 }), opts)
    expect(output).toContain('**69%**')
  })

  test('summary complexity value is wrapped in double asterisks', () => {
    const opts = makeOptions({ hideComplexity: false })
    const output = generateMarkdownOutput(makeSummary({ complexity: 671 }), opts)
    expect(output).toContain('**671**')
  })

  test('table header equals "Package | Line Rate" when all optional columns are hidden', () => {
    const opts = makeOptions({ hideBranchRate: true, hideComplexity: true, indicators: false, badgeUrl: null })
    const lines = generateMarkdownOutput(makeSummary(), opts).split('\n')
    expect(lines[0]).toBe('Package | Line Rate')
  })

  test('failBelowMin note uses italic percentage', () => {
    const opts = makeOptions({ failBelowMin: true })
    const output = generateMarkdownOutput(makeSummary(), opts)
    expect(output).toContain('_Minimum allowed line rate is 50%_')
  })
})

// ─── SI-E4: Health indicator precision ───────────────────────────────────────

describe('health indicators precision', () => {
  test('❌ (U+274C) exact character when lineRate is below lower threshold', () => {
    const summary = makeSummary({ lineRate: 0.3, packages: [{ name: 'P', lineRate: 0.3, branchRate: 0, complexity: 0 }] })
    const output = generateTextOutput(summary, makeOptions({ indicators: true }))
    expect(output).toContain('❌')
  })

  test('➖ (U+2796) exact character when lineRate is between thresholds', () => {
    const summary = makeSummary({ lineRate: 0.6, packages: [{ name: 'P', lineRate: 0.6, branchRate: 0, complexity: 0 }] })
    const output = generateTextOutput(summary, makeOptions({ indicators: true }))
    expect(output).toContain('➖')
  })

  test('✔ (U+2714) exact character when lineRate is at or above upper threshold', () => {
    const summary = makeSummary({ lineRate: 0.9, packages: [{ name: 'P', lineRate: 0.9, branchRate: 0, complexity: 0 }] })
    const output = generateTextOutput(summary, makeOptions({ indicators: true }))
    expect(output).toContain('✔')
  })

  test('➖ when lineRate equals lower threshold exactly (boundary)', () => {
    const summary = makeSummary({ lineRate: 0.5, packages: [{ name: 'P', lineRate: 0.5, branchRate: 0, complexity: 0 }] })
    const output = generateTextOutput(summary, makeOptions({ indicators: true }))
    expect(output).toContain('➖')
    expect(output).not.toContain('❌')
  })

  test('✔ when lineRate equals upper threshold exactly (boundary)', () => {
    const summary = makeSummary({ lineRate: 0.75, packages: [{ name: 'P', lineRate: 0.75, branchRate: 0, complexity: 0 }] })
    const output = generateTextOutput(summary, makeOptions({ indicators: true }))
    expect(output).toContain('✔')
    expect(output).not.toContain('➖')
  })

  test('no indicator symbols appear anywhere when indicators is false', () => {
    const output = generateTextOutput(makeSummary(), makeOptions({ indicators: false }))
    expect(output).not.toMatch(/[❌➖✔]/u)
  })
})

// ─── SI-E5: Badge URL precision ───────────────────────────────────────────────

describe('generateBadgeUrl precision', () => {
  test('full URL for 83% success', () => {
    const result = generateBadgeUrl(makeSummary({ lineRate: 0.83 }), { lower: 0.5, upper: 0.75 })
    expect(result).toBe('https://img.shields.io/badge/Code%20Coverage-83%25-success?style=flat')
  })

  test('full URL for 40% critical', () => {
    const result = generateBadgeUrl(makeSummary({ lineRate: 0.4 }), { lower: 0.5, upper: 0.75 })
    expect(result).toBe('https://img.shields.io/badge/Code%20Coverage-40%25-critical?style=flat')
  })

  test('full URL for 60% yellow', () => {
    const result = generateBadgeUrl(makeSummary({ lineRate: 0.6 }), { lower: 0.5, upper: 0.75 })
    expect(result).toBe('https://img.shields.io/badge/Code%20Coverage-60%25-yellow?style=flat')
  })

  test('0% encodes as 0%25 in URL', () => {
    const result = generateBadgeUrl(makeSummary({ lineRate: 0.0 }), { lower: 0.5, upper: 0.75 })
    expect(result).toContain('-0%25-')
  })

  test('100% encodes as 100%25 in URL', () => {
    const result = generateBadgeUrl(makeSummary({ lineRate: 1.0 }), { lower: 0.5, upper: 0.75 })
    expect(result).toContain('-100%25-')
  })

  test('style=flat query parameter present for all three colors', () => {
    expect(generateBadgeUrl(makeSummary({ lineRate: 0.3 }), { lower: 0.5, upper: 0.75 })).toContain('?style=flat')
    expect(generateBadgeUrl(makeSummary({ lineRate: 0.6 }), { lower: 0.5, upper: 0.75 })).toContain('?style=flat')
    expect(generateBadgeUrl(makeSummary({ lineRate: 0.9 }), { lower: 0.5, upper: 0.75 })).toContain('?style=flat')
  })

  test('exactly at lower threshold yields yellow (not critical)', () => {
    const result = generateBadgeUrl(makeSummary({ lineRate: 0.5 }), { lower: 0.5, upper: 0.75 })
    expect(result).toContain('yellow')
    expect(result).not.toContain('critical')
  })

  test('exactly at upper threshold yields success (not yellow)', () => {
    const result = generateBadgeUrl(makeSummary({ lineRate: 0.75 }), { lower: 0.5, upper: 0.75 })
    expect(result).toContain('success')
    expect(result).not.toContain('yellow')
  })
})

// ─── SI-E3: Complexity formatting precision ───────────────────────────────────

describe('formatComplexity via generateTextOutput', () => {
  test('integer complexity renders without decimal point', () => {
    const summary = makeSummary({ complexity: 5, packages: [{ name: 'P', lineRate: 0.83, branchRate: 0.69, complexity: 5 }] })
    const output = generateTextOutput(summary, makeOptions({ hideComplexity: false }))
    expect(output).toContain('Complexity = 5')
    expect(output).not.toContain('Complexity = 5.')
  })

  test('non-integer complexity renders with exactly 4 decimal places', () => {
    const summary = makeSummary({ complexity: 3.14159, packages: [{ name: 'P', lineRate: 0.83, branchRate: 0.69, complexity: 3.14159 }] })
    const output = generateTextOutput(summary, makeOptions({ hideComplexity: false }))
    expect(output).toContain('Complexity = 3.1416')
  })

  test('zero complexity renders as "0" with no decimal point', () => {
    const summary = makeSummary({ complexity: 0, packages: [{ name: 'P', lineRate: 0.83, branchRate: 0.69, complexity: 0 }] })
    const output = generateTextOutput(summary, makeOptions({ hideComplexity: false }))
    expect(output).toContain('Complexity = 0')
    expect(output).not.toContain('Complexity = 0.')
  })

  test('0.0 (float zero) renders as "0"', () => {
    const summary = makeSummary({ complexity: 0.0, packages: [{ name: 'P', lineRate: 0.83, branchRate: 0.69, complexity: 0.0 }] })
    const output = generateTextOutput(summary, makeOptions({ hideComplexity: false }))
    expect(output).toContain('Complexity = 0')
    expect(output).not.toContain('Complexity = 0.')
  })
})

// ─── Edge cases ───────────────────────────────────────────────────────────────

describe('edge cases', () => {
  test('branch output suppressed in text format when all branch values are zero', () => {
    const summary = makeSummary({ branchRate: 0, branchesCovered: 0, branchesValid: 0, packages: [{ name: 'P', lineRate: 0.83, branchRate: 0, complexity: 0 }] })
    const output = generateTextOutput(summary, makeOptions({ hideBranchRate: false }))
    expect(output).not.toContain('Branch Rate')
  })

  test('branch output suppressed in markdown format when all branch values are zero', () => {
    const summary = makeSummary({ branchRate: 0, branchesCovered: 0, branchesValid: 0, packages: [{ name: 'P', lineRate: 0.83, branchRate: 0, complexity: 0 }] })
    const output = generateMarkdownOutput(summary, makeOptions({ hideBranchRate: false }))
    expect(output).not.toContain('Branch Rate')
  })

  test('no badge content appears when badgeUrl is null', () => {
    const opts = makeOptions({ badgeUrl: null })
    const textOutput = generateTextOutput(makeSummary(), opts)
    const markdownOutput = generateMarkdownOutput(makeSummary(), opts)
    expect(textOutput).not.toContain('shields.io')
    expect(textOutput).not.toContain('![Code Coverage]')
    expect(markdownOutput).not.toContain('shields.io')
    expect(markdownOutput).not.toContain('![Code Coverage]')
  })

  test('markdown header is exactly "Package | Line Rate" when hideBranchRate=true, hideComplexity=true, indicators=false', () => {
    const opts = makeOptions({ hideBranchRate: true, hideComplexity: true, indicators: false, badgeUrl: null })
    const lines = generateMarkdownOutput(makeSummary(), opts).split('\n')
    expect(lines[0]).toBe('Package | Line Rate')
  })
})
