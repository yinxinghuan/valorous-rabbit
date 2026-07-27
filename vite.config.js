import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@shared/runtime': fileURLToPath(new URL('./src/shared/runtime/index.ts', import.meta.url)),
    },
  },
});
