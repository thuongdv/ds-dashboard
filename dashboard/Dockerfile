# Build with repo root as context so shared files (e.g., dws-queues.json) are available.
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
COPY dws-report/ /dws-report
RUN npm run build

# RUNTIME STAGE: serve static assets via nginx
FROM nginx:1.29.4-alpine
WORKDIR /usr/share/nginx/html

# Copy built assets
COPY --from=builder /app/dist ./
COPY --from=builder /dws-report /dws-report
EXPOSE 80

# Default nginx entrypoint
CMD ["nginx", "-g", "daemon off;"]
