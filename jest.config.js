module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    '**/*.html',
    '!node_modules/**',
    '!coverage/**',
    '!tests/**'
  ],
  verbose: true
};
