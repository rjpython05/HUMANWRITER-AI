FROM node:20-alpine as base

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Development stage
FROM base as development

RUN npm ci

# Generate Prisma client
RUN npx prisma generate

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Dependencies stage
FROM base as deps

RUN npm ci --only=production

RUN npx prisma generate

# Build stage
FROM base as build

RUN npm ci

RUN npx prisma generate

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine as production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/next.config.mjs ./next.config.mjs
COPY --from=build /app/prisma ./prisma

EXPOSE 3000

CMD ["npm", "start"]
