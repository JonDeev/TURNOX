import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.integration.spec.ts'],
    setupFiles: ['./test/setup.ts'],
  },
});
