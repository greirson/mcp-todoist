# Multi-purpose Dockerfile for MCP Todoist Server
# - Default (Railway): HTTP/SSE server on port from env
# - Smithery: stdio transport for desktop clients
FROM node:20-alpine

WORKDIR /app

# Install dependencies and build the TypeScript project
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build && npm prune --omit=dev

# Expose port for Railway deployment
EXPOSE 3000

# Default command runs HTTP server (Railway)
# For stdio mode (Smithery), override with: CMD ["node", "dist/index.js"]
CMD ["npm", "start"]
