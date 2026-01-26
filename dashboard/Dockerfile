# Build with repo root as context so shared files (e.g., dws-queues.json, dws-report) are available.
# Example: docker build -f dashboard/Dockerfile -t dashboard:v1 .

# BUILD STAGE: install all deps (including dev) and build static assets
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY dashboard/package*.json ./
RUN npm install

# Copy source and shared data, then build
COPY dashboard/ ./
# utils.ts imports ../../dws-queues.json (project root), so place it at filesystem root
COPY dws-queues.json /dws-queues.json
# Also copy dws-report directory
COPY dws-report/ /dws-report
# Remove broken symlink from dev environment and copy actual screenshots
RUN rm -rf /app/public/screenshots && \
  mkdir -p /app/public/screenshots && \
  cp -r /dws-report/reports/screenshots/. /app/public/screenshots
RUN npm run build

# RUNTIME STAGE: serve static assets via nginx
FROM nginx:1.29.4-alpine
WORKDIR /usr/share/nginx/html

# Copy built assets
COPY --from=builder /app/dist ./
# Copy screenshots to be served at /screenshots/
COPY --from=builder /dws-report/reports/screenshots ./screenshots
EXPOSE 80

# Default nginx entrypoint
CMD ["nginx", "-g", "daemon off;"]
