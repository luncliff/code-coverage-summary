/**
 * Tests for action input parsing — covers FR-001 through FR-006.
 *
 * Strategy: mock @actions/core so that parseInputs() can be imported and
 * called directly as a pure, synchronous function without any file I/O or
 * GitHub Actions runner environment.
 */

import * as core from '@actions/core'
import { parseInputs } from '../src/index'

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}), { virtual: true });

jest.mock('@actions/glob', () => ({
  create: jest.fn()
}), { virtual: true });

const mockGetInput = core.getInput as jest.MockedFunction<typeof core.getInput>

/** Helper: set up getInput to return `value` for `targetName` and a safe
 *  default for every other input so that parseInputs() does not throw. */
function mockInputs(overrides: Record<string, string> = {}): void {
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
  const merged = { ...defaults, ...overrides }
  mockGetInput.mockImplementation((name: string) => merged[name] ?? '')
}

// ---------------------------------------------------------------------------
// FR-001: declared input names
// ---------------------------------------------------------------------------
describe('FR-001: declared input names', () => {
  beforeEach(() => {
    mockGetInput.mockClear()
    mockInputs()
  })

  it('calls getInput with each of the nine input names declared in action.yml', () => {
    parseInputs()

    // Required input — called with options object
    expect(mockGetInput).toHaveBeenCalledWith('filename', { required: true })

    // Optional boolean inputs
    expect(mockGetInput).toHaveBeenCalledWith('badge')
    expect(mockGetInput).toHaveBeenCalledWith('fail_below_min')
    expect(mockGetInput).toHaveBeenCalledWith('hide_branch_rate')
    expect(mockGetInput).toHaveBeenCalledWith('hide_complexity')
    expect(mockGetInput).toHaveBeenCalledWith('indicators')

    // Optional string inputs
    expect(mockGetInput).toHaveBeenCalledWith('format')
    expect(mockGetInput).toHaveBeenCalledWith('output')
    expect(mockGetInput).toHaveBeenCalledWith('thresholds')

    // Total call count — exactly nine distinct inputs
    expect(mockGetInput).toHaveBeenCalledTimes(9)
  })
})

// ---------------------------------------------------------------------------
// FR-002: default-equivalence contract
// ---------------------------------------------------------------------------
describe('FR-002: default-equivalence contract', () => {
  beforeEach(() => mockGetInput.mockClear())

  it('resolves documented defaults when every optional input is an empty string', () => {
    mockInputs({
      badge: '',
      fail_below_min: '',
      format: '',
      hide_branch_rate: '',
      hide_complexity: '',
      indicators: '',
      output: '',
      thresholds: '',
    })

    const result = parseInputs()

    expect(result.badge).toBe(false)
    expect(result.failBelowMin).toBe(false)
    expect(result.format).toBe('text')
    expect(result.hideBranchRate).toBe(false)
    expect(result.hideComplexity).toBe(false)
    // When indicators receives '' (empty string), strict === 'true' parsing yields false.
    // The action.yml default of 'true' is provided by the GitHub Actions runner when
    // a user omits the input — that scenario is tested in the second test below.
    expect(result.indicators).toBe(false)
    expect(result.output).toBe('console')
    expect(result.thresholdsInput).toBe('50 75')
  })

  it('yields identical resolved values when each default string is provided explicitly (SC-001)', () => {
    mockInputs({
      badge: 'false',
      fail_below_min: 'false',
      format: 'text',
      hide_branch_rate: 'false',
      hide_complexity: 'false',
      indicators: 'true',
      output: 'console',
      thresholds: '50 75',
    })

    const result = parseInputs()

    expect(result.badge).toBe(false)
    expect(result.failBelowMin).toBe(false)
    expect(result.format).toBe('text')
    expect(result.hideBranchRate).toBe(false)
    expect(result.hideComplexity).toBe(false)
    expect(result.indicators).toBe(true)
    expect(result.output).toBe('console')
    expect(result.thresholdsInput).toBe('50 75')
  })
})

// ---------------------------------------------------------------------------
// FR-003 / FR-004 / FR-005: filename parsing
// ---------------------------------------------------------------------------
describe('FR-003/FR-004/FR-005: filename parsing', () => {
  beforeEach(() => mockGetInput.mockClear())

  it('FR-003: splits CSV filenames into separate patterns (SC-003)', () => {
    mockInputs({ filename: 'a.xml,b.xml' })
    const { patterns } = parseInputs()
    expect(patterns).toEqual(['a.xml', 'b.xml'])
  })

  it('FR-004: passes a glob pattern through unchanged as a single element', () => {
    mockInputs({ filename: 'coverage/**/coverage.cobertura.xml' })
    const { patterns } = parseInputs()
    expect(patterns).toEqual(['coverage/**/coverage.cobertura.xml'])
  })

  it('FR-005: preserves spaces that are internal to a path token', () => {
    mockInputs({ filename: 'path with spaces/coverage.xml' })
    const { patterns } = parseInputs()
    expect(patterns).toEqual(['path with spaces/coverage.xml'])
  })

  it('trims leading and trailing whitespace around comma separators', () => {
    mockInputs({ filename: ' a.xml , b.xml ' })
    const { patterns } = parseInputs()
    expect(patterns).toEqual(['a.xml', 'b.xml'])
  })

  it('filters empty tokens produced by consecutive or trailing commas', () => {
    mockInputs({ filename: 'a.xml,,b.xml,' })
    const { patterns } = parseInputs()
    expect(patterns).toEqual(['a.xml', 'b.xml'])
  })
})

// ---------------------------------------------------------------------------
// FR-006: strict boolean input parsing
// ---------------------------------------------------------------------------
/**
 * Every boolean-like input MUST evaluate to `true` only for the
 * case-insensitive string "true" and to `false` for everything else.
 *
 * The `indicators` column for '1', 'yes', 'on', and '' will FAIL before the
 * one-line fix is applied — that is the expected TDD red state.
 */
describe('FR-006: strict boolean input parsing', () => {
  beforeEach(() => mockGetInput.mockClear())

  const booleanInputs = [
    'badge',
    'fail_below_min',
    'hide_branch_rate',
    'hide_complexity',
    'indicators',
  ] as const

  const truthyOnly = [
    ['true', true],
    ['True', true],
    ['TRUE', true],
  ] as const

  const falsyValues = [
    ['false', false],
    ['False', false],
    ['FALSE', false],
    ['1', false],
    ['yes', false],
    ['on', false],
    ['', false],
    ['arbitrary', false],
  ] as const

  const resultKey: Record<typeof booleanInputs[number], keyof ReturnType<typeof parseInputs>> = {
    badge: 'badge',
    fail_below_min: 'failBelowMin',
    hide_branch_rate: 'hideBranchRate',
    hide_complexity: 'hideComplexity',
    indicators: 'indicators',
  }

  for (const inputName of booleanInputs) {
    const key = resultKey[inputName]

    describe(`input: ${inputName}`, () => {
      test.each(truthyOnly)(
        'returns true for %s',
        (rawValue, expected) => {
          mockInputs({ [inputName]: rawValue })
          const result = parseInputs()
          expect(result[key]).toBe(expected)
        }
      )

      test.each(falsyValues)(
        'returns false for %s',
        (rawValue, expected) => {
          mockInputs({ [inputName]: rawValue })
          const result = parseInputs()
          expect(result[key]).toBe(expected)
        }
      )
    })
  }
})
