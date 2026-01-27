#!/bin/bash
# Build script for MCPB (MCP Bundle) package

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MCPB_DIR="$PROJECT_ROOT/mcpb"
BUILD_DIR="$MCPB_DIR/build"
SERVER_DIR="$BUILD_DIR/server"

echo "Building MCPB package for mcp-todoist..."

# Step 1: Build TypeScript
echo "Step 1: Building TypeScript..."
cd "$PROJECT_ROOT"
npm run build

# Step 2: Clean and create build directory
echo "Step 2: Preparing build directory..."
rm -rf "$BUILD_DIR"
mkdir -p "$SERVER_DIR"

# Step 3: Copy compiled server files
echo "Step 3: Copying server files..."
cp -r "$PROJECT_ROOT/dist/"* "$SERVER_DIR/"

# Step 4: Copy production dependencies
echo "Step 4: Installing production dependencies..."
cd "$BUILD_DIR"
cp "$PROJECT_ROOT/package.json" .
cp "$PROJECT_ROOT/package-lock.json" . 2>/dev/null || true
npm install --omit=dev --ignore-scripts

# Move node_modules into server directory for cleaner structure
mv node_modules "$SERVER_DIR/"

# Clean up package files from build root
rm -f package.json package-lock.json

# Step 5: Copy manifest and assets
echo "Step 5: Copying manifest and assets..."
cp "$MCPB_DIR/manifest.json" "$BUILD_DIR/"

# Copy icon if it exists
if [ -f "$MCPB_DIR/icon.png" ]; then
    cp "$MCPB_DIR/icon.png" "$BUILD_DIR/"
fi

# Step 6: Create .mcpb package (zip file)
echo "Step 6: Creating .mcpb package..."
cd "$BUILD_DIR"
PACKAGE_NAME="todoist-mcp.mcpb"
rm -f "$MCPB_DIR/$PACKAGE_NAME"
zip -r "$MCPB_DIR/$PACKAGE_NAME" . -x "*.DS_Store" -x "__MACOSX/*"

# Step 7: Cleanup
echo "Step 7: Cleaning up..."
rm -rf "$BUILD_DIR"

echo ""
echo "MCPB package created successfully!"
echo "Output: $MCPB_DIR/$PACKAGE_NAME"
echo ""
echo "To install in Claude Desktop:"
echo "  - Double-click the .mcpb file, or"
echo "  - Drag and drop it onto Claude Desktop"
