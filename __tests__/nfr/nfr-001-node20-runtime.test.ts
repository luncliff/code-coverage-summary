/**
 * NFR-001: Node 20 JavaScript Action
 * Verify the action uses Node 20 runtime
 */

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

describe('NFR-001: Node 20 JavaScript Action', () => {
  const actionYmlPath = path.join(__dirname, '../../action.yml')

  test('action.yml should exist', () => {
    expect(fs.existsSync(actionYmlPath)).toBe(true)
  })

  test('action.yml should specify runs.using: node20', () => {
    const actionYml = fs.readFileSync(actionYmlPath, 'utf8')
    const actionConfig = yaml.load(actionYml) as any

    expect(actionConfig.runs).toBeDefined()
    expect(actionConfig.runs.using).toBe('node20')
  })

  test('action.yml should specify main entry point', () => {
    const actionYml = fs.readFileSync(actionYmlPath, 'utf8')
    const actionConfig = yaml.load(actionYml) as any

    expect(actionConfig.runs.main).toBeDefined()
    expect(actionConfig.runs.main).toMatch(/dist\/index\.js/)
  })

  test('package.json should target Node 20 in build', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))

    // Check build script targets node20
    expect(packageJson.scripts.build).toContain('node20')
  })

  test('Node version should be 20 or higher', () => {
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
    
    expect(majorVersion).toBeGreaterThanOrEqual(20)
  })
})
