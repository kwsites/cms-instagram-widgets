module.exports = {
   rootDir: require('path').join(__dirname, '..'),
   roots: [
      "<rootDir>/src/",
      "<rootDir>/test/",
   ],
   coverageThreshold: {
      global: {
         branches: 80,
         functions: 80,
         lines: 80,
         statements: 80
      }
   },
   coveragePathIgnorePatterns: [
      '<rootDir>/test/',
   ],
   coverageReporters: ['json', 'lcov', 'text', 'clover'],
   preset: '@shelf/jest-mongodb',
   testMatch: [
      "**/test/**/*.spec.*",
   ]
};
