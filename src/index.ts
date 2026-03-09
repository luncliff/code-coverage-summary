import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as fs from 'fs'
import { createEmptySummary, parseCoverageFile, CoverageSummary } from './coverage-parser'
import {
  parseThresholds,
  generateBadgeUrl,
  generateTextOutput,
  generateMarkdownOutput,
  OutputOptions
} from './output-generator'

async function run(): Promise<void> {
  try {
    const filename = core.getInput('filename', { required: true })
    const badge = core.getInput('badge').toLowerCase() === 'true'
    const failBelowMin = core.getInput('fail_below_min').toLowerCase() === 'true'
    const format = core.getInput('format').toLowerCase()
    const hideBranchRate = core.getInput('hide_branch_rate').toLowerCase() === 'true'
    const hideComplexity = core.getInput('hide_complexity').toLowerCase() === 'true'
    const indicators = core.getInput('indicators').toLowerCase() !== 'false'
    const output = core.getInput('output').toLowerCase()
    const thresholdsInput = core.getInput('thresholds') || '50 75'

    // Resolve glob patterns — comma-separated list supported
    const patterns = filename
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
    const globber = await glob.create(patterns.join('\n'))
    const files = await globber.glob()

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
        core.setFailed(`Parsing Error: ${(err as Error).message} - ${file}`)
        return
      }
    }

    if (summary.packages.length === 0) {
      core.setFailed('Parsing Error: No packages found in coverage files.')
      return
    }

    // Divide aggregated rates by the number of files (matches C# behaviour)
    summary.lineRate /= files.length
    summary.branchRate /= files.length

    // Suppress branch rate column when no branch metrics are present
    const effectiveHideBranchRate =
      hideBranchRate ||
      (summary.branchRate === 0 &&
        summary.branchesCovered === 0 &&
        summary.branchesValid === 0)

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
    let fileExt: string
    if (format === 'text') {
      fileExt = 'txt'
      outputText = generateTextOutput(summary, options)
    } else if (format === 'md' || format === 'markdown') {
      fileExt = 'md'
      outputText = generateMarkdownOutput(summary, options)
    } else {
      core.setFailed('Error: Unknown output format.')
      return
    }

    // Emit the output
    if (output === 'console') {
      core.info('')
      core.info(outputText)
    } else if (output === 'file') {
      fs.writeFileSync(`code-coverage-results.${fileExt}`, outputText)
    } else if (output === 'both') {
      core.info('')
      core.info(outputText)
      fs.writeFileSync(`code-coverage-results.${fileExt}`, outputText)
    } else {
      core.setFailed('Error: Unknown output type.')
      return
    }

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
