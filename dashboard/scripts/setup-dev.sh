#!/bin/bash
# Setup script for development environment
# Run this after cloning the repo: npm run setup:dev

echo "Setting up development environment..."

# Get absolute paths
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PUBLIC_DIR="$SCRIPT_DIR/../public"
SCREENSHOTS_SOURCE="$SCRIPT_DIR/../../dws-report/reports/screenshots"

mkdir -p "$PUBLIC_DIR"

# Check if source screenshots directory exists
if [ ! -d "$SCREENSHOTS_SOURCE" ]; then
  echo "Error: Screenshots source directory does not exist: $SCREENSHOTS_SOURCE"
  echo "Please run the collector to generate test reports and screenshots first."
  exit 1
fi

# Remove existing screenshots path if it conflicts
if [ -L "$PUBLIC_DIR/screenshots" ] || [ -f "$PUBLIC_DIR/screenshots" ]; then
  rm -f "$PUBLIC_DIR/screenshots"
elif [ -d "$PUBLIC_DIR/screenshots" ]; then
  # If it's an empty directory, remove it; otherwise, fail with a clear message
  if [ -z "$(ls -A "$PUBLIC_DIR/screenshots")" ]; then
    rmdir "$PUBLIC_DIR/screenshots"
  else
    echo "Error: $PUBLIC_DIR/screenshots exists and is a non-empty directory."
    echo "Please remove or rename it before re-running this setup script."
    exit 1
  fi
fi

# Create symlink to screenshots folder
ln -sf "$SCREENSHOTS_SOURCE" "$PUBLIC_DIR/screenshots"

echo "✓ Created symlink: public/screenshots -> dws-report/reports/screenshots"
echo "✓ Development environment setup complete!"
