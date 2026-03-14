/**
 * NFR-007: No External Resource Fetching
 * Verify that the action does not fetch external resources (shields.io badges, etc)
 */

import * as fs from 'fs'
import * as path from 'path'

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

import { generateBadgeUrl } from '../../src/output-generator'

describe('NFR-007: No External Resource Fetching', () => {
  test('should generate shield.io URLs without fetching them', () => {
    const summary = {
      lineRate: 0.88,
      branchRate: 0.85,
      complexity: 2.3,
      linesCovered: 88,
      linesValid: 100,
      branchesCovered: 85,
      branchesValid: 100,
      packages: [],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }

    // Should only generate URL, not fetch it
    const badgeUrl = generateBadgeUrl(summary, thresholds)

    // Verify we have a URL string
    expect(badgeUrl).toBeDefined()
    expect(typeof badgeUrl).toBe('string')

    // Verify it's a shield.io domain (not fetched, just constructed)
    expect(badgeUrl).toMatch(/^https:\/\/img\.shields\.io\//)

    // URL should not be fetched/dereferenced - it's just a string
    expect(badgeUrl).toContain('shields.io')
  })

  test('source code should not use fetch API', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should not contain fetch calls
    expect(content).not.toContain('fetch(')
    expect(content).not.toContain('.fetch(')
  })

  test('source code should not use axios', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')

      // Should not import or use axios
      expect(content).not.toContain("from 'axios'")
      expect(content).not.toContain('require(\'axios\')')
      expect(content).not.toContain('import axios')
      expect(content).not.toContain('axios.get')
      expect(content).not.toContain('axios.post')
      expect(content).not.toContain('axios.request')
    })
  })

  test('source code should not use http/https clients for requests', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')

      // Check for http.request, https.request, http.get, https.get
      expect(content).not.toContain('http.request(')
      expect(content).not.toContain('https.request(')
      expect(content).not.toContain('http.get(')
      expect(content).not.toContain('https.get(')
    })
  })

  test('package.json should not have http-based dependencies for fetching', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    // Should not have external fetching libraries
    expect(allDeps).not.toHaveProperty('axios')
    expect(allDeps).not.toHaveProperty('node-fetch')
    expect(allDeps).not.toHaveProperty('isomorphic-fetch')
    expect(allDeps).not.toHaveProperty('whatwg-fetch')
    expect(allDeps).not.toHaveProperty('request')
    expect(allDeps).not.toHaveProperty('got')
  })

  test('badge generation should not make network calls even if invoked', () => {
    const originalFetch = global.fetch

    // Track any attempted fetch calls
    let fetchAttempted = false
    global.fetch = jest.fn(async () => {
      fetchAttempted = true
      throw new Error('Network call attempted in offline mode')
    }) as any

    try {
      const summary = {
        lineRate: 0.92,
        branchRate: 0.88,
        complexity: 2.0,
        linesCovered: 92,
        linesValid: 100,
        branchesCovered: 88,
        branchesValid: 100,
        packages: [],
        branchMetricsPresent: true,
        fileCount: 1,
        branchFileCount: 1,
      }

      const thresholds = { lower: 0.5, upper: 0.75 }
      const url = generateBadgeUrl(summary, thresholds)

      // Should succeed without network
      expect(url).toBeDefined()
      expect(fetchAttempted).toBe(false)
    } finally {
      global.fetch = originalFetch
    }
  })

  test('URL parameters should not contain sensitive data', () => {
    const summary = {
      lineRate: 0.75,
      branchRate: 0.7,
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
    const badgeUrl = generateBadgeUrl(summary, thresholds)

    // URL should only contain:
    // - Domain (shields.io)
    // - Badge label
    // - Coverage percentage
    // - Color indicator
    // No API keys, tokens, or sensitive values

    // Should not contain common secret patterns
    expect(badgeUrl).not.toMatch(/token=/i)
    expect(badgeUrl).not.toMatch(/api[_-]?key=/i)
    expect(badgeUrl).not.toMatch(/secret=/i)
    expect(badgeUrl).not.toMatch(/password=/i)
  })
})
