# CS Quiz 배포 가이드 (Cloudflare Pages)

이 문서는 CS Quiz 애플리케이션을 Cloudflare Pages에 배포하는 방법을 안내합니다.

## 🚀 빠른 시작

### 1. Cloudflare 계정 준비

1. [Cloudflare](https://dash.cloudflare.com/) 계정 생성 (무료)
2. Cloudflare Pages 대시보드 접속

### 2. D1 데이터베이스 생성

Cloudflare D1은 SQLite 기반 데이터베이스입니다.

```bash
# Wrangler CLI 설치 (Cloudflare CLI 도구)
npm install -g wrangler

# Cloudflare 로그인
wrangler login

# D1 데이터베이스 생성
wrangler d1 create cs-quiz-db
```

생성 후 출력되는 `database_id`를 복사하여 `wrangler.toml` 파일에 입력합니다:

```toml
[[d1_databases]]
binding = "DB"
database_name = "cs-quiz-db"
database_id = "여기에-database-id-입력"
```

### 3. D1에 스키마 마이그레이션

Prisma 마이그레이션을 D1에 적용합니다:

```bash
# Prisma 마이그레이션 SQL 파일 확인
cat prisma/migrations/*/migration.sql

# D1에 직접 실행 (모든 마이그레이션 파일 병합)
wrangler d1 execute cs-quiz-db --file=./prisma/migrations/20250530054736_init_sqlite/migration.sql
wrangler d1 execute cs-quiz-db --file=./prisma/migrations/20260205132336_add_user_daily_leaderboard/migration.sql
```

또는 수동으로 SQL 실행:

```bash
wrangler d1 execute cs-quiz-db --command="SQL 명령어"
```

### 4. Seed 데이터 삽입 (선택사항)

초기 문제 데이터를 D1에 삽입:

```bash
# 로컬에서 seed 실행 후 생성된 데이터를 export
# 또는 D1 콘솔에서 직접 INSERT 문 실행

# 예시: SQL로 변환하여 실행
wrangler d1 execute cs-quiz-db --file=./seed.sql
```

### 5. GitHub 레포지토리 연동

1. GitHub에 코드 푸시:
   ```bash
   git push origin main
   ```

2. Cloudflare Pages 대시보드에서:
   - **Create a project** 클릭
   - **Connect to Git** 선택
   - GitHub 레포지토리 선택
   - 빌드 설정:
     ```
     Framework preset: Next.js
     Build command: npm run build
     Build output directory: .next
     Root directory: /
     Node version: 20
     ```

### 6. 환경 변수 설정

Cloudflare Pages 대시보드의 Settings > Environment variables에서:

```
DATABASE_URL=file:./dev.db  # 로컬 개발용 (프로덕션에서는 D1 자동 바인딩)
ANTHROPIC_API_KEY=your-claude-api-key-here
NODE_ENV=production
```

### 7. D1 바인딩 설정

Cloudflare Pages 프로젝트 설정:
1. **Settings** > **Functions** > **D1 database bindings**
2. **Add binding** 클릭
3. Variable name: `DB`
4. D1 database: `cs-quiz-db` 선택

### 8. 배포 완료!

커밋을 푸시하면 자동으로 배포됩니다:

```bash
git add .
git commit -m "feat: 배포 준비 완료"
git push origin main
```

배포 URL: `https://cs-quiz.pages.dev` (자동 생성)

---

## 🔧 추가 설정

### Prisma와 D1 연동 (프로덕션)

D1을 사용하려면 Prisma Client를 D1 어댑터로 초기화해야 합니다.

`src/lib/prisma.ts` 수정:

```typescript
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Cloudflare Pages에서는 env.DB를 통해 D1에 접근
// @ts-ignore - Cloudflare binding
const db = typeof process !== 'undefined' && process.env.DB
  ? process.env.DB
  : undefined;

const prisma = global.prisma || new PrismaClient({
  // D1 사용 시 추가 설정 필요
});

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;

export default prisma;
```

**참고**: Next.js와 D1의 완전한 통합은 추가 작업이 필요할 수 있습니다. 대안으로 다음을 고려하세요:

1. **Turso** (Cloudflare와 유사한 SQLite 기반 DB): Prisma 공식 지원
2. **Cloudflare Workers** 직접 사용: D1 네이티브 지원
3. **PostgreSQL on Neon/Supabase**: Cloudflare Pages와 함께 사용

### Cron Jobs 설정 (일일 퀴즈 생성)

Cloudflare Workers Cron Triggers 사용:

1. `functions/scheduled.ts` 생성:
```typescript
export const onRequest: PagesFunction = async (context) => {
  // 일일 퀴즈 생성 로직
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // D1 쿼리 실행
  await context.env.DB.prepare("...").run();

  return new Response("OK");
};
```

2. `wrangler.toml`에 추가:
```toml
[triggers]
crons = ["0 0 * * *"] # 매일 자정
```

---

## 🐛 트러블슈팅

### 문제: "Module not found: Can't resolve '@prisma/client'"
**해결**:
```bash
npm install
npx prisma generate
```

### 문제: D1 연결 실패
**해결**:
1. `wrangler.toml`의 `database_id` 확인
2. D1 바인딩이 올바르게 설정되었는지 확인
3. 마이그레이션이 실행되었는지 확인

### 문제: 빌드 실패
**해결**:
1. Node 버전 확인 (20 필요)
2. `.node-version` 파일 확인
3. `package-lock.json` 커밋 확인

---

## 📊 비용

Cloudflare Pages 무료 티어:
- ✅ 무제한 요청
- ✅ 500 빌드/월
- ✅ 동시 빌드 1개
- ✅ D1: 5GB 스토리지, 5백만 행 읽기/일
- ✅ Workers: 100,000 요청/일

**예상 비용: $0/월** (무료 티어 내)

---

## 🔗 유용한 링크

- [Cloudflare Pages 문서](https://developers.cloudflare.com/pages/)
- [D1 문서](https://developers.cloudflare.com/d1/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Next.js on Cloudflare](https://developers.cloudflare.com/pages/framework-guides/nextjs/)

---

## 대안: Vercel 배포 (더 쉬운 방법)

D1 설정이 복잡하다면 Vercel을 추천합니다:

1. [Vercel](https://vercel.com) 가입
2. GitHub 연동
3. Import project
4. 환경 변수 설정:
   ```
   DATABASE_URL=file:./prisma/dev.db
   ANTHROPIC_API_KEY=your-key
   ```
5. Deploy!

**비용**: $0/월 (Hobby), PostgreSQL 필요 시 Vercel Postgres 사용 ($0.25/10만 행)
