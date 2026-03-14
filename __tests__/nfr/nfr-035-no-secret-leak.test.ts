/**
 * NFR-035: No Secret Leakage
 * Verify no secrets are logged in any scenario
 */

import * as fs from 'fs'
import * as path from 'path'

describe('NFR-035: No Secret Leakage', () => {
  test('should not log environment variables', () => {
    const srcDir = path.join(__dirname, '../../src')
    const tsFiles = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.ts') && !f.includes('CodeCoverageSummary'))
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8')
      
      // Should not log process.env
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        if (line.includes('core.info') || line.includes('core.debug') || line.includes('core.warning')) {
          // Should not log environment in these calls
          expect(line).not.toContain('process.env')
        }
      })
    })
  })

  test('should not include secrets in error messages', () => {
    const srcDir = path.join(__dirname, '../../src')
    const tsFiles = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.ts') && !f.includes('CodeCoverageSummary'))
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8')
      
      // Should not log secrets in setFailed or error
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        if (line.includes('setFailed') || line.includes('core.error')) {
          // Should not include environment variables
          expect(line).not.toContain('process.env')
        }
      })
    })
  })

  test('error messages should be generic and safe', () => {
    const srcDir = path.join(__dirname, '../../src')
    const tsFiles = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.ts') && !f.includes('CodeCoverageSummary'))
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8')
      
      // Error messages should not reveal internal paths
      if (content.includes('setFailed') || content.includes('throw new Error')) {
        // Should not include __dirname in error messages
        const lines = content.split('\n')
        lines.forEach((line, idx) => {
          if (line.includes('setFailed') || line.includes('throw')) {
            // Check if error message includes sensitive data
            // Allow __dirname in file operations but not in error messages
            if (line.includes('Error(') || line.includes('setFailed(')) {
              expect(line).not.toMatch(/Error\([^)]*__dirname/)
              expect(line).not.toMatch(/setFailed\([^)]*__dirname/)
            }
          }
        })
      }
    })
  })

  test('should not expose GitHub secrets in any logs', () => {
    // This is enforced by using @actions/core which automatically masks secrets
    const srcDir = path.join(__dirname, '../../src')
    const tsFiles = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.ts') && !f.includes('CodeCoverageSummary'))
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8')
      
      // Should use @actions/core for logging
      if (content.includes('console.')) {
        // Should not use console.log (could leak secrets)
        const consoleRegex = /console\.(log|error|warn|info|debug)/
        const matches = content.match(consoleRegex)
        
        // If console usage found, it should be in comments only
        if (matches) {
          const lines = content.split('\n')
          lines.forEach((line, idx) => {
            if (consoleRegex.test(line)) {
              // Should be in a comment
              const trimmed = line.trim()
              expect(trimmed.startsWith('//')).toBe(true)
            }
          })
        }
      }
    })
  })
})
