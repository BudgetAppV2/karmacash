import { defineConfig } from 'vitest/config';
import { mergeConfig } from 'vite';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.test.js', 'tests/**/*.spec.js', 'src/**/*.test.js', 'src/**/*.spec.js'],
      setupFiles: ['./tests/setup.js'],
    }
  })
); 