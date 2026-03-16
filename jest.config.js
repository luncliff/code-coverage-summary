/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.test.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    transformIgnorePatterns: [
        'node_modules/(?!(@actions)/)'
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
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
