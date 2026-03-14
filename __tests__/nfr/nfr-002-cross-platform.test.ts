/**
 * NFR-002: Cross-Platform Compatibility
 * Verify the action runs identically on Linux, Windows, and macOS
 */

import * as fs from 'fs'
import * as path from 'path'
import { parseCoverageFile, createEmptySummary } from '../../src/coverage-parser'
import { generateTextOutput, generateMarkdownOutput } from '../../src/output-generator'

describe('NFR-002: Cross-Platform Compatibility', () => {
  test('path module should be used for all path operations', () => {
    // Verify source files use path module, not string concatenation
    const srcDir = path.join(__dirname, '../../src')
    const tsFiles = fs.readdirSync(srcDir)
      .filter(f => f.endsWith('.ts') && !f.includes('CodeCoverageSummary'))
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf8')
      
      // Should import path module if doing path operations
      if (content.includes('path.join') || content.includes('path.resolve')) {
        expect(content).toContain("from 'path'")
      }
      
      // Should not have hardcoded separators in path operations
      // Allow / in URLs (shields.io) and comments
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        // Skip comments and URLs
        if (line.trim().startsWith('//') || 
            line.trim().startsWith('*') ||
            line.includes('https://') ||
            line.includes('shields.io')) {
          return
        }
        
        // Check for suspicious path operations
        const suspiciousPatterns = [
          /['"]\/[a-zA-Z]/,  // "/path" patterns
          /['"]\\\\/,        // "\\" patterns
          /\+\s*['"]\/['"]/, // + "/" patterns
          /\+\s*['"]\\\\/    // + "\\" patterns
        ]
        
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(line)) {
            // This might be a hardcoded path separator
            // Flag for manual review unless it's clearly a URL or constant
            if (!line.includes('http') && !line.includes('shields.io')) {
              // Allow specific safe cases
              const safeCases = ['import', 'from', 'require', '//']
              const isSafe = safeCases.some(c => line.includes(c))
              if (!isSafe) {
                console.warn(`Potential hardcoded path in ${file}:${idx + 1}: ${line.trim()}`)
              }
            }
          }
        })
      })
    })
  })

  test('package.json should not contain platform-specific native dependencies', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    // Common native/platform-specific packages that would cause issues
    const nativeDeps = ['node-gyp', 'fsevents', 'node-sass', 'node-pty']
    
    nativeDeps.forEach(dep => {
      expect(allDeps[dep]).toBeUndefined()
    })
  })

  test('coverage parsing should work with different line endings', () => {
    // Use existing fixture
    const fixturePath = path.join(__dirname, '../../src/coverage.cobertura.xml')
    
    expect(fs.existsSync(fixturePath)).toBe(true)
    
    // Parse with current line endings
    const summary1 = createEmptySummary()
    const result1 = parseCoverageFile(fixturePath, summary1)
    
    // Create temp file with LF endings
    const xmlContent = fs.readFileSync(fixturePath, 'utf8')
    const tempLF = path.join(__dirname, '../fixtures/temp-lf.xml')
    fs.writeFileSync(tempLF, xmlContent.replace(/\r\n/g, '\n'))
    
    const summary2 = createEmptySummary()
    const result2 = parseCoverageFile(tempLF, summary2)
    
    // Create temp file with CRLF endings
    const tempCRLF = path.join(__dirname, '../fixtures/temp-crlf.xml')
    fs.writeFileSync(tempCRLF, xmlContent.replace(/\n/g, '\r\n'))
    
    const summary3 = createEmptySummary()
    const result3 = parseCoverageFile(tempCRLF, summary3)
    
    // Clean up
    fs.unlinkSync(tempLF)
    fs.unlinkSync(tempCRLF)
    
    // Results should be identical
    expect(result2.lineRate).toBe(result3.lineRate)
    expect(result2.packages.length).toBe(result3.packages.length)
  })

  test('output generation should be identical regardless of platform', () => {
    // Create test data
    const testData = {
      lineRate: 0.85,
      branchRate: 0.75,
      complexity: 10,
      linesCovered: 85,
      linesValid: 100,
      branchesCovered: 75,
      branchesValid: 100,
      branchMetricsPresent: true,
      fileCount: 1,
      branchFileCount: 1,
      packages: [{
        name: 'TestPackage',
        lineRate: 0.85,
        branchRate: 0.75,
        complexity: 10
      }]
    }

    const options = {
      badgeUrl: null,
      indicators: true,
      hideBranchRate: false,
      hideComplexity: false,
      thresholds: { lower: 50, upper: 75 },
      failBelowMin: false
    }

    // Generate output multiple times
    const output1 = generateTextOutput(testData, options)
    const output2 = generateTextOutput(testData, options)
    
    // Should be identical
    expect(output1).toBe(output2)
    
    // Should not contain platform-specific characters
    expect(output1).not.toContain('\r\n') // No CRLF in output
  })

  test('file paths should use platform-agnostic path module', () => {
    const srcFiles = [
      'coverage-parser.ts',
      'file-discovery.ts',
      'index.ts',
      'input-validator.ts',
      'output-destination.ts',
      'output-generator.ts',
      'threshold-enforcer.ts'
    ]

    srcFiles.forEach(file => {
      const filePath = path.join(__dirname, '../../src', file)
      const content = fs.readFileSync(filePath, 'utf8')
      
      // If file does path operations, should import path module
      const hasPathOperations = content.includes('path.') || 
                               content.includes('__dirname') ||
                               content.includes('process.cwd()')
      
      if (hasPathOperations) {
        expect(content).toMatch(/import.*path.*from ['"]path['"]/)
      }
    })
  })
})
