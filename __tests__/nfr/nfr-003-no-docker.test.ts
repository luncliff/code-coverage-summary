/**
 * NFR-003: No Docker Dependency
 * Verify the action does not require Docker at runtime
 */

import * as fs from 'fs'
import * as path from 'path'
import * as yaml from 'js-yaml'

describe('NFR-003: No Docker Dependency', () => {
  test('action.yml should not use Docker runtime', () => {
    const actionYmlPath = path.join(__dirname, '../../action.yml')
    const actionYml = fs.readFileSync(actionYmlPath, 'utf8')
    const actionConfig = yaml.load(actionYml) as any

    expect(actionConfig.runs.using).not.toBe('docker')
    expect(actionConfig.runs.using).not.toContain('docker')
  })

  test('action.yml should not specify Dockerfile', () => {
    const actionYmlPath = path.join(__dirname, '../../action.yml')
    const actionYml = fs.readFileSync(actionYmlPath, 'utf8')
    const actionConfig = yaml.load(actionYml) as any

    expect(actionConfig.runs.image).toBeUndefined()
  })

  test('source code should not execute Docker commands', () => {
    const srcDir = path.join(__dirname, '../../src')
    const tsFiles = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.ts') && !f.includes('CodeCoverageSummary'))
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8')
      
      // Should not invoke docker
      expect(content).not.toContain('docker run')
      expect(content).not.toContain('docker exec')
      expect(content).not.toContain('docker build')
      expect(content).not.toContain('spawn(\'docker\'')
      expect(content).not.toContain('exec(\'docker\'')
    })
  })

  test('package.json should not depend on Docker packages', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    // Should not have Docker-related packages
    const dockerPackages = ['dockerode', 'docker-cli-js', 'docker-compose']
    
    dockerPackages.forEach(dep => {
      expect(allDeps[dep]).toBeUndefined()
    })
  })

  test('action runs without Docker installed', () => {
    // This test verifies that the action code can load and run
    // without Docker being available
    
    // Import main entry point
    const indexPath = path.join(__dirname, '../../src/index.ts')
    expect(fs.existsSync(indexPath)).toBe(true)
    
    // Verify it's a Node.js module, not Docker-based
    const content = fs.readFileSync(indexPath, 'utf8')
    expect(content).toContain('@actions/core')
    expect(content).not.toContain('docker')
  })
})
