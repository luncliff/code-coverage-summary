/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@actions/core$': '<rootDir>/__tests__/helpers/action-test-harness.ts'
  },
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text'],
  collectCoverageFrom: ['src/**/*.ts', '!src/CodeCoverageSummary/**']
}
