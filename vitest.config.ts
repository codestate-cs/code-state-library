
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const alias = {
  '@codestate/core': resolve(__dirname, 'packages/core'),
  '@codestate/core/*': resolve(__dirname, 'packages/core/*'),
  '@codestate/infrastructure': resolve(__dirname, 'packages/infrastructure'),
  '@codestate/infrastructure/*': resolve(__dirname, 'packages/infrastructure/*'),
  '@codestate/framework': resolve(__dirname, 'packages/framework'),
  '@codestate/framework/*': resolve(__dirname, 'packages/framework/*'),
  '@codestate/cli-api': resolve(__dirname, 'packages/cli-api'),
  '@codestate/cli-api/*': resolve(__dirname, 'packages/cli-api/*'),
  '@codestate/cli-interface': resolve(__dirname, 'packages/cli-interface'),
  '@codestate/cli-interface/*': resolve(__dirname, 'packages/cli-interface/*'),
  '@codestate/shared': resolve(__dirname, 'packages/shared'),
  '@codestate/shared/*': resolve(__dirname, 'packages/shared/*'),
};

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
  resolve: {
    alias,
  },
});
