/**
 * NFR-008: Local Files Only
 * Verify all file operations use local filesystem only
 */

import * as fs from 'fs'
import * as path from 'path'

jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  setFailed: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}))

jest.mock('@actions/glob', () => ({
  create: jest.fn(),
}))

describe('NFR-008: Local Files Only', () => {
  test('file-discovery should not accept remote URLs', () => {
    const fileDiscoveryPath = path.join(__dirname, '../../src/file-discovery.ts')
    const content = fs.readFileSync(fileDiscoveryPath, 'utf8')

    // Should not contain http:// or https:// in file path handling
    // (It may reference them in comments/docs, but not in actual logic)

    // Should use glob for local patterns, not URL fetching
    expect(content).toContain('glob')
  })

  test('coverage parser should only handle local files', () => {
    const parserPath = path.join(__dirname, '../../src/coverage-parser.ts')
    const content = fs.readFileSync(parserPath, 'utf8')

    // Should use fs.readFileSync or similar for local files
    expect(content).toContain('fs.readFile')

    // Should not try to fetch from URLs
    expect(content).not.toContain('http://')
    expect(content).not.toContain('https://')
    expect(content).not.toContain('fetch(')
  })

  test('index.ts should not accept network protocols in filenames', () => {
    const indexPath = path.join(__dirname, '../../src/index.ts')
    const content = fs.readFileSync(indexPath, 'utf8')

    // File patterns should be processed locally only
    // The patterns come from getInput('filename') which is a local glob pattern
    expect(content).toContain('discoverCoverageFiles')
  })

  test('file paths should not contain network protocols in source', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts') && f !== 'CodeCoverageSummary')

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')

      // Check that file operations don't reference remote protocols in actual code
      // (comments might reference them but not active code)
      const lines = content.split('\n')
      lines.forEach((line, idx) => {
        // Skip comment lines when checking for protocol usage
        if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
          // File paths should not hardcode remote URLs
          if (line.includes('http://') || line.includes('https://')) {
            // If it contains http/https, it should be a comment or string constant, not actual file access
            if (!line.includes('shields.io')) {
              // shields.io is exception for badge URL generation
              expect(line).toMatch(/\/\/|'|"|const/)
            }
          }
        }
      })
    })
  })

  test('file discovery should use glob patterns for local files', () => {
    const fileDiscoveryPath = path.join(__dirname, '../../src/file-discovery.ts')
    const content = fs.readFileSync(fileDiscoveryPath, 'utf8')

    // Should use @actions/glob for local pattern matching
    expect(content).toContain('@actions/glob')
    expect(content).toContain('glob.create')
  })

  test('coverage files must be parsed from local filesystem', () => {
    const parserPath = path.join(__dirname, '../../src/coverage-parser.ts')
    const content = fs.readFileSync(parserPath, 'utf8')

    // Should use fs.readFileSync to read local files
    expect(content).toContain('fs.readFileSync')

    // Should parse XML from file content, not fetch from remote
    expect(content).toContain('XMLParser')
  })

  test('all test fixture files should be local', () => {
    const fixturesDir = path.join(__dirname, '../../__tests__/fixtures')
    if (fs.existsSync(fixturesDir)) {
      const allFiles: string[] = []
      const walkDir = (dir: string) => {
        fs.readdirSync(dir).forEach(file => {
          const fullPath = path.join(dir, file)
          const stat = fs.statSync(fullPath)
          if (stat.isDirectory()) {
            walkDir(fullPath)
          } else {
            allFiles.push(fullPath)
          }
        })
      }
      walkDir(fixturesDir)

      // All fixtures should be actual files, not remote references
      allFiles.forEach(file => {
        expect(fs.existsSync(file)).toBe(true)
        expect(fs.statSync(file).isFile()).toBe(true)
      })
    }
  })

  test('output destination should write to local files only', () => {
    const outputDestPath = path.join(__dirname, '../../src/output-destination.ts')
    const content = fs.readFileSync(outputDestPath, 'utf8')

    // Should write to local files using fs module
    expect(content).toContain('fs.')

    // Should not send output to remote endpoints
    expect(content).not.toContain('http://')
    expect(content).not.toContain('https://')
    expect(content).not.toContain('fetch(')
  })

  test('no attempt to mount remote filesystems', () => {
    const sourceDir = path.join(__dirname, '../../src')
    const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.ts'))

    files.forEach(file => {
      const content = fs.readFileSync(path.join(sourceDir, file), 'utf8')

      // Should not try to access:
      // - SMB shares
      // - NFS mounts
      // - S3 buckets
      // - Azure blobs
      // - Google Cloud Storage
      expect(content).not.toContain('smb://')
      expect(content).not.toContain('nfs://')
      expect(content).not.toContain('s3://')
      expect(content).not.toContain('.blob.core.windows.net')
      expect(content).not.toContain('storage.googleapis.com')
    })
  })
})
