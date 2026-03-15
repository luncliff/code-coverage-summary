/**
 * NFR-041: Maintenance README structure
 * Verify the compact maintenance README stays aligned with review feedback.
 */

import * as fs from 'fs'
import * as path from 'path'

describe('NFR-041: Maintenance README structure', () => {
  const readmePath = path.join(__dirname, '../../readme.md')
  const instructionsPath = path.join(
    __dirname,
    '../../.github/copilot-instructions.md'
  )

  test('readme should present How To before Status and References', () => {
    const content = fs.readFileSync(readmePath, 'utf8')

    expect(content).toContain('## How To')
    expect(content).toContain('## Status')
    expect(content).toContain('## References')
    expect(content.indexOf('## How To')).toBeLessThan(content.indexOf('## Status'))
    expect(content.indexOf('## Status')).toBeLessThan(
      content.indexOf('## References')
    )
  })

  test('readme should include compact scenario headings and a status badge', () => {
    const content = fs.readFileSync(readmePath, 'utf8')

    expect(content).toContain('### Use with 1 Cobertura file')
    expect(content).toContain('### Use with multiple Cobertura files')
    expect(content).toContain('### Use without threshold')
    expect(content).toContain(
      'actions/workflows/test-action.yml/badge.svg?branch=main'
    )
  })

  test('readme should link requirement summaries to project-requirements and include a sync note', () => {
    const content = fs.readFileSync(readmePath, 'utf8')

    expect(content).toContain('./project-requirements.md#31-functional-requirements')
    expect(content).toContain(
      './project-requirements.md#32-non-functional-requirements'
    )
    expect(content).toContain('Coding Agent sync note:')
  })

  test('copilot instructions should describe source file roles for coding agents', () => {
    const content = fs.readFileSync(instructionsPath, 'utf8')

    expect(content).toContain('## Source Organization')
    expect(content).toContain('`src/index.ts`')
    expect(content).toContain('`src/coverage-parser.ts`')
    expect(content).toContain('`src/output-generator.ts`')
    expect(content).toContain('Put detailed scenario coverage in the matching test files')
  })
})
