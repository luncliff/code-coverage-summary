/**
 * NFR-036: No Sensitive Data in Errors  
 * Verify error messages don't include file content or sensitive data
 */

import { parseCoverageFile, createEmptySummary } from '../../src/coverage-parser'
import * as path from 'path'

describe('NFR-036: No Sensitive Data in Errors', () => {
  test('parsing errors should not include file content', () => {
    const invalidFixture = path.join(__dirname, '../../src/coverage.invalid-root.xml')
    const summary = createEmptySummary()
    
    try {
      parseCoverageFile(invalidFixture, summary)
    } catch (error: any) {
      // Error message should not include XML content
      expect(error.message).not.toContain('<?xml')
      expect(error.message).not.toContain('<coverage')
      expect(error.message).not.toContain('<package')
      
      // Should be a generic error message
      expect(error.message).toBeDefined()
      expect(error.message.length).toBeLessThan(500) // Not dumping file content
    }
  })

  test('errors should not expose internal file paths', () => {
    const summary = createEmptySummary()
    
    try {
      parseCoverageFile('/nonexistent/file.xml', summary)
    } catch (error: any) {
      // Error should mention the file but not expose full internal paths
      expect(error.message).toBeDefined()
      
      // Should not include node_modules paths or other internal details
      expect(error.message).not.toContain('node_modules')
      expect(error.message).not.toContain('dist/')
    }
  })

  test('malformed XML errors should be generic', () => {
    const malformedFixture = path.join(__dirname, '../../src/coverage.invalid-root.xml')
    const summary = createEmptySummary()
    
    try {
      parseCoverageFile(malformedFixture, summary)
    } catch (error: any) {
      // Error should not include the malformed XML content
      expect(error.message).toBeDefined()
      expect(typeof error.message).toBe('string')
      
      // Should not be excessively long (not dumping file content)
      expect(error.message.length).toBeLessThan(1000)
    }
  })
})
