import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@code-wars/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
