#!/bin/bash
# Setup script for development environment
# Run this after cloning the repo: npm run setup:dev

echo "Setting up development environment..."

# Create public directory structure and symlink screenshots
PUBLIC_DIR="$(dirname "$0")/../public/dws-report/reports"
SCREENSHOTS_SOURCE="$(dirname "$0")/../../dws-report/reports/screenshots"

mkdir -p "$PUBLIC_DIR"

# Remove existing symlink if it exists
if [ -L "$PUBLIC_DIR/screenshots" ]; then
  rm "$PUBLIC_DIR/screenshots"
fi

# Create symlink to screenshots folder
ln -sf "$SCREENSHOTS_SOURCE" "$PUBLIC_DIR/screenshots"

echo "✓ Created symlink: public/dws-report/reports/screenshots -> dws-report/reports/screenshots"
echo "✓ Development environment setup complete!"
