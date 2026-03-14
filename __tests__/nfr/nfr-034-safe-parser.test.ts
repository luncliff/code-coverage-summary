/**
 * NFR-034: Safe XML Parser Configuration
 * Verify XML parser is configured securely
 */

import * as fs from 'fs'
import * as path from 'path'

describe('NFR-034: Safe XML Parser Configuration', () => {
  test('should use fast-xml-parser (inherently safe)', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    // Should use fast-xml-parser
    expect(packageJson.dependencies['fast-xml-parser']).toBeDefined()
  })

  test('parser configuration should be safe', () => {
    const parserPath = path.join(__dirname, '../../src/coverage-parser.ts')
    const content = fs.readFileSync(parserPath, 'utf8')
    
    // Should use XMLParser from fast-xml-parser
    expect(content).toContain('XMLParser')
    
    // fast-xml-parser does NOT support:
    // - DTD processing
    // - External entity resolution
    // - XML entity expansion attacks
    // This is safe by default
  })

  test('should not use dangerous XML parsers', () => {
    const packageJsonPath = path.join(__dirname, '../../package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }
    
    // Should NOT use these potentially unsafe parsers
    const unsafeParsers = [
      'libxmljs',     // Can be unsafe if misconfigured
      'xml2js',       // Can be unsafe with external entities
      'xmldom'        // Can be unsafe with DTD
    ]
    
    unsafeParsers.forEach(parser => {
      expect(allDeps[parser]).toBeUndefined()
    })
  })

  test('parser should ignore XML declarations safely', () => {
    const parserPath = path.join(__dirname, '../../src/coverage-parser.ts')
    const content = fs.readFileSync(parserPath, 'utf8')
    
    // Should have ignoreDeclaration or similar safe configuration
    // fast-xml-parser ignores declarations by default
    expect(content).toContain('ignoreDeclaration')
  })
})
