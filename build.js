#!/usr/bin/env node
/**
 * Build script that runs vite programmatically
 * This avoids permission issues with the vite binary
 */
import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const viteConfig = {
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'esbuild',
  },
};

try {
  await build(viteConfig);
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

