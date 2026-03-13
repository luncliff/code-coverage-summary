import * as glob from '@actions/glob'

export function parseCoveragePatterns(filename: string): string[] {
  return filename
    .split(',')
    .map(pattern => pattern.trim())
    .filter(pattern => pattern.length > 0)
}

export async function discoverCoverageFiles(patterns: string[]): Promise<string[]> {
  if (patterns.length === 0) {
    return []
  }
  const globber = await glob.create(patterns.join('\n'))
  return globber.glob()
}
