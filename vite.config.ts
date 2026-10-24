import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset paths so the site works at https://<user>.github.io/<repo>/
  base: './',
  build: { outDir: 'dist' },
});
