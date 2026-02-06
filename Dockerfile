# Build stage for frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build stage for backend
FROM node:20-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

# Copy backend build and node_modules
COPY --from=backend-build /app/backend/dist ./dist
COPY --from=backend-build /app/backend/node_modules ./node_modules
COPY --from=backend-build /app/backend/package.json ./

# Copy frontend build to public folder
COPY --from=frontend-build /app/frontend/dist ./public

# Create data directory for JSON storage (will be mounted as volume in production)
RUN mkdir -p /app/data && chown -R node:node /app/data

# Set environment variables
ENV DATA_DIR=/app/data
ENV PORT=8000

USER node

EXPOSE 8000

CMD ["node", "dist/main.js"]
