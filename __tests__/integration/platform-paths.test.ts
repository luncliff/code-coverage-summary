/**
 * Integration Test: Cross-Platform Path Handling
 * Verify the action handles paths correctly across different platforms
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseCoverageFile, createEmptySummary } from '../../src/coverage-parser'

describe('Integration: Cross-Platform Path Handling', () => {
  test('should parse coverage files with Windows-style paths', () => {
    const fixturePath = path.join(__dirname, '../fixtures/platform/windows-paths.xml')
    const summary = createEmptySummary()
    
    const result = parseCoverageFile(fixturePath, summary)
    
    expect(result.packages.length).toBeGreaterThan(0)
    expect(result.lineRate).toBeCloseTo(0.80, 2)
  })

  test('should parse coverage files with Unix-style paths', () => {
    const fixturePath = path.join(__dirname, '../fixtures/platform/unix-paths.xml')
    const summary = createEmptySummary()
    
    const result = parseCoverageFile(fixturePath, summary)
    
    expect(result.packages.length).toBeGreaterThan(0)
    expect(result.lineRate).toBeCloseTo(0.80, 2)
  })

  test('should produce identical results for Windows and Unix path fixtures', () => {
    const windowsPath = path.join(__dirname, '../fixtures/platform/windows-paths.xml')
    const unixPath = path.join(__dirname, '../fixtures/platform/unix-paths.xml')
    
    const summary1 = createEmptySummary()
    const windowsResult = parseCoverageFile(windowsPath, summary1)
    
    const summary2 = createEmptySummary()
    const unixResult = parseCoverageFile(unixPath, summary2)
    
    // Coverage metrics should be identical
    expect(windowsResult.lineRate).toBe(unixResult.lineRate)
    expect(windowsResult.branchRate).toBe(unixResult.branchRate)
    expect(windowsResult.complexity).toBe(unixResult.complexity)
    expect(windowsResult.packages.length).toBe(unixResult.packages.length)
  })
})
