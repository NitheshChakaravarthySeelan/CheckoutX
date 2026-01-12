module.exports = {
  preset: 'ts-jest/presets/default-esm', // Use the ESM preset
  testEnvironment: 'node',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // Add module file extensions
  extensionsToTreatAsEsm: ['.ts', '.tsx'], // Treat .ts and .tsx as ESM
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true, // Explicitly enable ESM for ts-jest transform
    }],
  },
  moduleNameMapper: {
    // Jest needs to know how to handle ESM imports in node_modules
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^#proto/(.*).js$': '<rootDir>/src/proto/$1.ts', // Map #proto alias with .js extension
    '^#proto/(.*)$': '<rootDir>/src/proto/$1' // Map #proto alias
  },
};