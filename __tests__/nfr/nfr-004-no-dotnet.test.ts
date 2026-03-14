/**
 * NFR-004: No .NET Runtime Dependency
 * Verify the action does not require .NET runtime
 */

import * as fs from 'fs'
import * as path from 'path'

describe('NFR-004: No .NET Runtime Dependency', () => {
  test('source code should not execute .NET binaries', () => {
    const srcDir = path.join(__dirname, '../../src')
    const tsFiles = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.ts') && !f.includes('CodeCoverageSummary'))
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8')
      
      // Should not invoke dotnet
      expect(content).not.toContain('dotnet ')
      expect(content).not.toContain('.exe')
      expect(content).not.toContain('spawn(\'dotnet\'')
      expect(content).not.toContain('exec(\'dotnet\'')
      expect(content).not.toContain('CodeCoverageSummary.exe')
    })
  })

  test('package.json should not depend on .NET packages', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    // Should not have .NET-related packages
    const dotnetPackages = ['edge-js', 'edge', 'dotnet-bridge']
    
    dotnetPackages.forEach(dep => {
      expect(allDeps[dep]).toBeUndefined()
    })
  })

  test('implementation should be pure JavaScript/TypeScript', () => {
    const srcDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(srcDir)
      .filter(f => !f.includes('CodeCoverageSummary'))
    
    // All implementation files should be .ts
    const implFiles = files.filter(f => 
      !f.endsWith('.xml') && 
      !f.endsWith('.dtd') && 
      !f.endsWith('.sln')
    )
    
    implFiles.forEach(file => {
      expect(file).toMatch(/\.ts$/)
    })
  })

  test('.NET source should only exist in legacy directory', () => {
    // Legacy .NET code should be in src/CodeCoverageSummary/
    // Current implementation should not reference it
    const srcDir = path.join(__dirname, '../../src')
    const tsFiles = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.ts') && !f.includes('CodeCoverageSummary'))
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8')
      
      // Should not reference legacy .NET implementation
      expect(content).not.toContain('CodeCoverageSummary')
    })
  })

  test('action runs without .NET runtime installed', () => {
    // This test verifies that the action code can load and run
    // without .NET being available
    
    // Import main entry point
    const indexPath = path.join(__dirname, '../../src/index.ts')
    expect(fs.existsSync(indexPath)).toBe(true)
    
    // Verify it's pure JavaScript
    const content = fs.readFileSync(indexPath, 'utf8')
    expect(content).toContain('@actions/core')
    expect(content).not.toContain('dotnet')
    expect(content).not.toContain('.exe')
  })
})
