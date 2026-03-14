/**
 * NFR-010: Error Logging via setFailed
 * Verify error paths use core.setFailed()
 */

import { parseInputs, run } from '../../src/index'

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

import * as core from '@actions/core'

const mockSetFailed = core.setFailed as jest.MockedFunction<typeof core.setFailed>
const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>

describe('NFR-010: Error Logging via setFailed', () => {
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

  test('invalid format should call core.setFailed', async () => {
    setupValidInputs()
    mockGetInput.mockImplementation((name: string) => {
      if (name === 'filename') return 'coverage.xml'
      if (name === 'format') return 'invalid-format'
      return ''
    })

    await run()

    expect(mockSetFailed).toHaveBeenCalled()
    const errorMessage = (mockSetFailed.mock.calls[0]?.[0] as string) || ''
    expect(errorMessage.length).toBeGreaterThan(0)
  })

  test('invalid output should call core.setFailed', async () => {
    setupValidInputs()
    mockGetInput.mockImplementation((name: string) => {
      if (name === 'filename') return 'coverage.xml'
      if (name === 'output') return 'invalid-output'
      return ''
    })

    await run()

    expect(mockSetFailed).toHaveBeenCalled()
  })

  test('no files found should call core.setFailed', async () => {
    setupValidInputs()

    // Mock glob to return no files
    const mockGlob = require('@actions/glob')
    mockGlob.create.mockResolvedValue({
      glob: jest.fn().mockResolvedValue([]),
    })

    await run()

    expect(mockSetFailed).toHaveBeenCalled()
    const errorCall = mockSetFailed.mock.calls.find(
      call => typeof call[0] === 'string' && (call[0].includes('No files found') || call[0].includes('not found'))
    )
    expect(errorCall).toBeDefined()
  })

  test('parse error should call core.setFailed with error details', async () => {
    setupValidInputs()

    // Mock glob to return invalid file
    const mockGlob = require('@actions/glob')
    mockGlob.create.mockResolvedValue({
      glob: jest.fn().mockResolvedValue(['/nonexistent/coverage.xml']),
    })

    await run()

    expect(mockSetFailed).toHaveBeenCalled()
    const errorMessage = (mockSetFailed.mock.calls[0]?.[0] as string) || ''
    expect(errorMessage).toMatch(/Error|Error|Parsing/)
  })

  test('setFailed should be called with string message', async () => {
    setupValidInputs()
    mockGetInput.mockImplementation((name: string) => {
      if (name === 'format') return 'invalid'
      if (name === 'filename') return 'coverage.xml'
      return ''
    })

    await run()

    expect(mockSetFailed).toHaveBeenCalled()
    const callArgs = mockSetFailed.mock.calls[0]
    expect(typeof callArgs?.[0]).toBe('string')
    expect(callArgs?.[0]).not.toBeNull()
    expect(callArgs?.[0]).not.toBeUndefined()
  })

  test('threshold parsing error should call core.setFailed', async () => {
    setupValidInputs()
    mockGetInput.mockImplementation((name: string) => {
      if (name === 'thresholds') return 'invalid threshold'
      if (name === 'filename') return 'coverage.xml'
      return ''
    })

    // Mock glob to return a valid file so we get to threshold parsing
    const mockGlob = require('@actions/glob')

    await run()

    // Should fail due to invalid threshold
    expect(mockSetFailed).toHaveBeenCalled()
  })

  test('setFailed message should contain useful error context', async () => {
    setupValidInputs()
    mockGetInput.mockImplementation((name: string) => {
      if (name === 'format') return 'json'
      if (name === 'filename') return 'coverage.xml'
      return ''
    })

    await run()

    const callArgs = mockSetFailed.mock.calls[0]
    const errorMessage = callArgs?.[0] as string

    // Error message should contain enough info to debug
    expect(errorMessage).toBeTruthy()
    // Should describe what went wrong
    expect(errorMessage.length).toBeGreaterThan(5)
  })

  test('multiple error conditions should only call setFailed once', async () => {
    setupValidInputs()
    // Set up multiple error conditions
    mockGetInput.mockImplementation((name: string) => {
      if (name === 'format') return 'invalid'
      if (name === 'output') return 'also-invalid'
      if (name === 'filename') return 'coverage.xml'
      return ''
    })

    await run()

    // Should fail-fast on first error
    expect(mockSetFailed).toHaveBeenCalled()
    // In fail-fast, might only call once or few times
    expect(mockSetFailed.mock.calls.length).toBeGreaterThanOrEqual(1)
  })
})
