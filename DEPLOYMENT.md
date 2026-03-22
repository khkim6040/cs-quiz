# CS Quiz 배포 가이드 (Vercel + Neon PostgreSQL)

이 문서는 CS Quiz 애플리케이션을 Vercel에 배포하고 Neon PostgreSQL을 데이터베이스로 사용하는 방법을 안내합니다.

## 빠른 시작

### 1. Neon 데이터베이스 생성

1. [Neon Console](https://console.neon.tech/)에서 계정 생성
2. 새 프로젝트 생성
3. Connection string 복사 (형식: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

### 2. Prisma 마이그레이션 적용

```bash
# .env 파일에 Neon connection string 설정
echo 'DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"' > .env

# 마이그레이션 실행
npx prisma migrate deploy

# Seed 데이터 삽입 (선택)
npx prisma db seed
```

### 3. Vercel 배포

1. [Vercel](https://vercel.com)에 GitHub 계정으로 로그인
2. **Add New Project** > GitHub 레포지토리 선택
3. 프레임워크가 Next.js로 자동 감지되는지 확인
4. 환경 변수 설정:
   ```
   DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```
5. **Deploy** 클릭

이후 `main` 브랜치에 푸시하면 자동 배포됩니다.

### 4. 일일 퀴즈 생성 (Cron)

Vercel Cron 또는 GitHub Actions로 매일 퀴즈 세트를 생성할 수 있습니다.

```bash
# 로컬에서 수동 실행
npm run generate-daily        # 내일 퀴즈 세트 생성
npm run generate-daily:week   # 7일치 생성
npm run generate-daily:month  # 30일치 생성
```

---

## 환경 변수

| 변수 | 필수 | 용도 |
|------|------|------|
| `DATABASE_URL` | O | Neon PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | X | AI 문제 생성 스크립트용 (dev server에는 불필요) |

---

## 트러블슈팅

### Prisma Client 빌드 에러

Vercel 빌드 시 `@prisma/client`를 찾을 수 없는 경우:

```bash
# postinstall 스크립트가 없다면 package.json에 추가
"scripts": {
  "postinstall": "prisma generate"
}
```

### Neon 연결 타임아웃

Neon은 비활성 시 컴퓨트를 일시 중지합니다 (Free 티어). 첫 요청이 느릴 수 있으며, 이는 정상 동작입니다.

### 빌드 실패

1. Node 버전 확인 — `.node-version` 파일에 `20`이 지정되어 있음
2. `package-lock.json`이 커밋되어 있는지 확인
3. `npm run check`로 로컬에서 lint + type-check 통과 확인

---

## 비용

**Vercel Hobby (무료)**:
- 100GB 대역폭/월
- Serverless Function 실행 100GB-Hours/월
- 자동 HTTPS, Preview Deployments

**Neon Free Tier**:
- 0.5 GiB 스토리지
- 컴퓨트 190시간/월 (비활성 시 자동 일시 중지)
- 1개 프로젝트, 10개 브랜치

**예상 비용: $0/월** (무료 티어 내)

---

## 유용한 링크

- [Vercel 문서](https://vercel.com/docs)
- [Neon 문서](https://neon.tech/docs)
- [Prisma + Neon 가이드](https://www.prisma.io/docs/orm/overview/databases/neon)
- [Vercel + Neon 통합](https://vercel.com/integrations/neon)
