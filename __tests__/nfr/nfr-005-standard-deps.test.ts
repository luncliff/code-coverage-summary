/**
 * NFR-005: Standard JavaScript Dependencies Only
 * Verify the action uses only standard npm packages compatible with Node 20
 */

import * as fs from 'fs'
import * as path from 'path'

describe('NFR-005: Standard JavaScript Dependencies Only', () => {
  let packageJson: any

  beforeAll(() => {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
  })

  test('all dependencies should be standard npm packages', () => {
    const deps = packageJson.dependencies || {}
    
    // Verify core dependencies are official GitHub Actions packages or well-known libraries
    const expectedDeps = [
      '@actions/core',
      '@actions/glob',
      'fast-xml-parser'
    ]
    
    expectedDeps.forEach(dep => {
      expect(deps[dep]).toBeDefined()
    })
  })

  test('should not have platform-specific dependencies', () => {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    // These packages are platform-specific or have native bindings
    const platformSpecific = [
      'fsevents',
      'node-sass',
      'node-gyp',
      'node-pty',
      'windows-build-tools',
      'macos-release'
    ]
    
    platformSpecific.forEach(dep => {
      expect(allDeps[dep]).toBeUndefined()
    })
  })

  test('dependencies should be compatible with Node 20', () => {
    const deps = packageJson.dependencies || {}
    
    // @actions packages should be latest versions compatible with Node 20
    expect(deps['@actions/core']).toBeDefined()
    expect(deps['@actions/glob']).toBeDefined()
    
    // Verify versions are reasonably recent
    const coreVersion = deps['@actions/core']
    expect(coreVersion).toMatch(/\^1\.\d+\.\d+/)
  })

  test('package.json should specify Node engine requirement', () => {
    // Should have engines field (optional but recommended)
    if (packageJson.engines) {
      expect(packageJson.engines.node).toBeDefined()
      
      // Should specify Node 20 or higher
      const nodeVersion = packageJson.engines.node
      expect(nodeVersion).toMatch(/>=?\s*20/)
    }
    
    // Build script should target node20
    expect(packageJson.scripts.build).toContain('node20')
  })

  test('should use ESBuild for pure JavaScript bundling', () => {
    const devDeps = packageJson.devDependencies || {}
    
    // Using esbuild (pure JavaScript bundler, no native deps)
    expect(devDeps['esbuild']).toBeDefined()
  })

  test('should use TypeScript for type safety', () => {
    const devDeps = packageJson.devDependencies || {}
    
    expect(devDeps['typescript']).toBeDefined()
  })

  test('test framework should be pure JavaScript', () => {
    const devDeps = packageJson.devDependencies || {}
    
    // Using Jest with ts-jest (no native dependencies)
    expect(devDeps['jest']).toBeDefined()
    expect(devDeps['ts-jest']).toBeDefined()
  })

  test('should not have deprecated dependencies', () => {
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    // List of known deprecated packages
    const deprecated = [
      'request', // deprecated
      'node-uuid', // use 'uuid' instead
      'native-promise-only', // use native promises
      'babel-core', // use @babel/core
      'istanbul' // use nyc or jest coverage
    ]
    
    deprecated.forEach(dep => {
      expect(allDeps[dep]).toBeUndefined()
    })
  })

  test('dependencies should be minimal', () => {
    const deps = Object.keys(packageJson.dependencies || {})
    
    // Should have minimal dependencies for security and maintainability
    expect(deps.length).toBeLessThanOrEqual(5)
    
    // Each dependency should serve a clear purpose
    deps.forEach(dep => {
      const validDeps = [
        '@actions/core',     // GitHub Actions integration
        '@actions/glob',     // File pattern matching
        'fast-xml-parser',   // XML parsing
        '@actions/http-client' // (might be in overrides)
      ]
      
      expect(validDeps).toContain(dep)
    })
  })

  test('should have security overrides for vulnerable transitive dependencies', () => {
    // Should have overrides to patch known vulnerabilities
    if (packageJson.overrides) {
      // Verify critical security overrides
      expect(packageJson.overrides['@actions/http-client']).toBeDefined()
    }
  })

  test('devDependencies should be appropriate for Node 20', () => {
    const devDeps = packageJson.devDependencies || {}
    
    // TypeScript types for Node should be recent
    expect(devDeps['@types/node']).toBeDefined()
    
    // Jest should be recent version
    const jestVersion = devDeps['jest']
    expect(jestVersion).toMatch(/\^29\./)
  })
})
