# Dockerfile

# 1. Build Stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# SQLite DB 파일은 빌드 시점에 복사하지 않습니다. 런타임에 생성/마운트됩니다.
# Prisma generate는 런타임에 SQLite DB 파일이 존재해야 할 수도 있으므로,
# 또는 빌드 시점에 임시 DB 파일로 generate 할 수도 있습니다.
# 여기서는 프로덕션 스테이지에서 generate 하는 것을 가정합니다.
# Next.js 앱 빌드 (output: 'standalone' 사용 권장)
RUN npm run build 

# 2. Production Stage
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# DATABASE_URL은 Docker 실행 시 환경변수로 주입하거나 .env 파일 마운트
# 예: DATABASE_URL="file:/app/data/prod.db"

# nextjs 사용자와 그룹 생성 (보안 강화)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 필요한 파일만 복사 (standalone output 사용 시)
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Prisma 스키마 및 클라이언트 실행에 필요한 파일 복사
COPY --chown=nextjs:nodejs prisma ./prisma

# (선택적) 프로덕션 의존성만 설치 (만약 standalone에 포함되지 않는 Prisma Client 등이 있다면)
# COPY --from=builder /app/package.json ./
# RUN npm install --omit=dev

# Prisma Client 생성 (런타임에 DB 파일이 해당 경로에 있을 것을 예상)    
# 이 단계는 Docker 이미지 빌드 시 한 번만 실행됩니다.
# DB 파일 자체는 볼륨으로 마운트되거나, 앱 첫 실행 시 생성/시딩 될 수 있습니다.
RUN npx prisma generate

# 애플리케이션 데이터 디렉토리 생성 및 권한 설정 (SQLite DB 파일 저장용)
RUN mkdir -p /app/data && chown nextjs:nodejs /app/data
# 만약 Prisma 스키마가 `file:./prisma/prod.db`를 가리킨다면,
# RUN mkdir -p /app/prisma && chown nextjs:nodejs /app/prisma

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"] # standalone output 사용 시