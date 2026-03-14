import * as path from 'path'
import { parseCoverageFile, createEmptySummary } from '../src/coverage-parser'

const FIXTURES_DIR = path.join(__dirname, '..', 'src')

describe('parseCoverageFile', () => {
  test('parses a standard Cobertura XML file', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.cobertura.xml')
    const summary = parseCoverageFile(file, createEmptySummary())

    expect(summary.lineRate).toBeCloseTo(0.8301, 3)
    expect(summary.branchRate).toBeCloseTo(0.6931, 3)
    expect(summary.linesCovered).toBe(1212)
    expect(summary.linesValid).toBe(1460)
    expect(summary.packages.length).toBeGreaterThan(0)
  })

  test('throws when required root attributes are missing', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.missing-root.xml')
    expect(() => parseCoverageFile(file, createEmptySummary())).toThrow(
      'Overall lines covered not found'
    )
  })

  test('throws when required root attributes are invalid', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.invalid-root.xml')
    expect(() => parseCoverageFile(file, createEmptySummary())).toThrow(
      'Overall line rate not found'
    )
  })

  test('parses a Cobertura file without branch metrics', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.no-branches.xml')
    const summary = parseCoverageFile(file, createEmptySummary())

    expect(summary.lineRate).toBeCloseTo(0.5, 5)
    expect(summary.branchRate).toBe(0)
    expect(summary.branchesCovered).toBe(0)
    expect(summary.branchesValid).toBe(0)
    expect(summary.branchMetricsPresent).toBe(false)
    expect(summary.packages.length).toBeGreaterThan(0)
  })

  test('parses a Cobertura file with no packages', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.no-packages.xml')
    const summary = parseCoverageFile(file, createEmptySummary())

    expect(summary.lineRate).toBeCloseTo(0.5, 5)
    expect(summary.packages).toHaveLength(0)
  })

  test('uses fallback names and defaults for unnamed packages', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.unnamed-packages.xml')
    const summary = parseCoverageFile(file, createEmptySummary())

    expect(summary.packages).toHaveLength(2)
    expect(summary.packages[0].name).toBe('coverage.unnamed-packages Package 1')
    expect(summary.packages[1].name).toBe('coverage.unnamed-packages Package 2')
    expect(summary.packages[0].lineRate).toBe(0)
    expect(summary.packages[0].branchRate).toBe(0)
    expect(summary.packages[0].complexity).toBe(0)
    expect(summary.packages[1].lineRate).toBe(0)
    expect(summary.packages[1].branchRate).toBe(0)
    expect(summary.packages[1].complexity).toBe(0)
  })

  test('parses a gcovr Cobertura XML file with DOCTYPE declaration', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.gcovr.xml')
    const summary = parseCoverageFile(file, createEmptySummary())

    expect(summary.lineRate).toBeGreaterThan(0)
    expect(summary.packages.length).toBeGreaterThan(0)
  })

  test('parses a MATLAB coverage file with NaN branch values', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.MATLAB.xml')
    const summary = parseCoverageFile(file, createEmptySummary())

    // NaN branch values should be treated as 0
    expect(summary.branchRate).toBe(0)
    expect(summary.branchesCovered).toBe(0)
    expect(summary.branchesValid).toBe(0)
    expect(summary.packages.length).toBeGreaterThan(0)
  })

  test('parses a simplecov Cobertura XML file without branch-rate', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.simplecov.xml')
    const summary = parseCoverageFile(file, createEmptySummary())

    expect(summary.lineRate).toBeGreaterThan(0)
    expect(summary.packages.length).toBeGreaterThan(0)
  })

  test('accumulates metrics across multiple files', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.gcovr.xml')
    let summary = createEmptySummary()
    summary = parseCoverageFile(file, summary)
    const single = summary.lineRate
    const singlePackages = summary.packages.length

    // Parse the same file twice to verify accumulation
    summary = parseCoverageFile(file, summary)
    expect(summary.lineRate).toBeCloseTo(single * 2, 5)
    expect(summary.packages.length).toBe(singlePackages * 2)
  })

  test('uses filename as fallback package name when package name is empty', () => {
    const file = path.join(FIXTURES_DIR, 'coverage.gcovr.xml')
    const summary = parseCoverageFile(file, createEmptySummary())

    // gcovr file has package name="" — should fall back to filename-based name
    const hasNamedPackage = summary.packages.some(
      p => p.name !== '' && p.name !== undefined
    )
    expect(hasNamedPackage).toBe(true)
  })

  test('aggregates totals and averages root rates across multiple fixtures', () => {
    const aggregateFixtureA = path.join(FIXTURES_DIR, 'coverage.aggregate-a.xml')
    const aggregateFixtureB = path.join(FIXTURES_DIR, 'coverage.aggregate-b.xml')
    let summary = createEmptySummary()

    summary = parseCoverageFile(aggregateFixtureA, summary)
    summary = parseCoverageFile(aggregateFixtureB, summary)

    expect(summary.linesCovered).toBe(10)
    expect(summary.linesValid).toBe(20)
    expect(summary.branchesCovered).toBe(10)
    expect(summary.branchesValid).toBe(20)
    expect(summary.complexity).toBe(10)
    expect(summary.fileCount).toBe(2)
    expect(summary.branchFileCount).toBe(2)
    expect(summary.lineRate).toBeCloseTo(1.0, 5)
    expect(summary.branchRate).toBeCloseTo(1.0, 5)
  })
})
