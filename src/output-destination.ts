import * as core from '@actions/core'
import * as fs from 'fs'

/**
 * Output destination modes for the coverage report.
 */
export type OutputMode = 'console' | 'file' | 'both'

/**
 * Report format types.
 */
export type ReportFormat = 'text' | 'md'

/**
 * Result of routing a report to its destination(s).
 */
export interface RouteResult {
  /** Whether the report was logged to console */
  logged: boolean
  /** Whether the report was written to file */
  fileWritten: boolean
  /** The filename used if written to file */
  filename?: string
  /** Any error that occurred during routing */
  error?: string
}

/**
 * Routes the coverage report to its destination based on output mode.
 *
 * @param report - The report content to route
 * @param format - The report format (text or md)
 * @param outputMode - The output destination mode (console, file, or both)
 * @returns A RouteResult indicating what actions were taken
 *
 * Behavior:
 * - 'console': Logs report to core.info(), no file created
 * - 'file': Writes report to file, no console logging
 * - 'both': Both logs and writes to file
 *
 * File naming follows legacy convention:
 * - text format: code-coverage-results.txt
 * - markdown format: code-coverage-results.md
 */
export function routeReport(
  report: string,
  format: ReportFormat,
  outputMode: OutputMode
): RouteResult {
  const fileExt = format === 'text' ? 'txt' : 'md'
  const filename = `code-coverage-results.${fileExt}`

  let logged = false
  let fileWritten = false
  let error: string | undefined

  try {
    // Log to console if requested
    if (outputMode === 'console' || outputMode === 'both') {
      core.info('')
      core.info(report)
      logged = true
    }

    // Write to file if requested
    if (outputMode === 'file' || outputMode === 'both') {
      try {
        fs.writeFileSync(filename, report)
        fileWritten = true
      } catch (writeError) {
        error = (writeError as Error).message
        core.setFailed(error)
        return {
          logged,
          fileWritten: false,
          error
        }
      }
    }
  } catch (err) {
    if (!error) {
      error = (err as Error).message
    }
    return {
      logged,
      fileWritten,
      error
    }
  }

  return {
    logged,
    fileWritten,
    filename: fileWritten ? filename : undefined,
    error
  }
}

/**
 * Gets the deterministic filename for a given report format.
 *
 * @param format - The report format (text or md)
 * @returns The legacy filename for that format
 */
export function getReportFilename(format: ReportFormat): string {
  const fileExt = format === 'text' ? 'txt' : 'md'
  return `code-coverage-results.${fileExt}`
}
