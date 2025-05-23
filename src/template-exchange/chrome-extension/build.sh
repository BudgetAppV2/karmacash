#!/bin/bash

# Template Exchange Chrome Extension Build Script
# This script creates a ZIP file of the extension for distribution

# Set directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/dist"
ZIP_NAME="template-exchange-chrome-extension.zip"

# Create output directory if it doesn't exist
mkdir -p "${OUTPUT_DIR}"

# Clean any existing ZIP file
rm -f "${OUTPUT_DIR}/${ZIP_NAME}"

# Create ZIP file from extension directory, excluding build files
cd "${SCRIPT_DIR}" && zip -r "${OUTPUT_DIR}/${ZIP_NAME}" \
  manifest.json \
  popup.html \
  README.md \
  css/ \
  js/ \
  images/ \
  -x "*.DS_Store" \
  -x "build.sh" \
  -x "*/.git/*" \
  -x "dist/*"

# Check if ZIP was created successfully
if [ -f "${OUTPUT_DIR}/${ZIP_NAME}" ]; then
  echo "Extension packaged successfully: ${OUTPUT_DIR}/${ZIP_NAME}"
  echo "Size: $(du -h "${OUTPUT_DIR}/${ZIP_NAME}" | cut -f1)"
else
  echo "Error: Failed to create extension package"
  exit 1
fi 