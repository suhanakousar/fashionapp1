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
  // Use vite's CLI to load config properly
  const { build } = await import('vite');
  
  // Load config from vite.config.ts
  const configFile = resolve(__dirname, 'vite.config.ts');
  const configModule = await import(configFile + '?t=' + Date.now());
  const viteConfig = configModule.default || configModule;

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

