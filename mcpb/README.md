# Todoist MCP Bundle (MCPB)

This directory contains the MCPB (MCP Bundle) configuration for distributing the Todoist MCP server as a one-click installable extension for Claude Desktop.

## Building the MCPB Package

Run from the project root:

```bash
npm run build:mcpb
```

This will create `todoist-mcp.mcpb` in this directory.

## Installing in Claude Desktop

Once you have the `.mcpb` file:

1. **Double-click** the `todoist-mcp.mcpb` file, or
2. **Drag and drop** it onto Claude Desktop

Claude Desktop will prompt you to enter your Todoist API Token during installation.

## Getting Your Todoist API Token

1. Open Todoist (web or app)
2. Go to **Settings** > **Integrations** > **Developer**
3. Copy your API token
4. Paste it when prompted during installation

Direct link: https://app.todoist.com/app/settings/integrations/developer

## Adding an Icon

To add a custom icon to the extension:

1. Create a PNG image (recommended size: 128x128 or 256x256)
2. Name it `icon.png`
3. Place it in this `mcpb/` directory
4. Rebuild the package with `npm run build:mcpb`

The Todoist logo can be found at: https://doist.com/press

## Files

- `manifest.json` - MCPB manifest defining the extension metadata and configuration
- `icon.png` - Extension icon (optional, add your own)
- `README.md` - This file

## Manifest Overview

The manifest defines:

- **19 tools** for comprehensive Todoist integration
- **User configuration** for the API token (sensitive, secure storage)
- **Compatibility** with Claude Desktop on macOS, Windows, and Linux
- **Node.js runtime** requirement (>=18.0.0)

See `manifest.json` for the complete specification.
