import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { serverlessApiPlugin } from './dev-api';

export default defineConfig({
  plugins: [serverlessApiPlugin(), react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/shared': path.resolve(__dirname, './shared/src'),
      '@code-wars/shared': path.resolve(__dirname, './shared/src'),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
  },
});
