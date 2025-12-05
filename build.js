#!/usr/bin/env node
/**
 * Build script that runs vite programmatically
 * This avoids permission issues with the vite binary
 */
import { build } from 'vite';
import { defineConfig } from './vite.config.ts';

const config = await import('./vite.config.ts');
const viteConfig = config.default;

try {
  await build(viteConfig);
  console.log('Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
}

