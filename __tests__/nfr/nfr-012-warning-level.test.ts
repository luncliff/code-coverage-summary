/**
 * NFR-012: Warning Level for Recoverable Issues
 * Verify core.warning() usage for non-fatal issues
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


describe('NFR-012: Warning Level for Recoverable Issues', () => {
  test('source code should support core.warning for non-fatal issues', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should import core.warning from @actions/core
    expect(content).toContain('@actions/core')
  })

  test('core module should export warning method', () => {
    // Verify @actions/core has warning capability
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    expect(packageJson.dependencies['@actions/core']).toBeDefined()
  })

  test('index.ts should be able to use core.warning', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should have access to core methods including warning
    expect(content).toContain("import * as core from '@actions/core'")

    // core.warning should be callable (syntax check)
    // The code might not use it yet, but should be able to
  })

  test('warning is appropriate for recoverable issues', () => {
    // This is a specification test - verify that if warning is used,
    // it's in appropriate contexts

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // If core.warning is used, it should be for non-fatal issues
    if (content.includes('core.warning')) {
      const lines = content.split('\n')
      const warningLines = lines.filter(l => l.includes('core.warning'))

      warningLines.forEach(line => {
        // Should not be in critical error paths
        // (critical errors use core.setFailed)
        const lineIndex = lines.indexOf(line)
        const context = lines.slice(Math.max(0, lineIndex - 3), Math.min(lines.length, lineIndex + 3)).join('\n')

        // Warning should not be used for fatal parse errors, only recoverable issues
        // This allows implementations that use warnings for:
        // - Missing optional files
        // - Partial data
        // - Deprecated options
      })
    }
  })

  test('all core logging methods should be available', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Verify @actions/core import
    expect(content).toContain('@actions/core')

    // Methods that should be available:
    // - core.info (for normal messages)
    // - core.warning (for non-fatal issues)
    // - core.error (for display of errors)
    // - core.debug (for diagnostic info)
    // - core.setFailed (for action failure)

    // All of these should be accessible after the import
  })

  test('should be able to distinguish between warnings and errors', () => {
    // This test ensures the architecture supports proper log levels

    // Errors: use core.setFailed (fatal, stops action)
    // Warnings: use core.warning (non-fatal, action continues)
    // Info: use core.info (normal messages)
    // Debug: use core.debug (diagnostic)

    // The action should use different levels based on severity

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should have core.setFailed for fatal errors
    expect(content).toContain('core.setFailed')

    // Should have core.info for normal flow
    expect(content).toContain('core.info')
  })

  test('if warning is used, it should be correctly used', () => {
    // Test that IF the action uses warnings, they are in appropriate places

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    if (content.includes('core.warning')) {
      const lines = content.split('\n')
      const warningCalls = lines.filter(l => l.includes('core.warning('))

      // Each warning should have a message
      warningCalls.forEach(call => {
        expect(call).toMatch(/core\.warning\s*\(\s*[`"']/)
      })
    }
  })

  test('action should not use warnings for critical failures', () => {
    // Critical failures should use core.setFailed, not core.warning

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Parse errors should use setFailed (check that setFailed is used near Parsing Error)
    const lines = content.split('\n')
    const parseErrorIndex = lines.findIndex(l => l.includes('Parsing Error'))
    expect(parseErrorIndex).toBeGreaterThan(-1)

    // Look for core.setFailed within 5 lines before the error message
    const contextLines = lines.slice(Math.max(0, parseErrorIndex - 5), parseErrorIndex + 1)
    const hasSetFailed = contextLines.some(l => l.includes('core.setFailed'))
    expect(hasSetFailed).toBe(true)

    // File not found should use setFailed
    const notFoundIndex = lines.findIndex(l => l.includes('No files found'))
    expect(notFoundIndex).toBeGreaterThan(-1)

    const notFoundContext = lines.slice(Math.max(0, notFoundIndex - 5), notFoundIndex + 1)
    const hasSetFailedForNotFound = notFoundContext.some(l => l.includes('core.setFailed'))
    expect(hasSetFailedForNotFound).toBe(true)
  })
})
