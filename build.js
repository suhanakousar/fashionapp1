#!/usr/bin/env node
/**
 * Build script that runs vite programmatically
 * This avoids permission issues with the vite binary
 */
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Dynamic imports to handle module resolution better
  const { build } = await import('vite');
  const react = (await import('@vitejs/plugin-react')).default;
  const path = await import('path');
  
  const viteConfig = {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
      },
    },
  };

  await build(viteConfig);
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  console.error('Error details:', error.message);
  console.error('Error code:', error.code);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
}

