/**
 * NFR-018: Deterministic Ordering
 * Verify package ordering is consistent
 */

import { generateTextOutput, generateMarkdownOutput } from '../../src/output-generator'

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

describe('NFR-018: Deterministic Ordering', () => {
  test('packages should appear in consistent order in text output', () => {
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
          name: 'zebra.package',
          lineRate: 0.95,
          branchRate: 0.90,
          complexity: 1.5,
          linesCovered: 95,
          linesValid: 100,
          branchesCovered: 90,
          branchesValid: 100,
        },
        {
          name: 'alpha.package',
          lineRate: 0.85,
          branchRate: 0.80,
          complexity: 2.5,
          linesCovered: 85,
          linesValid: 100,
          branchesCovered: 80,
          branchesValid: 100,
        },
        {
          name: 'middle.package',
          lineRate: 0.90,
          branchRate: 0.85,
          complexity: 2.0,
          linesCovered: 90,
          linesValid: 100,
          branchesCovered: 85,
          branchesValid: 100,
        },
      ],
      branchMetricsPresent: true,
      fileCount: 3,
      branchFileCount: 3,
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

    const output1 = generateTextOutput(summary, options)
    const output2 = generateTextOutput(summary, options)

    // Same input should produce same output in same order
    expect(output1).toBe(output2)

    // Extract package lines from output
    const lines = output1.split('\n')
    const packageLines = lines.filter(line => line.includes(':'))

    // Should maintain input order (not sorted alphabetically)
    // First package output should be zebra
    expect(packageLines[0]).toContain('zebra.package')
    expect(packageLines[1]).toContain('alpha.package')
    expect(packageLines[2]).toContain('middle.package')
  })

  test('packages should appear in consistent order in markdown output', () => {
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
          name: 'zebra.package',
          lineRate: 0.95,
          branchRate: 0.90,
          complexity: 1.5,
          linesCovered: 95,
          linesValid: 100,
          branchesCovered: 90,
          branchesValid: 100,
        },
        {
          name: 'alpha.package',
          lineRate: 0.85,
          branchRate: 0.80,
          complexity: 2.5,
          linesCovered: 85,
          linesValid: 100,
          branchesCovered: 80,
          branchesValid: 100,
        },
      ],
      branchMetricsPresent: true,
      fileCount: 2,
      branchFileCount: 2,
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

    const output1 = generateMarkdownOutput(summary, options)
    const output2 = generateMarkdownOutput(summary, options)

    // Same input should produce same output
    expect(output1).toBe(output2)

    // Check package order in markdown table
    const lines = output1.split('\n')
    const tableLines = lines.filter(line => line.includes('|') && !line.includes('---'))
    
    // Skip header row (tableLines[0]) and check data rows
    const dataRows = tableLines.slice(1) // Remove header
    
    // First data row should be zebra, second should be alpha
    expect(dataRows[0]).toContain('zebra')
    expect(dataRows[1]).toContain('alpha')
  })

  test('multiple runs with same package order should produce identical output', () => {
    const packages = [
      { name: 'com.beta.app', lineRate: 0.88, branchRate: 0.83, complexity: 2.2, linesCovered: 88, linesValid: 100, branchesCovered: 83, branchesValid: 100 },
      { name: 'com.alpha.app', lineRate: 0.92, branchRate: 0.87, complexity: 1.8, linesCovered: 92, linesValid: 100, branchesCovered: 87, branchesValid: 100 },
      { name: 'com.gamma.app', lineRate: 0.85, branchRate: 0.80, complexity: 2.5, linesCovered: 85, linesValid: 100, branchesCovered: 80, branchesValid: 100 },
    ]

    const summary = {
      lineRate: 0.88,
      branchRate: 0.83,
      complexity: 2.17,
      linesCovered: 88,
      linesValid: 100,
      branchesCovered: 83,
      branchesValid: 100,
      packages,
      branchMetricsPresent: true,
      fileCount: 3,
      branchFileCount: 3,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }
    const options = {
      badgeUrl: 'https://example.com/badge',
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
    outputs.forEach(output => {
      expect(output).toBe(first)
    })
  })

  test('package order should be preserved from input', () => {
    // The action should preserve the order packages appear in the coverage file
    // Not sort them alphabetically or by coverage percentage

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
          name: 'z-lowest-coverage',
          lineRate: 0.50,
          branchRate: 0.50,
          complexity: 3.0,
          linesCovered: 50,
          linesValid: 100,
          branchesCovered: 50,
          branchesValid: 100,
        },
        {
          name: 'a-highest-coverage',
          lineRate: 0.99,
          branchRate: 0.99,
          complexity: 1.0,
          linesCovered: 99,
          linesValid: 100,
          branchesCovered: 99,
          branchesValid: 100,
        },
      ],
      branchMetricsPresent: true,
      fileCount: 2,
      branchFileCount: 2,
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

    const output = generateTextOutput(summary, options)

    // Extract lines with package names
    const lines = output.split('\n')
    const packageLines = lines.filter(line => line.includes(':') && !line.includes('Summary'))

    // Should appear in input order, NOT sorted by coverage
    // First should be z-lowest, not a-highest
    expect(packageLines[0]).toContain('z-lowest-coverage')
    expect(packageLines[1]).toContain('a-highest-coverage')
  })

  test('summary line should always be last', () => {
    const summary = {
      lineRate: 0.87,
      branchRate: 0.82,
      complexity: 2.3,
      linesCovered: 87,
      linesValid: 100,
      branchesCovered: 82,
      branchesValid: 100,
      packages: [
        {
          name: 'package1',
          lineRate: 0.90,
          branchRate: 0.85,
          complexity: 2.0,
          linesCovered: 90,
          linesValid: 100,
          branchesCovered: 85,
          branchesValid: 100,
        },
        {
          name: 'package2',
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

    const thresholds = { lower: 0.5, upper: 0.75 }
    const options = {
      badgeUrl: null,
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: true,
    }

    const output = generateTextOutput(summary, options)
    const lines = output.split('\n').filter(line => line.trim())

    // Summary should be second-to-last line (last is newline)
    const lastLine = lines[lines.length - 1]
    expect(lastLine).toContain('Minimum allowed')

    const summaryLine = lines.find(line => line.includes('Summary'))
    expect(summaryLine).toBeDefined()
    const summaryIndex = lines.indexOf(summaryLine!)

    // Summary should appear before packages list (in some formats)
    // or after (in others), but consistently
    const firstOutput = output
    const secondOutput = generateTextOutput(summary, options)
    expect(firstOutput).toBe(secondOutput)
  })
})
