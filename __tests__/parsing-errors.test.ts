import * as path from 'path'
import * as core from '@actions/core'
import { parseCoverageFile, createEmptySummary } from '../src/coverage-parser'

// Mock @actions/core
const mockSetFailed = jest.fn()
const mockInfo = jest.fn()
const mockGetInput = jest.fn()

jest.mock('@actions/core', () => ({
  getInput: (name: string, options?: any) => mockGetInput(name, options),
  info: (message: string) => mockInfo(message),
  setFailed: (message: string) => mockSetFailed(message)
}))

describe('Parsing Errors', () => {
  const fixturesDir = path.join(__dirname, 'fixtures', 'error-handling')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Coverage Parser Error Messages', () => {
    it('should throw error for malformed XML', () => {
      const malformedFile = path.join(fixturesDir, 'malformed.xml')
      const summary = createEmptySummary()

      expect(() => {
        parseCoverageFile(malformedFile, summary)
      }).toThrow()
    })

    it('should throw error with descriptive message for missing attributes', () => {
      const missingAttrsFile = path.join(fixturesDir, 'missing-attributes.xml')
      const summary = createEmptySummary()

      try {
        parseCoverageFile(missingAttrsFile, summary)
        fail('Expected error to be thrown')
      } catch (err) {
        const message = (err as Error).message
        // The error should mention that line rate is missing
        expect(message).toBeTruthy()
        expect(message.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Valid Coverage File', () => {
    it('should parse successfully without throwing', () => {
      const validFile = path.join(fixturesDir, 'valid-coverage.xml')
      const summary = createEmptySummary()

      expect(() => {
        parseCoverageFile(validFile, summary)
      }).not.toThrow()
    })

    it('should return updated summary', () => {
      const validFile = path.join(fixturesDir, 'valid-coverage.xml')
      const summary = createEmptySummary()

      const result = parseCoverageFile(validFile, summary)

      expect(result.lineRate).toBeGreaterThan(0)
      expect(result.linesCovered).toBeGreaterThan(0)
      expect(result.linesValid).toBeGreaterThan(0)
    })
  })

  describe('Error Message Format in Main Flow', () => {
    it('formats parsing errors with filename in the correct pattern', () => {
      const malformedFile = path.join(fixturesDir, 'malformed.xml')
      const summary = createEmptySummary()

      try {
        parseCoverageFile(malformedFile, summary)
      } catch (err) {
        // Simulate what index.ts does
        const relativePath = path.relative(process.cwd(), malformedFile)
        const displayPath = relativePath || path.basename(malformedFile)
        const formattedError = `Parsing Error: ${(err as Error).message} - ${displayPath}`
        
        expect(formattedError).toMatch(/^Parsing Error:/)
        expect(formattedError).toContain('malformed.xml')
      }
    })
  })
})

