/**
 * NFR-040: CI workflow fixture management
 * Verify the action test workflow uses explicit in-repo Cobertura fixtures
 * instead of deleting files to make a broad glob pass.
 */

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

describe('NFR-040: CI workflow fixture management', () => {
  const workflowPath = path.join(
    __dirname,
    '../../.github/workflows/test-action.yml'
  )

  function getTestActionSteps(): any[] {
    const workflowYml = fs.readFileSync(workflowPath, 'utf8')
    const workflow = yaml.load(workflowYml) as any
    return workflow.jobs['test-action'].steps
  }

  test('workflow should not delete Cobertura fixtures before running the action', () => {
    const workflowYml = fs.readFileSync(workflowPath, 'utf8')

    expect(workflowYml).not.toContain('Remove tested/invalid coverage XML files')
    expect(workflowYml).not.toContain('rm src/coverage')
  })

  test('workflow should exercise explicit compatibility fixtures from src', () => {
    const steps = getTestActionSteps()
    const step = steps.find(
      step => step.name === 'Test Action — compatibility fixtures'
    )

    expect(step).toBeDefined()
    expect(step.with.filename).toContain('src/coverage.MATLAB.xml')
    expect(step.with.filename).toContain('src/coverage.gcovr.xml')
    expect(step.with.filename).toContain('src/coverage.simplecov.xml')
    expect(step.with.filename).toContain('src/coverage.cobertura.xml')
  })

  test('workflow should exercise explicit edge-case fixtures from src', () => {
    const steps = getTestActionSteps()
    const step = steps.find(step => step.name === 'Test Action — edge-case fixtures')

    expect(step).toBeDefined()
    expect(step.with.filename).toContain('src/coverage.no-branches.xml')
    expect(step.with.filename).toContain('src/coverage.no-packages.xml')
    expect(step.with.filename).toContain('src/coverage.unnamed-packages.xml')
  })
})
