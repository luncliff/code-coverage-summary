import * as path from 'path'
import {
  getFailedMessages,
  getInfoMessages,
  resetActionTestState,
  setActionInputs
} from './helpers/action-test-harness'

const { discoverCoverageFiles, parseCoveragePatterns } = require('../src/file-discovery')
const { run } = require('../src/index')

const FIXTURES_ROOT = path.join(__dirname, 'fixtures', 'file-discovery')
const WORKSPACE_ROOT = FIXTURES_ROOT
const ORIGINAL_CWD = process.cwd()
const ORIGINAL_WORKSPACE = process.env.GITHUB_WORKSPACE
const BASE_INPUTS = {
  badge: 'false',
  fail_below_min: 'false',
  format: 'text',
  hide_branch_rate: 'false',
  hide_complexity: 'false',
  indicators: 'true',
  output: 'console',
  thresholds: '50 75'
}

function normalizeWorkspacePath(filePath: string): string {
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(WORKSPACE_ROOT, filePath)
  return path.relative(WORKSPACE_ROOT, absolute).split(path.sep).join('/')
}

async function runAction(filename: string): Promise<string[]> {
  resetActionTestState()
  setActionInputs({ ...BASE_INPUTS, filename })
  await run()
  return getInfoMessages().filter(message => message.startsWith('Coverage File:'))
}

beforeEach(() => {
  resetActionTestState()
  process.env.GITHUB_WORKSPACE = WORKSPACE_ROOT
  process.chdir(WORKSPACE_ROOT)
})

afterEach(() => {
  process.chdir(ORIGINAL_CWD)
  if (ORIGINAL_WORKSPACE === undefined) {
    delete process.env.GITHUB_WORKSPACE
  } else {
    process.env.GITHUB_WORKSPACE = ORIGINAL_WORKSPACE
  }
})

describe('parseCoveragePatterns', () => {
  test('splits comma-separated patterns, trims whitespace, and ignores empty entries', () => {
    const patterns = parseCoveragePatterns(
      ' coverage/**/*.xml, , reports/coverage.xml, coverage/unit.xml , ,'
    )

    expect(patterns).toEqual([
      'coverage/**/*.xml',
      'reports/coverage.xml',
      'coverage/unit.xml'
    ])
  })
})

describe('discoverCoverageFiles', () => {
  test('resolves workspace-relative globbing for all patterns', async () => {
    const files = await discoverCoverageFiles([
      'coverage/**/*.xml',
      'reports/coverage.xml'
    ])
    const relativeFiles = files.map(normalizeWorkspacePath)

    expect(relativeFiles).toEqual([
      'coverage/integration.xml',
      'coverage/unit.xml',
      'reports/coverage.xml'
    ])
  })
})

describe('action file discovery behavior', () => {
  test('fails with the expected message when no coverage files match', async () => {
    resetActionTestState()
    setActionInputs({ ...BASE_INPUTS, filename: 'missing/**/*.xml' })
    await run()

    expect(getFailedMessages()).toEqual([
      'Error: No files found matching glob pattern.'
    ])
  })

  test('logs each discovered coverage file once in deterministic order', async () => {
    const logs = await runAction(
      'coverage/**/*.xml, coverage/unit.xml, reports/coverage.xml, coverage/**/unit.xml'
    )
    const relativeLogs = logs.map(message =>
      normalizeWorkspacePath(message.replace('Coverage File: ', ''))
    )

    expect(relativeLogs).toEqual([
      'coverage/integration.xml',
      'coverage/unit.xml',
      'reports/coverage.xml'
    ])
    expect(new Set(relativeLogs).size).toBe(relativeLogs.length)
  })

  test('produces the same coverage file log ordering across runs', async () => {
    const firstRun = (await runAction('coverage/**/*.xml, reports/coverage.xml')).map(
      message => normalizeWorkspacePath(message.replace('Coverage File: ', ''))
    )
    const secondRun = (await runAction('coverage/**/*.xml, reports/coverage.xml')).map(
      message => normalizeWorkspacePath(message.replace('Coverage File: ', ''))
    )

    expect(secondRun).toEqual(firstRun)
  })
})
