FROM node:20-alpine as base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Development stage
FROM base as development

RUN npm ci

COPY . .

CMD ["npm", "run", "dev"]

# Build stage
FROM base as build

RUN npm ci

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine as production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --only=production

COPY --from=build /app/dist ./dist

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "dist/index.js"]
