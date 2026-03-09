import { CoverageSummary, PackageCoverage } from './coverage-parser'

export interface ThresholdConfig {
  lower: number
  upper: number
}

export interface OutputOptions {
  badgeUrl: string | null
  indicators: boolean
  hideBranchRate: boolean
  hideComplexity: boolean
  thresholds: ThresholdConfig
  failBelowMin: boolean
}

export function parseThresholds(thresholds: string): ThresholdConfig {
  const trimmed = thresholds.trim()
  if (!trimmed) {
    throw new Error('Threshold parameter set incorrectly.')
  }

  const spaceIdx = trimmed.indexOf(' ')
  let lowerPct: number
  let upperPct = 75

  if (spaceIdx < 0) {
    lowerPct = parseInt(trimmed, 10)
    if (isNaN(lowerPct)) throw new Error('Threshold parameter set incorrectly.')
  } else {
    lowerPct = parseInt(trimmed.substring(0, spaceIdx), 10)
    if (isNaN(lowerPct)) throw new Error('Threshold parameter set incorrectly.')
    upperPct = parseInt(trimmed.substring(spaceIdx + 1), 10)
    if (isNaN(upperPct)) throw new Error('Threshold parameter set incorrectly.')
  }

  let lower = lowerPct / 100
  let upper = upperPct / 100

  if (lower > 1.0) lower = 1.0
  if (lower > upper) upper = lower + 0.1
  if (upper > 1.0) upper = 1.0

  return { lower, upper }
}

export function generateBadgeUrl(
  summary: CoverageSummary,
  thresholds: ThresholdConfig
): string {
  let colour: string
  if (summary.lineRate < thresholds.lower) {
    colour = 'critical'
  } else if (summary.lineRate < thresholds.upper) {
    colour = 'yellow'
  } else {
    colour = 'success'
  }
  const pct = Math.round(summary.lineRate * 100)
  return `https://img.shields.io/badge/Code%20Coverage-${pct}%25-${colour}?style=flat`
}

function healthIndicator(rate: number, thresholds: ThresholdConfig): string {
  if (rate < thresholds.lower) return '❌'
  if (rate < thresholds.upper) return '➖'
  return '✔'
}

function formatComplexity(value: number): string {
  return value % 1 === 0 ? String(value) : value.toFixed(4)
}

function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

function buildPackageTextLine(
  pkg: PackageCoverage,
  options: OutputOptions
): string {
  let line = `${pkg.name}: Line Rate = ${formatRate(pkg.lineRate)}`
  if (!options.hideBranchRate) line += `, Branch Rate = ${formatRate(pkg.branchRate)}`
  if (!options.hideComplexity) line += `, Complexity = ${formatComplexity(pkg.complexity)}`
  if (options.indicators) line += `, ${healthIndicator(pkg.lineRate, options.thresholds)}`
  return line
}

function buildSummaryTextLine(
  summary: CoverageSummary,
  options: OutputOptions
): string {
  let line = `Summary: Line Rate = ${formatRate(summary.lineRate)} (${summary.linesCovered} / ${summary.linesValid})`
  if (!options.hideBranchRate)
    line += `, Branch Rate = ${formatRate(summary.branchRate)} (${summary.branchesCovered} / ${summary.branchesValid})`
  if (!options.hideComplexity) line += `, Complexity = ${formatComplexity(summary.complexity)}`
  if (options.indicators) line += `, ${healthIndicator(summary.lineRate, options.thresholds)}`
  return line
}

export function generateTextOutput(
  summary: CoverageSummary,
  options: OutputOptions
): string {
  const lines: string[] = []

  if (options.badgeUrl) {
    lines.push(options.badgeUrl)
    lines.push('')
  }

  for (const pkg of summary.packages) {
    lines.push(buildPackageTextLine(pkg, options))
  }

  lines.push(buildSummaryTextLine(summary, options))

  if (options.failBelowMin) {
    lines.push(`Minimum allowed line rate is ${Math.round(options.thresholds.lower * 100)}%`)
  }

  return lines.join('\n') + '\n'
}

function buildPackageMarkdownRow(
  pkg: PackageCoverage,
  options: OutputOptions
): string {
  let row = `${pkg.name} | ${formatRate(pkg.lineRate)}`
  if (!options.hideBranchRate) row += ` | ${formatRate(pkg.branchRate)}`
  if (!options.hideComplexity) row += ` | ${formatComplexity(pkg.complexity)}`
  if (options.indicators) row += ` | ${healthIndicator(pkg.lineRate, options.thresholds)}`
  return row
}

function buildSummaryMarkdownRow(
  summary: CoverageSummary,
  options: OutputOptions
): string {
  let row = `**Summary** | **${formatRate(summary.lineRate)}** (${summary.linesCovered} / ${summary.linesValid})`
  if (!options.hideBranchRate)
    row += ` | **${formatRate(summary.branchRate)}** (${summary.branchesCovered} / ${summary.branchesValid})`
  if (!options.hideComplexity) row += ` | **${formatComplexity(summary.complexity)}**`
  if (options.indicators) row += ` | ${healthIndicator(summary.lineRate, options.thresholds)}`
  return row
}

export function generateMarkdownOutput(
  summary: CoverageSummary,
  options: OutputOptions
): string {
  const lines: string[] = []

  if (options.badgeUrl) {
    lines.push(`![Code Coverage](${options.badgeUrl})`)
    lines.push('')
  }

  let header = 'Package | Line Rate'
  let separator = '-------- | ---------'
  if (!options.hideBranchRate) {
    header += ' | Branch Rate'
    separator += ' | -----------'
  }
  if (!options.hideComplexity) {
    header += ' | Complexity'
    separator += ' | ----------'
  }
  if (options.indicators) {
    header += ' | Health'
    separator += ' | ------'
  }
  lines.push(header)
  lines.push(separator)

  for (const pkg of summary.packages) {
    lines.push(buildPackageMarkdownRow(pkg, options))
  }

  lines.push(buildSummaryMarkdownRow(summary, options))

  if (options.failBelowMin) {
    lines.push('')
    lines.push(`_Minimum allowed line rate is \`${Math.round(options.thresholds.lower * 100)}%\`_`)
  }

  return lines.join('\n') + '\n'
}
