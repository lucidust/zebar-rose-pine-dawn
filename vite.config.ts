import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [solidPlugin()],
  base: './',
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        vanilla: resolve(rootDir, 'vanilla/index.html'),
        'with-glazewm': resolve(rootDir, 'with-glazewm/index.html'),
        'with-komorebi': resolve(rootDir, 'with-komorebi/index.html'),
      },
    },
  },
});
