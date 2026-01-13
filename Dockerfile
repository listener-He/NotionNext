ARG NOTION_PAGE_ID
ARG NEXT_PUBLIC_THEME

FROM node:24-alpine AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache python3 make g++ pkgconfig pixman-dev cairo-dev
WORKDIR /app
COPY package.json ./
RUN yarn install --frozen-lockfile

# 2. Rebuild the source code only when needed
FROM base AS builder
ARG NOTION_PAGE_ID
ENV NEXT_BUILD_STANDALONE=true

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN yarn build

# 3. Production image, copy all the files and run next
FROM base AS runner
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
