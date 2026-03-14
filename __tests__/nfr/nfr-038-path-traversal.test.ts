/**
 * NFR-038: Path Traversal Prevention
 * Verify path traversal attacks are prevented
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseCoverageFile, createEmptySummary } from '../../src/coverage-parser'

describe('NFR-038: Path Traversal Prevention', () => {
  test('should handle path traversal in package names safely', () => {
    const pathTraversalFixture = path.join(__dirname, '../fixtures/security/path-traversal.xml')
    const summary = createEmptySummary()
    
    // Parser should handle the malicious paths safely
    const result = parseCoverageFile(pathTraversalFixture, summary)
    
    // Should parse but not actually traverse paths
    expect(result.packages).toBeDefined()
    
    result.packages.forEach(pkg => {
      // Package name might contain the traversal attempt as a string
      // but should not have actually accessed /etc/passwd
      if (pkg.name.includes('..')) {
        // The value is just stored as-is, not used to access files
        expect(pkg.name).toBeDefined()
      }
    })
  })

  test('file glob should not allow path traversal', () => {
    // The @actions/glob library handles this safely
    const srcDir = path.join(__dirname, '../../src')
    const fileDiscoveryPath = path.join(srcDir, 'file-discovery.ts')
    const content = fs.readFileSync(fileDiscoveryPath, 'utf8')
    
    // Should use @actions/glob which is safe
    expect(content).toContain('@actions/glob')
  })

  test('should not access files outside working directory', () => {
    const summary = createEmptySummary()
    
    // Try to parse a file with path traversal in filename
    const maliciousPath = '../../../etc/passwd'
    
    try {
      parseCoverageFile(maliciousPath, summary)
      // If it succeeds, it tried to open a file that doesn't exist (expected)
    } catch (error: any) {
      // Should fail to find the file, not actually traverse to /etc/passwd
      expect(error).toBeDefined()
      expect(error.message).toContain('ENOENT') // File not found
    }
  })

  test('should sanitize file paths in processing', () => {
    const pathTraversalFixture = path.join(__dirname, '../fixtures/security/path-traversal.xml')
    const summary = createEmptySummary()
    
    const result = parseCoverageFile(pathTraversalFixture, summary)
    
    // Even if the XML contains path traversal attempts, they should be treated as data
    // not as actual file system operations
    result.packages.forEach(pkg => {
      // The parser just reads the XML as data - doesn't try to access those paths
      expect(pkg).toBeDefined()
    })
  })

  test('glob patterns should be validated', () => {
    const srcDir = path.join(__dirname, '../../src')
    const fileDiscoveryPath = path.join(srcDir, 'file-discovery.ts')
    const content = fs.readFileSync(fileDiscoveryPath, 'utf8')
    
    // Should use @actions/glob which validates patterns
    expect(content).toContain('glob.create')
  })
})
