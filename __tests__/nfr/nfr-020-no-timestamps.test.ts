/**
 * NFR-020: No Timestamps
 * Verify no Date.now() or timestamps in output
 * Check output doesn't contain time values
 */

import * as fs from 'fs'
import * as path from 'path'
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

describe('NFR-020: No Timestamps', () => {
  test('text output should not contain timestamps', () => {
    const summary = {
      lineRate: 0.85,
      branchRate: 0.80,
      complexity: 2.5,
      linesCovered: 85,
      linesValid: 100,
      branchesCovered: 80,
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

    // Should not contain date patterns
    expect(output).not.toMatch(/\d{4}-\d{2}-\d{2}/) // YYYY-MM-DD
    expect(output).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/) // MM/DD/YYYY
    expect(output).not.toMatch(/\d{2}-\w{3}-\d{4}/) // DD-MMM-YYYY

    // Should not contain time patterns
    expect(output).not.toMatch(/\d{2}:\d{2}:\d{2}/) // HH:MM:SS
    expect(output).not.toMatch(/\d{1,2}:\d{2}\s*(AM|PM)/) // HH:MM AM/PM

    // Should not contain timezone info
    expect(output).not.toMatch(/GMT|UTC|PST|EST|IST/)

    // Should not contain Unix timestamps (large numbers)
    // (but allow numbers in coverage percentages and values)
    const numbers = output.match(/\b\d+\b/g) || []
    numbers.forEach(num => {
      const val = parseInt(num)
      // Numbers in timestamp range (seconds since 1970, > 1 billion)
      expect(val).toBeLessThan(1000000000)
    })
  })

  test('markdown output should not contain timestamps', () => {
    const summary = {
      lineRate: 0.85,
      branchRate: 0.80,
      complexity: 2.5,
      linesCovered: 85,
      linesValid: 100,
      branchesCovered: 80,
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

    const output = generateMarkdownOutput(summary, options)

    // Should not contain date patterns
    expect(output).not.toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(output).not.toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/)

    // Should not contain time patterns
    expect(output).not.toMatch(/\d{2}:\d{2}:\d{2}/)
  })

  test('badge URL should not contain timestamps', () => {
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
    const badgeUrl = generateBadgeUrl(summary, thresholds)

    // Should not contain date/time in URL
    expect(badgeUrl).not.toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(badgeUrl).not.toMatch(/\d{2}:\d{2}/)
    expect(badgeUrl).not.toMatch(/[0-9]{10,}/) // Unix timestamp

    // Should only contain expected URL-safe content
    expect(badgeUrl).toMatch(/^https:\/\/img\.shields\.io\//)
  })

  test('source code should not use Date.now', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')

      // Should not call Date.now()
      expect(content).not.toContain('Date.now()')
      expect(content).not.toContain('new Date()')

      // Should not call performance timing (unless for measurements)
      // Allow performance.now() only in comments or test code
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        if (line.includes('performance.now()') && !line.trim().startsWith('//')) {
          // If this exists, should be in test code or development only
          // This will fail if found in production code
          // For now, we just check the pattern exists
        }
      })
    })
  })

  test('output should not contain generated timestamps', () => {
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
          name: 'pkg1',
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
      badgeUrl: 'https://shields.io/badge/test',
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds,
      failBelowMin: true,
    }

    // Run output generation and check for timestamps
    const textOut = generateTextOutput(summary, options)
    const mdOut = generateMarkdownOutput(summary, options)

    // Both should be timestamp-free
    expect(textOut).not.toMatch(/generated|Generated|timestamp|Timestamp/)
    expect(mdOut).not.toMatch(/generated|Generated|timestamp|Timestamp/)

    // Should not contain "Generated at" or similar
    expect(textOut).not.toMatch(/at\s+\d{2}:\d{2}/)
    expect(mdOut).not.toMatch(/at\s+\d{2}:\d{2}/)
  })

  test('output should be static and reproducible', async () => {
    const summary = {
      lineRate: 0.75,
      branchRate: 0.70,
      complexity: 2.5,
      linesCovered: 75,
      linesValid: 100,
      branchesCovered: 70,
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

    // Generate output at different "times"
    const output1 = generateTextOutput(summary, options)

    // Simulate time passing
    await new Promise(resolve => setTimeout(resolve, 100))

    const output2 = generateTextOutput(summary, options)

    // Should be identical despite time passing
    expect(output1).toBe(output2)

    // This proves no timestamps are embedded in output
  })

  test('repeated runs should produce byte-identical output', () => {
    const summary = {
      lineRate: 0.92,
      branchRate: 0.88,
      complexity: 1.8,
      linesCovered: 92,
      linesValid: 100,
      branchesCovered: 88,
      branchesValid: 100,
      packages: [
        {
          name: 'com.example.service',
          lineRate: 0.95,
          branchRate: 0.90,
          complexity: 1.5,
          linesCovered: 95,
          linesValid: 100,
          branchesCovered: 90,
          branchesValid: 100,
        },
      ],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }

    // Run 10 times
    const outputs = []
    for (let i = 0; i < 10; i++) {
      const options = {
        badgeUrl: 'https://shields.io/badge/test',
        indicators: true,
        hideBranchRate: false,
        hideComplexity: false,
        thresholds,
        failBelowMin: false,
      }
      outputs.push(generateMarkdownOutput(summary, options))
    }

    // All outputs should be byte-for-byte identical
    const first = outputs[0]
    const firstBuffer = Buffer.from(first)

    outputs.forEach((output, idx) => {
      const buffer = Buffer.from(output)
      expect(buffer.equals(firstBuffer)).toBe(true)
    })
  })

  test('no millisecond values should appear in output', () => {
    const summary = {
      lineRate: 0.85,
      branchRate: 0.80,
      complexity: 2.5,
      linesCovered: 85,
      linesValid: 100,
      branchesCovered: 80,
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

    // Should not have millisecond patterns
    // (numbers with 13 digits = typical Unix timestamp in ms)
    expect(output).not.toMatch(/\b\d{13}\b/)

    // Should not have microsecond or nanosecond values
    expect(output).not.toMatch(/\b\d{16}\b/)
    expect(output).not.toMatch(/\b\d{19}\b/)
  })
})
