/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    moduleNameMapper: {
        '^@actions/core$': '<rootDir>/__tests__/helpers/action-test-harness.ts',
        '^@actions/glob$': '<rootDir>/__tests__/helpers/glob-test-harness.ts'
    },
    collectCoverage: false,
    coverageDirectory: 'coverage',
    coverageReporters: ['lcov', 'text'],
    collectCoverageFrom: ['src/**/*.ts', '!src/CodeCoverageSummary/**'],
    coverageThreshold: {
        global: {
            lines: 80,
            branches: 80,
            functions: 80,
            statements: 80
        }
    }
}
