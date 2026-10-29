import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**/*.ts', 'src/app/**/*.ts', 'src/explanations/**/*.ts'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**'],
    },
  },
});
