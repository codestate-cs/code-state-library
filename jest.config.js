export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/packages'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }]
  },
  moduleNameMapper: {
    '^@codestate/core/(.*)$': '<rootDir>/packages/core/$1',
    '^@codestate/infrastructure/(.*)$': '<rootDir>/packages/infrastructure/$1',
    '^@codestate/framework/(.*)$': '<rootDir>/packages/framework/$1',
    '^@codestate/cli-api/(.*)$': '<rootDir>/packages/cli-api/$1',
    '^@codestate/cli-interface/(.*)$': '<rootDir>/packages/cli-interface/$1',
    '^@codestate/shared/(.*)$': '<rootDir>/packages/shared/$1'
  },
  collectCoverageFrom: [
    'packages/**/*.ts',
    '!packages/**/*.d.ts',
    '!packages/**/index.ts',
    '!packages/**/api.ts',
    '!tests/**/*'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 10000,
  verbose: true,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true
}; 