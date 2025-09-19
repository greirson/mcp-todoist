# Generated for Smithery deployments. See: https://smithery.ai/docs/build/project-config/dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies and build the TypeScript project
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build && npm prune --omit=dev

# Default command runs the MCP server over stdio
CMD ["node", "dist/index.js"]
