import { XMLParser } from 'fast-xml-parser'
import * as fs from 'fs'
import * as path from 'path'

export interface PackageCoverage {
  name: string
  lineRate: number
  branchRate: number
  complexity: number
}

export interface CoverageSummary {
  lineRate: number
  branchRate: number
  linesCovered: number
  linesValid: number
  branchesCovered: number
  branchesValid: number
  complexity: number
  branchMetricsPresent: boolean
  packages: PackageCoverage[]
}

export function createEmptySummary(): CoverageSummary {
  return {
    lineRate: 0,
    branchRate: 0,
    linesCovered: 0,
    linesValid: 0,
    branchesCovered: 0,
    branchesValid: 0,
    complexity: 0,
    branchMetricsPresent: false,
    packages: []
  }
}

function safeFloat(value: unknown): number | null {
  if (value === undefined || value === null) return null
  const n = parseFloat(String(value))
  return isNaN(n) ? null : n
}

function safeInt(value: unknown): number | null {
  if (value === undefined || value === null) return null
  const n = parseInt(String(value), 10)
  return isNaN(n) ? null : n
}

export function parseCoverageFile(
  filename: string,
  summary: CoverageSummary
): CoverageSummary {
  const content = fs.readFileSync(filename, 'utf-8')
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: false,
    allowBooleanAttributes: true,
    ignoreDeclaration: true
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any = parser.parse(content)

  const coverage = parsed?.coverage
  if (!coverage) {
    throw new Error('Coverage file invalid, data not found')
  }

  const lineRate = safeFloat(coverage['@_line-rate'])
  if (lineRate === null) throw new Error('Overall line rate not found')
  summary.lineRate += lineRate

  const linesCovered = safeInt(coverage['@_lines-covered'])
  if (linesCovered === null) throw new Error('Overall lines covered not found')
  summary.linesCovered += linesCovered

  const linesValid = safeInt(coverage['@_lines-valid'])
  if (linesValid === null) throw new Error('Overall lines valid not found')
  summary.linesValid += linesValid

  const branchRateStr = coverage['@_branch-rate']
  const branchesCoveredStr = coverage['@_branches-covered']
  const branchesValidStr = coverage['@_branches-valid']
  const hasRootBranchMetrics =
    branchRateStr !== undefined ||
    branchesCoveredStr !== undefined ||
    branchesValidStr !== undefined

  if (hasRootBranchMetrics) {
    summary.branchMetricsPresent = true
    summary.branchRate += safeFloat(branchRateStr) ?? 0
    summary.branchesCovered += safeInt(branchesCoveredStr) ?? 0
    summary.branchesValid += safeInt(branchesValidStr) ?? 0
  }

  // Parse packages
  const packagesEl = coverage?.packages
  if (!packagesEl || typeof packagesEl !== 'object') {
    return summary
  }

  let packages = packagesEl?.package
  if (packages === undefined) {
    return summary
  }
  if (!Array.isArray(packages)) packages = [packages]

  const baseName = path.basename(filename, path.extname(filename))
  let i = 1
  for (const pkg of packages) {
    const pkgName = String(pkg['@_name'] ?? '').trim()
    if (pkg['@_branch-rate'] !== undefined) {
      summary.branchMetricsPresent = true
    }
    const pkgCoverage: PackageCoverage = {
      name: pkgName || `${baseName} Package ${i}`,
      lineRate: safeFloat(pkg['@_line-rate']) ?? 0,
      branchRate: safeFloat(pkg['@_branch-rate']) ?? 0,
      complexity: safeFloat(pkg['@_complexity']) ?? 0
    }
    summary.packages.push(pkgCoverage)
    summary.complexity += pkgCoverage.complexity
    i++
  }

  return summary
}
