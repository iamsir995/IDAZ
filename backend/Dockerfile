# Step 1: Base image
FROM node:20-alpine AS base

# Step 2: Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Clean install to strictly follow lockfile
RUN npm ci

# Step 3: Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

# Ensure public/uploads exists
RUN mkdir -p public/uploads/recordings

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Change ownership of uploads directory
RUN chown -R node:node public/uploads

USER node

EXPOSE 5000
ENV PORT 5000

CMD ["node", "server.js"]
