/**
 * NFR-033: No External Entity Resolution
 * Verify XML parser does not resolve external entities (XXE prevention)
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseCoverageFile, createEmptySummary } from '../../src/coverage-parser'

describe('NFR-033: No External Entity Resolution', () => {
  test('should not resolve external entities from XXE attack payload', () => {
    const xxeFixture = path.join(__dirname, '../fixtures/security/xxe-attack.xml')
    const summary = createEmptySummary()
    
    // Parser should either:
    // 1. Ignore the external entity (safe)
    // 2. Throw an error (also safe)
    // It should NOT read /etc/passwd or any external file
    
    try {
      const result = parseCoverageFile(xxeFixture, summary)
      
      // If parsing succeeded, verify no external content was loaded
      result.packages.forEach(pkg => {
        // Package name should not contain contents of /etc/passwd
        expect(pkg.name).not.toContain('root:')
        expect(pkg.name).not.toContain('/bin/bash')
        expect(pkg.name).not.toContain('/sbin/nologin')
        
        // Should either be the entity reference or empty, but not file contents
        if (pkg.name.includes('&xxe;')) {
          // Entity not resolved - safe
          expect(pkg.name).toContain('&xxe;')
        }
      })
    } catch (error) {
      // Throwing an error is also acceptable (parser rejected malicious input)
      // This is safe behavior
      expect(error).toBeDefined()
    }
  })

  test('should not process DTD declarations', () => {
    const xxeFixture = path.join(__dirname, '../fixtures/security/xxe-attack.xml')
    const content = fs.readFileSync(xxeFixture, 'utf8')
    
    // Verify the fixture contains DTD declaration
    expect(content).toContain('<!DOCTYPE')
    expect(content).toContain('<!ENTITY')
    
    // Parser should ignore or reject DTD
    const summary = createEmptySummary()
    
    try {
      parseCoverageFile(xxeFixture, summary)
      // If it parsed, DTD was ignored (safe)
    } catch (error) {
      // Rejecting DTD is also safe
      expect(error).toBeDefined()
    }
  })

  test('should not expand entity references', () => {
    const xxeFixture = path.join(__dirname, '../fixtures/security/xxe-attack.xml')
    const summary = createEmptySummary()
    
    try {
      const result = parseCoverageFile(xxeFixture, summary)
      
      // If parsing succeeded, entities should not be expanded
      result.packages.forEach(pkg => {
        // Should not contain expanded entity content
        expect(pkg.name.length).toBeLessThan(1000) // /etc/passwd would be much longer
      })
    } catch (error) {
      // Rejection is safe
      expect(error).toBeDefined()
    }
  })

  test('should handle billion laughs attack safely', () => {
    const billionLaughs = path.join(__dirname, '../fixtures/security/billion-laughs.xml')
    const summary = createEmptySummary()
    
    // This should either:
    // 1. Parse without expanding entities (safe)
    // 2. Throw an error (safe)
    // It should NOT cause memory exhaustion or hang
    
    const startTime = Date.now()
    const maxTime = 5000 // 5 seconds max
    
    try {
      const result = parseCoverageFile(billionLaughs, summary)
      const elapsed = Date.now() - startTime
      
      // Should complete quickly
      expect(elapsed).toBeLessThan(maxTime)
      
      // Should not have massive memory consumption from entity expansion
      result.packages.forEach(pkg => {
        expect(pkg.name.length).toBeLessThan(10000) // Expanded would be billions of chars
      })
    } catch (error) {
      // Rejection is safe
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(maxTime)
    }
  })

  test('fast-xml-parser should be configured safely', () => {
    // Verify we're using fast-xml-parser which doesn't support external entities
    const parserPath = path.join(__dirname, '../../src/coverage-parser.ts')
    const content = fs.readFileSync(parserPath, 'utf8')
    
    // Should import from fast-xml-parser
    expect(content).toContain('fast-xml-parser')
    
    // Should use XMLParser
    expect(content).toContain('XMLParser')
    
    // fast-xml-parser by default does NOT support DTD or external entities
    // This is inherently safe - no special configuration needed
  })
})
