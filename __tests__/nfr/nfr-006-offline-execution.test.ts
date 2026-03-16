/**
 * NFR-006: Offline Execution
 * Verify the action works without network connectivity
 */

import * as fs from 'fs'
import * as path from 'path'

// Mock network modules
const http = require('http') as typeof import('http')
const https = require('https') as typeof import('https')
import { generateBadgeUrl, parseThresholds } from '../../src/output-generator'

describe('NFR-006: Offline Execution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should generate badge URL without making HTTP requests', () => {
    const summary = {
      lineRate: 0.85,
      branchRate: 0.8,
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

    // Clear any mocks for network modules
    const httpSpy = jest.spyOn(http, 'request')
    const httpsSpy = jest.spyOn(https, 'request')

    const badgeUrl = generateBadgeUrl(summary, thresholds)

    // Verify URL is generated
    expect(badgeUrl).toBeDefined()
    expect(badgeUrl).toContain('shields.io')
    expect(badgeUrl).toContain('85%25') // Verify content is correct

    // Verify NO network requests were made
    expect(httpSpy).not.toHaveBeenCalled()
    expect(httpsSpy).not.toHaveBeenCalled()
  })

  test('badge URL should be a string, not a fetch/request', () => {
    const summary = {
      lineRate: 0.95,
      branchRate: 0.9,
      complexity: 1.5,
      linesCovered: 95,
      linesValid: 100,
      branchesCovered: 90,
      branchesValid: 100,
      packages: [],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }
    const badgeUrl = generateBadgeUrl(summary, thresholds)

    // Badge URL should be plain string, not a Promise
    expect(typeof badgeUrl).toBe('string')
    expect(badgeUrl).not.toBeInstanceOf(Promise)

    // Verify it's a valid shield.io URL structure
    expect(badgeUrl).toMatch(/^https:\/\/img\.shields\.io\/badge\//)
  })

  test('badge URL generation is purely computational', () => {
    const summary = {
      lineRate: 0.42,
      branchRate: 0.5,
      complexity: 3.2,
      linesCovered: 42,
      linesValid: 100,
      branchesCovered: 50,
      branchesValid: 100,
      packages: [],
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
    }

    const thresholds = { lower: 0.5, upper: 0.75 }

    // Should work without any network access
    expect(() => {
      generateBadgeUrl(summary, thresholds)
    }).not.toThrow()

    // Multiple calls should work identically
    const url1 = generateBadgeUrl(summary, thresholds)
    const url2 = generateBadgeUrl(summary, thresholds)
    expect(url1).toBe(url2)
  })

  test('threshold parsing should work offline', () => {
    // Should work without any network access
    expect(() => {
      parseThresholds('50 75')
    }).not.toThrow()

    const result = parseThresholds('60 80')
    expect(result).toEqual({ lower: 0.6, upper: 0.8 })
  })

  test('parser code should not reference network modules', () => {
    const parserPath = path.join(__dirname, '../../src/output-generator.ts')
    const content = fs.readFileSync(parserPath, 'utf8')

    // Should not import http, https, axios, fetch, or node-fetch
    expect(content).not.toContain(`import * as http from 'http'`)
    expect(content).not.toContain(`import * as https from 'https'`)
    expect(content).not.toContain(`from 'axios'`)
    expect(content).not.toContain(`from 'node-fetch'`)
    expect(content).not.toContain(`require('http')`)
    expect(content).not.toContain(`require('https')`)
    expect(content).not.toContain(`require('axios')`)
  })

  test('should not call fetch during badge generation', () => {
    // Mock global fetch if it exists
    const originalFetch = global.fetch
    const fetchSpy = jest.fn()
    global.fetch = fetchSpy as any

    try {
      const summary = {
        lineRate: 0.75,
        branchRate: 0.7,
        complexity: 2.0,
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
      generateBadgeUrl(summary, thresholds)

      // fetch should never have been called
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      global.fetch = originalFetch
    }
  })
})
