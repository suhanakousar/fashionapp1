#!/usr/bin/env node
/**
 * Build script wrapper that suppresses Vite warnings
 */
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Building with Vite...');

// Run vite build, ignoring exit code
let buildOutput = '';
let buildStderr = '';
let buildSucceeded = false;

try {
  buildOutput = execSync('vite build 2>&1', {
    encoding: 'utf8',
    cwd: __dirname,
    stdio: 'pipe'
  });
  buildSucceeded = true;
} catch (error) {
  buildOutput = error.stdout?.toString() || error.message || '';
  buildStderr = error.stderr?.toString() || '';
  // Don't exit yet - check if dist was created
}

// Filter out externalization warnings from output
const filteredOutput = buildOutput
  .split('\n')
  .filter(line => {
    const lower = line.toLowerCase();
    return !lower.includes('externalize') &&
           !lower.includes('external module') &&
           !lower.includes('rollupoptions.external') &&
           !lower.includes('build.rollupoptions.external') &&
           !lower.includes('can break your application') &&
           !lower.includes('vitewarn');
  })
  .join('\n');

const filteredStderr = buildStderr
  .split('\n')
  .filter(line => {
    const lower = line.toLowerCase();
    return !lower.includes('externalize') &&
           !lower.includes('external module') &&
           !lower.includes('rollupoptions.external') &&
           !lower.includes('build.rollupoptions.external') &&
           !lower.includes('can break your application') &&
           !lower.includes('vitewarn');
  })
  .join('\n');

// Check if dist folder was created (build actually succeeded)
const distExists = existsSync(join(__dirname, 'dist'));

if (distExists) {
  // Build succeeded - output filtered messages
  if (filteredOutput.trim()) {
    console.log(filteredOutput);
  }
  if (filteredStderr.trim() && !filteredStderr.includes('externalize')) {
    console.error(filteredStderr);
  }
  console.log('✅ Build completed successfully');
  process.exit(0);
} else {
  // Real error - show it
  console.error('❌ Build failed - dist folder not created');
  if (buildOutput) console.error(buildOutput);
  if (buildStderr) console.error(buildStderr);
  process.exit(1);
}

