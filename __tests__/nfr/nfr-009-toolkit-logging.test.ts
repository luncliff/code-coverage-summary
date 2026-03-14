/**
 * NFR-009: GitHub Actions Toolkit Logging
 * Verify no console.log/console.error are used in source code
 * All logging must use @actions/core methods
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

jest.mock('@actions/glob', () => ({
  create: jest.fn(),
}))

describe('NFR-009: GitHub Actions Toolkit Logging', () => {
  test('source code should not use console.log', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')
      const lines = content.split('\n')

      lines.forEach((line, idx) => {
        // Skip comments and type definitions
        const trimmed = line.trim()
        if (!trimmed.startsWith('//') && !trimmed.startsWith('*')) {
          expect(line).not.toContain('console.log')
        }
      })
    })
  })

  test('source code should not use console.error', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')
      const lines = content.split('\n')

      lines.forEach((line, idx) => {
        const trimmed = line.trim()
        if (!trimmed.startsWith('//') && !trimmed.startsWith('*')) {
          expect(line).not.toContain('console.error')
        }
      })
    })
  })

  test('source code should not use console.warn', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')
      expect(content).not.toContain('console.warn')
    })
  })

  test('source code should not use console.debug', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')
      expect(content).not.toContain('console.debug')
    })
  })

  test('index.ts should import @actions/core for logging', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should import @actions/core
    expect(content).toContain('@actions/core')
    expect(content).toContain("import * as core from '@actions/core'")
  })

  test('index.ts should use core.info for normal operations', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should have at least one core.info call
    expect(content).toContain('core.info')
  })

  test('index.ts should use core.setFailed for errors', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should use core.setFailed for error reporting
    expect(content).toContain('core.setFailed')
  })

  test('should not use any console methods in production code', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')

      // Check for any console.* pattern
      const consoleMatches = content.match(/console\.\w+\s*\(/g)
      if (consoleMatches) {
        consoleMatches.forEach(match => {
          // All console calls should be in comments or test code (not applicable here)
          expect(content).not.toContain(match)
        })
      }
    })
  })

  test('@actions/core should be the only logging method', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const indexPath = path.join(sourceDir, 'index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should import core
    expect(content).toMatch(/import.*@actions\/core/)

    // Should NOT import other logging libraries
    expect(content).not.toContain("from 'winston'")
    expect(content).not.toContain("from 'pino'")
    expect(content).not.toContain("from 'bunyan'")
    expect(content).not.toContain("from 'log4js'")
    expect(content).not.toContain("from 'debug'")
  })

  test('logging calls should use correct core methods', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Valid core methods: info, warning, error, debug, setFailed
    // Count each usage to ensure logging is happening
    expect(content).toContain('core.info')
    expect(content).toContain('core.setFailed')

    // Should not call non-existent methods
    expect(content).not.toContain('core.log(')
    expect(content).not.toContain('core.print(')
  })
})
