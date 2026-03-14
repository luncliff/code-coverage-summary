/**
 * NFR-019: Locale-Independent Formatting
 * Verify number formatting doesn't depend on locale
 */

import { generateTextOutput, generateMarkdownOutput, generateBadgeUrl } from '../../src/output-generator'

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('@actions/glob', () => ({
  create: jest.fn(),
}))

describe('NFR-019: Locale-Independent Formatting', () => {
  // Note: formatRate is tested indirectly through output functions
  // as it may not be exported

  test('percentage formatting should use dot not comma', () => {
    const summary = {
      lineRate: 0.8765,
      branchRate: 0.8234,
      complexity: 2.5,
      linesCovered: 876.5,
      linesValid: 1000,
      branchesCovered: 823.4,
      branchesValid: 1000,
      packages: [
        {
          name: 'test.package',
          lineRate: 0.9234,
          branchRate: 0.8765,
          complexity: 2.3,
          linesCovered: 923.4,
          linesValid: 1000,
          branchesCovered: 876.5,
          branchesValid: 1000,
        },
      ],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }
    const options = {
      badgeUrl: null,
      indicators: false,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const output = generateTextOutput(summary, options)

    // Should use English format (dot for decimal, % for percent)
    expect(output).toContain('87%') // Should be percentage format

    // Should NOT use comma as decimal separator
    expect(output).not.toMatch(/\d+,\d+%/)
    expect(output).not.toMatch(/\d+.\d+,/)

    // Should NOT use locale-specific number grouping
    // (though this is okay since percentages are < 100)
  })

  test('complexity formatting should be consistent', () => {
    const summary = {
      lineRate: 0.85,
      branchRate: 0.80,
      complexity: 2.3456,
      linesCovered: 85,
      linesValid: 100,
      branchesCovered: 80,
      branchesValid: 100,
      packages: [
        {
          name: 'test.complex',
          lineRate: 0.90,
          branchRate: 0.85,
          complexity: 1.6789,
          linesCovered: 90,
          linesValid: 100,
          branchesCovered: 85,
          branchesValid: 100,
        },
      ],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }
    const options = {
      badgeUrl: null,
      indicators: false,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const output = generateTextOutput(summary, options)

    // Complexity should use fixed decimal places (or integer if whole number)
    // Should NOT vary based on locale

    // Should not use comma as decimal point
    expect(output).not.toMatch(/\d+,\d{4}/) // Locale-specific decimal

    // Should be deterministic - run twice
    const output2 = generateTextOutput(summary, options)
    expect(output).toBe(output2)
  })

  test('badge URL should use English locale number format', () => {
    const summary = {
      lineRate: 0.7654,
      branchRate: 0.75,
      complexity: 2.5,
      linesCovered: 76.54,
      linesValid: 100,
      branchesCovered: 75,
      branchesValid: 100,
      packages: [],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }
    const badgeUrl = generateBadgeUrl(summary.lineRate, thresholds)

    // Badge URL should always use integer percentage
    expect(badgeUrl).toContain('77%25') // 76.54% rounds to 77%
    expect(badgeUrl).not.toMatch(/,/) // No commas
    expect(badgeUrl).not.toMatch(/[^\x00-\x7F]/) // Only ASCII
  })

  test('output should not contain locale-specific punctuation', () => {
    const summary = {
      lineRate: 0.85,
      branchRate: 0.80,
      complexity: 2.5,
      linesCovered: 85,
      linesValid: 100,
      branchesCovered: 80,
      branchesValid: 100,
      packages: [
        {
          name: 'test.package',
          lineRate: 0.90,
          branchRate: 0.85,
          complexity: 2.3,
          linesCovered: 90,
          linesValid: 100,
          branchesCovered: 85,
          branchesValid: 100,
        },
      ],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }
    const options = {
      badgeUrl: null,
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const textOutput = generateTextOutput(summary, options)
    const mdOutput = generateMarkdownOutput(summary, options)

    // No European-style thousand separators
    expect(textOutput).not.toMatch(/\d+\.\d{3}(?:\D|$)/) // 1.000 format
    expect(mdOutput).not.toMatch(/\d+\.\d{3}(?:\D|$)/)

    // Numbers should always use ASCII digits
    expect(textOutput).toMatch(/[0-9]/)
  })

  test('coverage percentages should round consistently', () => {
    // Rounding should be deterministic and locale-independent

    const testCases = [
      { rate: 0.875, expected: '88%' }, // 87.5% rounds to 88%
      { rate: 0.874, expected: '87%' }, // 87.4% rounds to 87%
      { rate: 0.5, expected: '50%' },
      { rate: 0.999, expected: '100%' },
      { rate: 0.001, expected: '0%' },
    ]

    testCases.forEach(({ rate, expected }) => {
      const summary = {
        lineRate: rate,
        branchRate: rate,
        complexity: 1.0,
        linesCovered: Math.round(rate * 100),
        linesValid: 100,
        branchesCovered: Math.round(rate * 100),
        branchesValid: 100,
        packages: [],
        branchMetricsPresent: true,
        fileCount: 1,
        branchFileCount: 1,
      }

      const thresholds = { lower: 0.5, upper: 0.75 }
      const options = {
        badgeUrl: null,
        indicators: false,
        hideBranchRate: false,
        hideComplexity: false,
        thresholds,
        failBelowMin: false,
      }

      const output = generateTextOutput(summary, options)
      expect(output).toContain(`Line Rate = ${expected}`)
    })
  })

  test('summary totals should use consistent formatting', () => {
    // Fractions like (87 / 100) should be consistent

    const summary = {
      lineRate: 0.87,
      branchRate: 0.82,
      complexity: 2.3,
      linesCovered: 87,
      linesValid: 100,
      branchesCovered: 82,
      branchesValid: 100,
      packages: [],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }
    const options = {
      badgeUrl: null,
      indicators: false,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const output = generateTextOutput(summary, options)

    // Should format as integer fractions
    expect(output).toContain('(87 / 100)')

    // Should not use European spacing
    expect(output).not.toContain('( 87 / 100 )')
    expect(output).not.toContain('(87, 100)')
  })

  test('multiple runs should have identical formatting', () => {
    const summary = {
      lineRate: 0.8765,
      branchRate: 0.8234,
      complexity: 2.5678,
      linesCovered: 87,
      linesValid: 100,
      branchesCovered: 82,
      branchesValid: 100,
      packages: [
        {
          name: 'pkg1',
          lineRate: 0.9234,
          branchRate: 0.8765,
          complexity: 2.3456,
          linesCovered: 92,
          linesValid: 100,
          branchesCovered: 87,
          branchesValid: 100,
        },
      ],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }
    const options = {
      badgeUrl: null,
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    // Run multiple times
    const outputs = []
    for (let i = 0; i < 5; i++) {
      outputs.push(generateTextOutput(summary, options))
    }

    // All should be identical
    const first = outputs[0]
    outputs.forEach((output, idx) => {
      expect(output).toBe(first)
    })
  })

  test('source code should not use toLocaleString', () => {
    const fs = require('fs')
    const path = require('path')

    const generatorPath = path.join(__dirname, '../../src/output-generator.ts')
    const content = fs.readFileSync(generatorPath, 'utf8')

    // Should not use locale-dependent formatting
    expect(content).not.toContain('toLocaleString')
    expect(content).not.toContain('toLocaleDateString')
    expect(content).not.toContain('toLocaleTimeString')
  })
})
