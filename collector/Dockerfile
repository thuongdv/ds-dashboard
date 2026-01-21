# Base image with Playwright browsers and Node runtime
FROM mcr.microsoft/playwright:v1.57.0-jammy

ENV NODE_ENV=production
WORKDIR /app

# Install dependencies first to leverage cache
COPY package*.json tsconfig.json playwright.config.ts ./
RUN npm install --omit=optional

# Copy source code
COPY . .

# Drop privileges
USER pwuser

# Default to running the Playwright collectors; override CMD for specific specs
CMD ["npx", "playwright", "test"]
