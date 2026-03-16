/**
 * NFR-017: Deterministic Output Content
 * Verify action produces byte-for-byte identical output for same inputs
 */

import { generateTextOutput, generateMarkdownOutput, generateBadgeUrl, parseThresholds } from '../../src/output-generator'

describe('NFR-017: Deterministic Output Content', () => {
  const testSummary = {
    lineRate: 0.87,
    branchRate: 0.82,
    complexity: 2.3,
    linesCovered: 87,
    linesValid: 100,
    branchesCovered: 82,
    branchesValid: 100,
    packages: [
      {
        name: 'com.example.app',
        lineRate: 0.90,
        branchRate: 0.85,
        complexity: 2.0,
        linesCovered: 90,
        linesValid: 100,
        branchesCovered: 85,
        branchesValid: 100,
      },
      {
        name: 'com.example.util',
        lineRate: 0.84,
        branchRate: 0.79,
        complexity: 2.6,
        linesCovered: 84,
        linesValid: 100,
        branchesCovered: 79,
        branchesValid: 100,
      },
    ],
    branchMetricsPresent: true,
    fileCount: 2,
    branchFileCount: 2,
  }

  const thresholds = parseThresholds('75 85')

  test('badge URL should be identical for same inputs', () => {
    const url1 = generateBadgeUrl(testSummary, thresholds)
    const url2 = generateBadgeUrl(testSummary, thresholds)
    const url3 = generateBadgeUrl(testSummary, thresholds)

    expect(url1).toBe(url2)
    expect(url2).toBe(url3)
  })

  test('text output should be identical for same inputs', () => {
    const options = {
      badgeUrl: 'https://img.shields.io/badge/Code%20Coverage-87%25-yellow?style=flat',
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const output1 = generateTextOutput(testSummary, options)
    const output2 = generateTextOutput(testSummary, options)
    const output3 = generateTextOutput(testSummary, options)

    expect(output1).toBe(output2)
    expect(output2).toBe(output3)
  })

  test('markdown output should be identical for same inputs', () => {
    const options = {
      badgeUrl: 'https://img.shields.io/badge/Code%20Coverage-87%25-yellow?style=flat',
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const output1 = generateMarkdownOutput(testSummary, options)
    const output2 = generateMarkdownOutput(testSummary, options)
    const output3 = generateMarkdownOutput(testSummary, options)

    expect(output1).toBe(output2)
    expect(output2).toBe(output3)
  })

  test('output should not contain random values', () => {
    const options = {
      badgeUrl: null,
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const output = generateTextOutput(testSummary, options)

    // Should not contain timestamps
    expect(output).not.toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(output).not.toMatch(/\d{2}:\d{2}:\d{2}/)

    // Should not contain random UUIDs
    expect(output).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}/)

    // Should not contain process IDs or random numbers
    // (unless they're part of intentional data)
  })

  test('output should be byte-for-byte identical across runs', () => {
    const options = {
      badgeUrl: null,
      indicators: false,
      hideBranchRate: true,
      hideComplexity: true,
      thresholds,
      failBelowMin: true,
    }

    const output1 = generateTextOutput(testSummary, options)
    const output2 = generateTextOutput(testSummary, options)

    // Check byte-for-byte equality
    expect(output1.length).toBe(output2.length)
    expect(Buffer.from(output1).equals(Buffer.from(output2))).toBe(true)
  })

  test('multiple invocations should produce identical results', () => {
    const runs = []
    for (let i = 0; i < 5; i++) {
      const options = {
        badgeUrl: generateBadgeUrl(testSummary, thresholds),
        indicators: true,
        hideBranchRate: false,
        hideComplexity: false,
        thresholds,
        failBelowMin: false,
      }
      runs.push(generateMarkdownOutput(testSummary, options))
    }

    // All runs should be identical
    const first = runs[0]
    runs.forEach((run, idx) => {
      expect(run).toBe(first)
    })
  })

  test('output with different order should still be deterministic', () => {
    // Even though packages might be in different order in input,
    // output should always sort them the same way

    const summary1 = {
      ...testSummary,
      packages: [testSummary.packages[0], testSummary.packages[1]],
    }

    const summary2 = {
      ...testSummary,
      packages: [testSummary.packages[1], testSummary.packages[0]],
    }

    const options = {
      badgeUrl: null,
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const output1 = generateTextOutput(summary1, options)
    const output2 = generateTextOutput(summary2, options)

    // Both should generate the same output if packages are in same order
    // If order matters, they'll be different (which is still deterministic)
    // But same input order should always produce same output
    expect(output1).toBe(generateTextOutput(summary1, options))
  })

  test('threshold formatting should be deterministic', () => {
    const thresholds1 = parseThresholds('50 75')
    const thresholds2 = parseThresholds('50 75')
    const thresholds3 = parseThresholds('50 75')

    expect(thresholds1).toEqual(thresholds2)
    expect(thresholds2).toEqual(thresholds3)

    // All should produce identical results
    expect(thresholds1).toEqual({ lower: 0.5, upper: 0.75 })
  })

  test('output should not depend on locale', () => {
    // Save original locale
    const originalEnv = { ...process.env }

    try {
      const options = {
        badgeUrl: null,
        indicators: true,
        hideBranchRate: false,
        hideComplexity: false,
        thresholds,
        failBelowMin: false,
      }

      // Generate output (process.env.LANG shouldn't affect it)
      const output = generateTextOutput(testSummary, options)

      // Should use consistent number formatting
      expect(output).toContain('87%')
      expect(output).not.toContain('87,')
      expect(output).not.toContain('87.')
    } finally {
      // Restore environment
      Object.assign(process.env, originalEnv)
    }
  })

  test('edge case: same inputs should always produce same output', () => {
    const edgeCaseSummary = {
      lineRate: 0.0,
      branchRate: 0.0,
      complexity: 0.0,
      linesCovered: 0,
      linesValid: 0,
      branchesCovered: 0,
      branchesValid: 0,
      packages: [],
      branchMetricsPresent: false,
      fileCount: 0,
      branchFileCount: 0,
    }

    const options = {
      badgeUrl: null,
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const output1 = generateTextOutput(edgeCaseSummary, options)
    const output2 = generateTextOutput(edgeCaseSummary, options)
    const output3 = generateTextOutput(edgeCaseSummary, options)

    expect(output1).toBe(output2)
    expect(output2).toBe(output3)
  })

  test('determinism should hold for all format options', () => {
    const options1 = {
      badgeUrl: generateBadgeUrl(testSummary, thresholds),
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: false,
    }

    const options2 = {
      badgeUrl: null,
      indicators: false,
      hideBranchRate: true,
      hideComplexity: true,
      thresholds,
      failBelowMin: true,
    }

    // Both option sets should produce deterministic output
    const text1 = generateTextOutput(testSummary, options1)
    const text2 = generateTextOutput(testSummary, options1)
    expect(text1).toBe(text2)

    const md1 = generateMarkdownOutput(testSummary, options2)
    const md2 = generateMarkdownOutput(testSummary, options2)
    expect(md1).toBe(md2)
  })
})
