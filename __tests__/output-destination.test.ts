/**
 * Tests for output destination routing.
 * 
 * Coverage for User Stories:
 * - US1 (P1): Console output only
 * - US2 (P2): File output only  
 * - US3 (P3): Both console and file output
 * 
 * Strategy: Mock @actions/core and fs to verify routing behavior without side effects.
 */

import { routeReport, getReportFilename } from '../src/output-destination'
import * as core from '@actions/core'
import * as fs from 'fs'

// Mock @actions/core
jest.mock('@actions/core', () => ({
  info: jest.fn(),
  setFailed: jest.fn(),
}))

// Mock fs
jest.mock('fs', () => ({
  writeFileSync: jest.fn(),
}))

const mockCoreInfo = core.info as jest.MockedFunction<typeof core.info>
const mockCoreSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>
const mockFsWriteFileSync = fs.writeFileSync as jest.MockedFunction<typeof fs.writeFileSync>

// Test data
const testReport = 'Coverage Report\nLine Rate: 0.85\nBranch Rate: 0.90'
const testReportMarkdown = '# Coverage Report\n\n- Line Rate: 0.85\n- Branch Rate: 0.90'

describe('Output Destination Routing', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset mock implementations to default (no errors)
    mockFsWriteFileSync.mockImplementation(() => undefined as any)
  })

  // =========================================================================
  // User Story 1: Console Output (Priority P1)
  // =========================================================================

  describe('User Story 1: Console Output (P1)', () => {
    it('[T009] output=console does not call fs.writeFileSync', () => {
      routeReport(testReport, 'text', 'console')
      expect(mockFsWriteFileSync).not.toHaveBeenCalled()
    })

    it('[T010] output=console emits the report content to core.info', () => {
      routeReport(testReport, 'text', 'console')
      expect(mockCoreInfo).toHaveBeenCalledWith(testReport)
    })

    it('[T011] output=console does not modify an existing report file', () => {
      routeReport(testReport, 'text', 'console')
      expect(mockFsWriteFileSync).not.toHaveBeenCalled()
    })

    it('[console] logs with empty line first', () => {
      routeReport(testReport, 'text', 'console')
      const calls = mockCoreInfo.mock.calls
      expect(calls[0]).toEqual([''])
      expect(calls[1]).toEqual([testReport])
    })

    it('[console] returns correct RouteResult structure', () => {
      const result = routeReport(testReport, 'text', 'console')
      expect(result.logged).toBe(true)
      expect(result.fileWritten).toBe(false)
      expect(result.filename).toBeUndefined()
      expect(result.error).toBeUndefined()
    })

    it('[console] with markdown format also does not write file', () => {
      routeReport(testReportMarkdown, 'md', 'console')
      expect(mockFsWriteFileSync).not.toHaveBeenCalled()
    })
  })

  // =========================================================================
  // User Story 2: File Output (Priority P2)
  // =========================================================================

  describe('User Story 2: File Output (P2)', () => {
    it('[T013] output=file writes code-coverage-results.txt when format=text', () => {
      routeReport(testReport, 'text', 'file')
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.txt', testReport)
    })

    it('[T014] output=file writes code-coverage-results.md when format=markdown', () => {
      routeReport(testReportMarkdown, 'md', 'file')
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.md', testReportMarkdown)
    })

    it('[T015] output=file does not emit report content to core.info', () => {
      routeReport(testReport, 'text', 'file')
      expect(mockCoreInfo).not.toHaveBeenCalledWith(testReport)
    })

    it('[T016] file contents exactly equal the provided report string', () => {
      routeReport(testReport, 'text', 'file')
      const [filename, content] = mockFsWriteFileSync.mock.calls[0]
      expect(content).toBe(testReport)
      expect(content).toEqual(testReport)
    })

    it('[T017] file write failure triggers core.setFailed', () => {
      mockFsWriteFileSync.mockImplementation(() => {
        throw new Error('Permission denied')
      })
      const result = routeReport(testReport, 'text', 'file')
      expect(mockCoreSetFailed).toHaveBeenCalledWith('Permission denied')
      expect(result.error).toBe('Permission denied')
    })

    it('[T018] file output content equals console output content for the same report string', () => {
      const consoleResult = routeReport(testReport, 'text', 'console')
      const fileResult = routeReport(testReport, 'text', 'file')
      
      // Both should receive the same report content (one logged, one written)
      expect(mockCoreInfo).toHaveBeenCalledWith(testReport)
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.txt', testReport)
    })

    it('[file] returns correct RouteResult structure', () => {
      const result = routeReport(testReport, 'text', 'file')
      expect(result.logged).toBe(false)
      expect(result.fileWritten).toBe(true)
      expect(result.filename).toBe('code-coverage-results.txt')
      expect(result.error).toBeUndefined()
    })

    it('[file] with markdown format uses .md extension', () => {
      const result = routeReport(testReportMarkdown, 'md', 'file')
      expect(result.filename).toBe('code-coverage-results.md')
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.md', testReportMarkdown)
    })
  })

  // =========================================================================
  // User Story 3: Both Console and File Output (Priority P3)
  // =========================================================================

  describe('User Story 3: Both Console and File Output (P3)', () => {
    it('[T020] output=both emits report content to core.info', () => {
      routeReport(testReport, 'text', 'both')
      expect(mockCoreInfo).toHaveBeenCalledWith(testReport)
    })

    it('[T021] output=both writes the correct legacy filename for text format', () => {
      routeReport(testReport, 'text', 'both')
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.txt', testReport)
    })

    it('[both] output=both writes the correct legacy filename for markdown format', () => {
      routeReport(testReportMarkdown, 'md', 'both')
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.md', testReportMarkdown)
    })

    it('[both] returns correct RouteResult structure', () => {
      const result = routeReport(testReport, 'text', 'both')
      expect(result.logged).toBe(true)
      expect(result.fileWritten).toBe(true)
      expect(result.filename).toBe('code-coverage-results.txt')
      expect(result.error).toBeUndefined()
    })

    it('[both] logs with empty line first before report', () => {
      routeReport(testReport, 'text', 'both')
      const calls = mockCoreInfo.mock.calls
      expect(calls[0]).toEqual([''])
      expect(calls[1]).toEqual([testReport])
    })

    it('[both] performs both logging and file writing in single call', () => {
      jest.clearAllMocks()
      routeReport(testReport, 'text', 'both')
      expect(mockCoreInfo).toHaveBeenCalled()
      expect(mockFsWriteFileSync).toHaveBeenCalled()
    })
  })

  // =========================================================================
  // Filename Determination Tests
  // =========================================================================

  describe('Filename Determination', () => {
    it('getReportFilename returns .txt for text format', () => {
      const filename = getReportFilename('text')
      expect(filename).toBe('code-coverage-results.txt')
    })

    it('getReportFilename returns .md for md format', () => {
      const filename = getReportFilename('md')
      expect(filename).toBe('code-coverage-results.md')
    })

    it('filename property matches getReportFilename result for text', () => {
      const result = routeReport(testReport, 'text', 'file')
      const expected = getReportFilename('text')
      expect(result.filename).toBe(expected)
    })

    it('filename property matches getReportFilename result for markdown', () => {
      const result = routeReport(testReportMarkdown, 'md', 'file')
      const expected = getReportFilename('md')
      expect(result.filename).toBe(expected)
    })
  })

  // =========================================================================
  // Edge Cases and Cross-Cutting Concerns
  // =========================================================================

  describe('Edge Cases', () => {
    it('handles empty report string', () => {
      const result = routeReport('', 'text', 'console')
      expect(mockCoreInfo).toHaveBeenCalledWith('')
      expect(result.logged).toBe(true)
    })

    it('handles very long report strings', () => {
      const longReport = 'x'.repeat(10000)
      const result = routeReport(longReport, 'text', 'both')
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.txt', longReport)
      expect(mockCoreInfo).toHaveBeenCalledWith(longReport)
    })

    it('handles report with special characters', () => {
      const special = 'Coverage: 100%\nColor: 🎨\n"Special"\n[Brackets]\n{Braces}'
      const result = routeReport(special, 'text', 'both')
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.txt', special)
      expect(mockCoreInfo).toHaveBeenCalledWith(special)
    })

    it('handles newlines and whitespace in report', () => {
      const multiline = 'Line 1\nLine 2\n\nLine 4 with spaces  \n'
      const result = routeReport(multiline, 'text', 'file')
      expect(mockFsWriteFileSync).toHaveBeenCalledWith('code-coverage-results.txt', multiline)
    })

    it('file write failure does not create file and returns error', () => {
      mockFsWriteFileSync.mockImplementation(() => {
        throw new Error('EACCES: permission denied')
      })
      const result = routeReport(testReport, 'text', 'file')
      expect(result.fileWritten).toBe(false)
      expect(result.error).toContain('permission denied')
      expect(result.filename).toBeUndefined()
    })
  })

  // =========================================================================
  // Integration Tests
  // =========================================================================

  describe('Integration', () => {
    it('sequences multiple routing calls correctly', () => {
      routeReport('Report 1', 'text', 'console')
      routeReport('Report 2', 'text', 'file')
      routeReport('Report 3', 'md', 'both')

      expect(mockCoreInfo.mock.calls.length).toBeGreaterThan(0)
      expect(mockFsWriteFileSync.mock.calls.length).toBeGreaterThan(0)
    })

    it('maintains independent state across multiple calls', () => {
      const result1 = routeReport(testReport, 'text', 'console')
      const result2 = routeReport(testReport, 'text', 'file')
      
      // First call should only log
      expect(result1.logged).toBe(true)
      expect(result1.fileWritten).toBe(false)
      
      // Second call should only write file
      expect(result2.logged).toBe(false)
      expect(result2.fileWritten).toBe(true)
    })
  })
})
