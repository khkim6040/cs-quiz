# Dockerfile

# 1. Build Stage
FROM node:18-alpine AS builder
# OpenSSL 1.1 설치 (Prisma 호환성)
RUN apk add --no-cache openssl1.1-compat libc6-compat # libc6-compat도 추가해볼 수 있음

WORKDIR /app

# Prisma 스키마 먼저 복사 (의존성 설치 전 generate 가능하도록)
COPY prisma ./prisma
COPY package*.json ./

# 의존성 설치 (Prisma generate는 devDependencies에 있는 경우가 많으므로, --omit=dev 없이 설치)
RUN npm install

# Prisma Client 생성 (모든 의존성 설치 후)
RUN npx prisma generate

# 나머지 소스 코드 복사
COPY . .

# Next.js 앱 빌드
RUN npm run build

# 2. Production Stage
FROM node:18-alpine AS runner
# OpenSSL 1.1 설치 (Prisma 런타임 호환성)
RUN apk add --no-cache openssl1.1-compat libc6-compat

WORKDIR /app

ENV NODE_ENV production
# DATABASE_URL은 Docker 실행 시 환경 변수로 주입

# nextjs 사용자와 그룹 생성
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 필요한 파일만 복사 (standalone output 사용 시)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma 쿼리 엔진 바이너리 및 스키마 복사
# standalone output에는 node_modules/.prisma/client 가 포함되지 않을 수 있음.
# query-engine 바이너리는 보통 node_modules/@prisma/engines/ 에 위치하고,
# generate 시 node_modules/.prisma/client/ 에 복사됨.
# standalone 빌드는 필요한 node_modules만 복사하므로, Prisma Client가 필요하다면 별도 처리 필요.

# 방법 1: 빌드 스테이지에서 생성된 Prisma Client 관련 파일 전체 복사
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/client ./node_modules/@prisma/client
# COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma/engines ./node_modules/@prisma/engines # 필요시

# 방법 2: 또는 runner에서 다시 generate (스키마 파일 필요)
# COPY --chown=nextjs:nodejs prisma ./prisma
# RUN npx prisma generate # 이 경우 runner에 prisma devDependency가 필요할 수 있음

# 애플리케이션 데이터 디렉토리 (SQLite DB 파일 저장용)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]