# 1. Build Stage
FROM node:18-bullseye-slim AS builder

WORKDIR /app

# 의존성 설치와 Prisma generate
COPY prisma ./prisma
COPY package*.json ./
RUN apt-get update && \
    apt-get install -y openssl libssl1.1 libc6 && \
    rm -rf /var/lib/apt/lists/* && \
    npm install && \
    npx prisma generate

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 2. Production Stage
FROM node:18-bullseye-slim AS runner

WORKDIR /app

ENV NODE_ENV production

# nextjs 사용자 생성
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 런타임에 필요한 파일만 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=builder /app/prisma ./prisma

# (선택적) public 폴더가 있다면 복사
# COPY --from=builder /app/public ./public

# SQLite 데이터 디렉토리 준비
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]