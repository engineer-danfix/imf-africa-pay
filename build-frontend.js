const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting frontend build process...');

try {
  // Change to src directory
  const srcDir = path.join(__dirname, 'src');
  process.chdir(srcDir);
  console.log('Changed to src directory:', process.cwd());

  // Install dependencies
  console.log('Installing frontend dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the frontend
  console.log('Building frontend...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Go back to root
  process.chdir(__dirname);
  console.log('Changed back to root directory:', process.cwd());

  // Copy built files to dist
  const distDir = path.join(__dirname, 'dist');
  const srcDistDir = path.join(__dirname, 'src', 'dist');
  
  if (fs.existsSync(srcDistDir)) {
    console.log('Copying built files to dist directory...');
    execSync('mkdir -p dist && cp -r src/dist/* dist/', { stdio: 'inherit' });
    console.log('Build completed successfully!');
  } else {
    console.log('Warning: src/dist directory does not exist after build');
  }
} catch (error) {
  console.error('Build process failed:', error.message);
  process.exit(1);
}