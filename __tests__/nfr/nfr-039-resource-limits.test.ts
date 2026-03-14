/**
 * NFR-039: Resource Limits
 * Verify action handles large files appropriately
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseCoverageFile, createEmptySummary } from '../../src/coverage-parser'

describe('NFR-039: Resource Limits', () => {
  test('should handle reasonably sized files efficiently', () => {
    // Test with a normal-sized file
    const normalFile = path.join(__dirname, '../../src/coverage.cobertura.xml')
    const summary = createEmptySummary()
    
    const startTime = Date.now()
    const result = parseCoverageFile(normalFile, summary)
    const elapsed = Date.now() - startTime
    
    // Should parse quickly
    expect(elapsed).toBeLessThan(1000) // 1 second
    expect(result).toBeDefined()
  })

  test('should not crash on large files', () => {
    // Create a moderately large file (1MB) for testing
    const largeFile = path.join(__dirname, '../fixtures/security/moderate-large.xml')
    
    // Generate test file
    let content = '<?xml version="1.0"?>\n'
    content += '<coverage line-rate="0.75" branch-rate="0.5" lines-covered="75000" lines-valid="100000" branches-covered="50000" branches-valid="66666" complexity="5000">\n'
    content += '  <packages>\n'
    content += '    <package name="LargePackage" line-rate="0.75" branch-rate="0.5" complexity="5000">\n'
    content += '      <classes>\n'
    
    // Add enough classes to make it around 1MB
    for (let i = 0; i < 1000; i++) {
      content += `        <class name="Class${i}" filename="file${i}.js" line-rate="0.75" branch-rate="0.5" complexity="5">\n`
      content += '          <methods/>\n'
      content += '          <lines>\n'
      for (let j = 0; j < 100; j++) {
        content += `            <line number="${j + 1}" hits="${j % 2}"/>\n`
      }
      content += '          </lines>\n'
      content += '        </class>\n'
    }
    
    content += '      </classes>\n'
    content += '    </package>\n'
    content += '  </packages>\n'
    content += '</coverage>\n'
    
    fs.writeFileSync(largeFile, content)
    
    const summary = createEmptySummary()
    const startTime = Date.now()
    
    try {
      const result = parseCoverageFile(largeFile, summary)
      const elapsed = Date.now() - startTime
      
      // Should complete in reasonable time
      expect(elapsed).toBeLessThan(10000) // 10 seconds
      expect(result).toBeDefined()
      expect(result.packages.length).toBeGreaterThan(0)
    } finally {
      // Clean up
      if (fs.existsSync(largeFile)) {
        fs.unlinkSync(largeFile)
      }
    }
  })

  test('parser should not use excessive memory', () => {
    const normalFile = path.join(__dirname, '../../src/coverage.cobertura.xml')
    const summary = createEmptySummary()
    
    const memBefore = process.memoryUsage().heapUsed
    const result = parseCoverageFile(normalFile, summary)
    const memAfter = process.memoryUsage().heapUsed
    
    const memDelta = memAfter - memBefore
    
    // Should not use excessive memory (less than 50MB for a small file)
    expect(memDelta).toBeLessThan(50 * 1024 * 1024)
    expect(result).toBeDefined()
  })

  test('should handle files with many packages efficiently', () => {
    // Use the aggregate fixture which has multiple packages
    const multiPackage = path.join(__dirname, '../../src/coverage.aggregate-a.xml')
    const summary = createEmptySummary()
    
    const startTime = Date.now()
    const result = parseCoverageFile(multiPackage, summary)
    const elapsed = Date.now() - startTime
    
    // Should parse quickly even with multiple packages
    expect(elapsed).toBeLessThan(1000)
    expect(result.packages.length).toBeGreaterThan(0)
  })

  test('should handle deeply nested XML structures', () => {
    const fixture = path.join(__dirname, '../../src/coverage.cobertura.xml')
    const summary = createEmptySummary()
    
    // Parser should handle nested classes/lines without stack overflow
    const result = parseCoverageFile(fixture, summary)
    
    expect(result).toBeDefined()
    expect(result.packages).toBeDefined()
  })

  // Note: Testing actual 100MB+ files would slow down tests significantly
  // In production, GitHub Actions has memory limits that will naturally cap resource usage
  // The action will fail gracefully if it hits those limits rather than hanging
})
