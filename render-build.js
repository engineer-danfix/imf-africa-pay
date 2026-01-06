const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting build process on Render...');

try {
  // Install root dependencies
  console.log('Installing root dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Change to src directory
  const srcDir = path.join(__dirname, 'src');
  console.log('Changing to src directory...');
  process.chdir(srcDir);

  // Install frontend dependencies
  console.log('Installing frontend dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build the frontend using vite with npx to ensure it works
  console.log('Building frontend with vite...');
  execSync('npx vite build', { stdio: 'inherit' });

  // Go back to root
  process.chdir(__dirname);
  console.log('Returned to root directory');

  // Create dist directory and copy built files
  const distDir = path.join(__dirname, 'dist');
  const srcDistDir = path.join(__dirname, 'src', 'dist');

  if (fs.existsSync(srcDistDir)) {
    console.log('Creating dist directory...');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    // Copy files using Node.js instead of shell commands
    const files = fs.readdirSync(srcDistDir);
    for (const file of files) {
      const srcPath = path.join(srcDistDir, file);
      const destPath = path.join(distDir, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        // Copy directory recursively
        const copyDir = (src, dest) => {
          if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
          }
          const items = fs.readdirSync(src);
          for (const item of items) {
            const itemSrc = path.join(src, item);
            const itemDest = path.join(dest, item);
            if (fs.statSync(itemSrc).isDirectory()) {
              copyDir(itemSrc, itemDest);
            } else {
              fs.copyFileSync(itemSrc, itemDest);
            }
          }
        };
        copyDir(srcPath, destPath);
      } else {
        // Copy file
        fs.copyFileSync(srcPath, destPath);
      }
    }

    console.log('Build completed successfully!');
  } else {
    console.error('Error: src/dist directory does not exist after build');
    process.exit(1);
  }
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}