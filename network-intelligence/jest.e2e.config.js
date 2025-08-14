module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 60000, // 60 seconds for E2E tests
  verbose: true,
  collectCoverage: false,
  globals: {
    'ts-jest': {
      tsconfig: {
        jsx: 'react'
      }
    }
  }
};