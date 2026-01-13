ARG NOTION_PAGE_ID
ARG NEXT_PUBLIC_THEME

FROM node:22 AS base

# 1. Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config libpixman-1-dev libcairo2-dev \
    && rm -rf /var/lib/apt/lists/*
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

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
