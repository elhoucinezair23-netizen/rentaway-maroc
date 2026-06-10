# ─── RentaWay Maroc — Backend Express + Prisma (production) ───
# Multi-stage : builder → runner avec deps prod uniquement

# 1) builder : install + prisma generate + tsc
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

# 2) runner : image minimale
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl tini
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

# User non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 expressjs

# Install only production deps
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev \
 && npx prisma generate \
 && npm cache clean --force

# Code compilé + assets
COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/exports /app/uploads \
 && chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:4000/health > /dev/null 2>&1 || exit 1

# tini = init PID 1 propre (signaux + reaping)
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "run", "start:prod"]
