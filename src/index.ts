import * as core from '@actions/core'
import * as path from 'path'
import { createEmptySummary, parseCoverageFile, CoverageSummary } from './coverage-parser'
import { discoverCoverageFiles } from './file-discovery'
import {
  parseThresholds,
  generateBadgeUrl,
  generateTextOutput,
  generateMarkdownOutput,
  OutputOptions
} from './output-generator'
import { validateFormat, validateOutput } from './input-validator'
import { routeReport } from './output-destination'

export interface ParsedInputs {
  filename: string
  badge: boolean
  failBelowMin: boolean
  format: string
  hideBranchRate: boolean
  hideComplexity: boolean
  indicators: boolean
  output: string
  thresholdsInput: string
  patterns: string[]
}

/** Read and parse all action inputs into a typed object. Pure of file I/O and glob resolution. */
export function parseInputs(): ParsedInputs {
  const filename = core.getInput('filename', { required: true })
  const badge = core.getInput('badge').toLowerCase() === 'true'
  const failBelowMin = core.getInput('fail_below_min').toLowerCase() === 'true'
  const format = core.getInput('format').toLowerCase() || 'text'
  const hideBranchRate = core.getInput('hide_branch_rate').toLowerCase() === 'true'
  const hideComplexity = core.getInput('hide_complexity').toLowerCase() === 'true'
  const indicators = core.getInput('indicators').toLowerCase() === 'true'
  const output = core.getInput('output').toLowerCase() || 'console'
  const thresholdsInput = core.getInput('thresholds') || '50 75'

  // Resolve comma-separated filenames into individual patterns
  const patterns = filename
    .split(',')
    .map(p => p.trim())
    .filter(p => p.length > 0)

  return { filename, badge, failBelowMin, format, hideBranchRate, hideComplexity, indicators, output, thresholdsInput, patterns }
}

export async function run(): Promise<void> {
  try {
    const { badge, failBelowMin, format, hideBranchRate, hideComplexity, indicators, output, thresholdsInput, patterns } = parseInputs()

    // Validate inputs immediately (fail-fast before any file processing)
    try {
      validateFormat(format)
      validateOutput(output)
    } catch (err) {
      core.setFailed((err as Error).message)
      return
    }

    // Resolve glob patterns — comma-separated list supported
    const files = await discoverCoverageFiles(patterns)

    if (files.length === 0) {
      core.setFailed('Error: No files found matching glob pattern.')
      return
    }

    // Parse all coverage files
    let summary: CoverageSummary = createEmptySummary()
    for (const file of files) {
      core.info(`Coverage File: ${file}`)
      try {
        summary = parseCoverageFile(file, summary)
      } catch (err) {
        const relativePath = path.relative(process.cwd(), file)
        const displayPath = relativePath || path.basename(file)
        core.setFailed(
          `Parsing Error: ${(err as Error).message} - ${displayPath}`
        )
        return
      }
    }

    // Divide aggregated rates by the number of files (matches C# behaviour)
    if (summary.fileCount > 0) {
      summary.lineRate /= summary.fileCount
    }
    if (summary.branchFileCount > 0) {
      summary.branchRate /= summary.branchFileCount
    }

    // Suppress branch rate column when no branch metrics are present
    const effectiveHideBranchRate =
      hideBranchRate || !summary.branchMetricsPresent || summary.branchFileCount === 0

    // Parse threshold config
    let thresholds
    try {
      thresholds = parseThresholds(thresholdsInput)
    } catch (err) {
      core.setFailed(`Error: ${(err as Error).message}`)
      return
    }

    // Generate optional badge URL
    const badgeUrl = badge ? generateBadgeUrl(summary, thresholds) : null

    const options: OutputOptions = {
      badgeUrl,
      indicators,
      hideBranchRate: effectiveHideBranchRate,
      hideComplexity,
      thresholds,
      failBelowMin
    }

    // Build the formatted output string
    let outputText: string
    if (format === 'text') {
      outputText = generateTextOutput(summary, options)
    } else {
      outputText = generateMarkdownOutput(summary, options)
    }

    // Route the report to its destination(s)
    const formatMode = format === 'text' ? 'text' : 'md'
    routeReport(outputText, formatMode, output as 'console' | 'file' | 'both')

    // Fail the action when coverage is below the lower threshold
    if (failBelowMin && summary.lineRate < thresholds.lower) {
      core.setFailed(
        `FAIL: Overall line rate below minimum threshold of ${Math.round(thresholds.lower * 100)}%.`
      )
    }
  } catch (error) {
    core.setFailed(`Error: ${(error as Error).message}`)
  }
}

run()
