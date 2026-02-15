# Worker (Node.js) Dockerfile

FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy application
COPY dist ./dist
COPY src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Create logs directory
RUN mkdir -p /app/logs

CMD ["node", "dist/index.js"]
