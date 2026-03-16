import * as fs from 'node:fs'
import * as path from 'node:path'

const infoMessages: string[] = []
const failedMessages: string[] = []
const debugMessages: string[] = []
const inputValues: Record<string, string> = {}

function getInput(name: string, options?: { required?: boolean; trimWhitespace?: boolean }): string {
  const value = inputValues[name] ?? ''
  if (options?.required && !value) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  if (options?.trimWhitespace === false) {
    return value
  }
  return value.trim()
}

function debug(message: string): void {
  debugMessages.push(message)
}

function info(message: string): void {
  infoMessages.push(message)
}

function setFailed(message: string): void {
  failedMessages.push(message)
  process.exitCode = 1
}

function resetActionTestState(): void {
  infoMessages.length = 0
  failedMessages.length = 0
  debugMessages.length = 0
  process.exitCode = 0
  for (const key of Object.keys(inputValues)) {
    delete inputValues[key]
  }
}

function setActionInputs(inputs: Record<string, string>): void {
  for (const key of Object.keys(inputValues)) {
    delete inputValues[key]
  }
  for (const [key, value] of Object.entries(inputs)) {
    inputValues[key] = value
  }
}

function getInfoMessages(): string[] {
  return [...infoMessages]
}

function getFailedMessages(): string[] {
  return [...failedMessages]
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join('/')
}

function toRegex(globPattern: string): RegExp {
  const doubleStarPatterns: string[] = []

  const withDoubleStarTokens = globPattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\/?/g, token => {
      const replacement = token === '**/' ? '(?:.*/)?' : '.*'
      doubleStarPatterns.push(replacement)
      return `::DOUBLE_STAR_${doubleStarPatterns.length - 1}::`
    })

  const withSingleStarPatterns = withDoubleStarTokens
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')

  const escaped = doubleStarPatterns.reduce((current, replacement, index) => {
    return current.replace(`::DOUBLE_STAR_${index}::`, replacement)
  }, withSingleStarPatterns)

  return new RegExp(`^${escaped}$`)
}

function collectFiles(root: string): string[] {
  const stack = [root]
  const files: string[] = []

  while (stack.length > 0) {
    const current = stack.pop()
    if (!current) {
      continue
    }

    try {
      const entries = fs.readdirSync(current, { withFileTypes: true })
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name)
        if (entry.isDirectory()) {
          stack.push(fullPath)
        } else if (entry.isFile()) {
          files.push(fullPath)
        }
      }
    } catch (err) {
      continue
    }
  }

  return files
}

function resolveWorkspaceRoot(): string {
  return process.env.GITHUB_WORKSPACE || process.cwd()
}

async function defaultGlobImplementation(patterns: string): Promise<{ glob(): Promise<string[]> }> {
  const patternList = patterns
    .split(/\r?\n/)
    .map(pattern => pattern.trim())
    .filter(pattern => pattern.length > 0)

  return {
    async glob(): Promise<string[]> {
      const workspace = resolveWorkspaceRoot()
      const allFiles = collectFiles(workspace)
      const uniqueMatches = new Set<string>()

      for (const pattern of patternList) {
        const regex = toRegex(normalizePath(pattern))

        for (const filePath of allFiles) {
          const relative = normalizePath(path.relative(workspace, filePath))
          if (regex.test(relative)) {
            uniqueMatches.add(filePath)
          }
        }
      }

      return Array.from(uniqueMatches).sort((a, b) =>
        normalizePath(path.relative(workspace, a)).localeCompare(
          normalizePath(path.relative(workspace, b))
        )
      )
    }
  }
}

jest.mock('@actions/core', () => ({
  debug,
  getInput,
  info,
  setFailed
}), { virtual: true });

jest.mock('@actions/glob', () => ({
  create: jest.fn<Promise<{ glob(): Promise<string[]> }>, [string]>().mockImplementation(defaultGlobImplementation)
}), { virtual: true });

import { discoverCoverageFiles, parseCoveragePatterns } from '../src/file-discovery'
import { run } from '../src/index'

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
