#!/usr/bin/env node
/**
 * Build script that runs vite programmatically
 * This avoids permission issues with the vite binary
 */
import { build, loadConfigFromFile } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  // Try to load vite.config.ts
  const configResult = await loadConfigFromFile(
    { command: 'build', mode: 'production' },
    resolve(__dirname, 'vite.config.ts')
  );
  
  const viteConfig = configResult?.config || {
    build: {
      outDir: 'dist',
    },
  };

  await build(viteConfig);
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  console.error('Error details:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
  process.exit(1);
}

