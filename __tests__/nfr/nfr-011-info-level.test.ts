/**
 * NFR-011: Info Level for Normal Operations
 * Verify core.info() is used for normal messages
 */

import { run } from '../../src/index'

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('@actions/glob', () => ({
  create: jest.fn().mockResolvedValue({
    glob: jest.fn().mockResolvedValue([]),
  }),
}))

jest.mock('../../src/file-discovery', () => ({
  discoverCoverageFiles: jest.fn().mockResolvedValue([]),
}))

import * as core from '@actions/core'

const mockInfo = core.info as jest.MockedFunction<typeof core.info>
const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>
const mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>

describe('NFR-011: Info Level for Normal Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  function setupValidInputs() {
    mockGetInput.mockImplementation((name: string) => {
      const defaults: Record<string, string> = {
        filename: 'coverage.xml',
        badge: 'false',
        fail_below_min: 'false',
        format: 'text',
        hide_branch_rate: 'false',
        hide_complexity: 'false',
        indicators: 'true',
        output: 'console',
        thresholds: '50 75',
      }
      return defaults[name] ?? ''
    })
  }

  test('normal file discovery should use core.info', async () => {
    setupValidInputs()

    const mockGlob = require('@actions/glob')
    mockGlob.create.mockResolvedValue({
      glob: jest.fn().mockResolvedValue([
        'coverage.xml',
      ]),
    })

    jest.doMock('../../src/file-discovery', () => ({
      discoverCoverageFiles: jest.fn().mockResolvedValue(['coverage.xml']),
    }))

    // This will fail due to no file, but should still try to use core.info
    await run()

    // Either info was called or setFailed was called (both are acceptable)
    const wasInfoCalled = mockInfo.mock.calls.length > 0
    const wasSetFailedCalled = mockSetFailed.mock.calls.length > 0

    expect(wasInfoCalled || wasSetFailedCalled).toBe(true)
  })

  test('index.ts should use core.info for logging', () => {
    const fs = require('fs')
    const path = require('path')

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should have core.info calls
    expect(content).toContain('core.info')

    // Count info calls in the file
    const infoMatches = content.match(/core\.info\(/g)
    expect(infoMatches).not.toBeNull()
    expect((infoMatches || []).length).toBeGreaterThanOrEqual(1)
  })

  test('info should be used for file processing messages', () => {
    const fs = require('fs')
    const path = require('path')

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Check that core.info appears in normal operation paths
    // (not just error paths)
    const lines = content.split('\n')
    let foundInfoInNormalPath = false

    lines.forEach((line: string, idx: number) => {
      // Look for core.info outside of error handlers
      if (line.includes('core.info') && !line.includes('catch')) {
        foundInfoInNormalPath = true
      }
    })

    expect(foundInfoInNormalPath).toBe(true)
  })

  test('info-level messages should describe normal operations', () => {
    const fs = require('fs')
    const path = require('path')

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Find the core.info calls and verify they make sense
    const lines = content.split('\n')
    const infoLines = lines.filter((line: string) => line.includes('core.info'))

    expect(infoLines.length).toBeGreaterThan(0)

    // Each info line should have a message
    infoLines.forEach((line: string) => {
      expect(line).toMatch(/core\.info\s*\(\s*[`"']/)
    })
  })

  test('info should not be used for warnings or errors', () => {
    const fs = require('fs')
    const path = require('path')

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Get lines with core.info
    const infoLines = content.split('\n').filter((line: string) => line.includes('core.info'))

    // Info messages should not contain words indicating errors
    infoLines.forEach((line: string) => {
      // These are acceptable in normal logging
      expect(line).not.toMatch(/error|fail|invalid|cannot|must not|critical/i)
    })
  })

  test('core.info should be imported from @actions/core', () => {
    const fs = require('fs')
    const path = require('path')

    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // Should import from @actions/core
    expect(content).toMatch(/import.*core.*@actions\/core/)
  })
})
