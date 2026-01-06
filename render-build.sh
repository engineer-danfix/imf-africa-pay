#!/bin/bash
set -e

echo "Installing root dependencies..."
npm install

echo "Changing to src directory..."
cd src

echo "Installing frontend dependencies..."
npm install

echo "Building frontend with vite..."
npx vite build

echo "Returning to root directory..."
cd ..

echo "Creating dist directory in root..."
mkdir -p dist

if [ -d "src/dist" ]; then
    echo "Copying built files to root dist directory..."
    cp -r src/dist/* dist/
    echo "Build completed successfully!"
else
    echo "Error: src/dist directory does not exist after build"
    exit 1
fi