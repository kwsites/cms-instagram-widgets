module.exports = {
   rootDir: require('path').join(__dirname, '..'),
   roots: [
      "<rootDir>/src/",
      "<rootDir>/test/",
   ],
   coverageThreshold: {
      global: {
         branches: 60,
         functions: 60,
         lines: 60,
         statements: 60
      }
   },
   coveragePathIgnorePatterns: [
      '<rootDir>/test/',
      '<rootDir>/node_modules/',
      '<rootDir>/src/public/',
   ],
   coverageReporters: ['json', 'lcov', 'text', 'clover'],
   preset: '@shelf/jest-mongodb',
   testMatch: [
      "**/test/**/*.spec.*",
   ]
};
