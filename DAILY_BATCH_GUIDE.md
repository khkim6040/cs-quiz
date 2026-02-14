# 데일리 문제 생성 배치 가이드

## 개요

데일리 퀴즈 문제는 매일 배치 스크립트를 통해 미리 생성됩니다. 이 방식은 다음과 같은 장점이 있습니다:

- **성능 향상**: API 호출 시 전체 문제를 조회하지 않음
- **안정성**: 미리 생성된 문제 세트로 일관된 서비스 제공
- **확장성**: 문제 수가 증가해도 API 성능에 영향 없음

## 배치 스크립트 사용법

### 1. 내일 문제 생성 (기본)

```bash
npm run generate-daily
```

- 내일 날짜의 문제 세트를 20개 생성합니다
- 이미 존재하는 경우 건너뜁니다

### 2. 일주일치 문제 생성

```bash
npm run generate-daily:week
```

- 오늘부터 7일간의 문제 세트를 생성합니다

### 3. 한 달치 문제 생성

```bash
npm run generate-daily:month
```

- 오늘부터 30일간의 문제 세트를 생성합니다

### 4. 커스텀 생성

```bash
npm run generate-daily -- [일수] [문제수]
```

예시:
```bash
# 5일치, 각 15개 문제
npm run generate-daily -- 5 15

# 10일치, 각 20개 문제 (기본값)
npm run generate-daily -- 10 20
```

## 자동화 설정

### Cron을 사용한 자동 실행 (Linux/Mac)

매일 자정에 다음 날 문제를 자동 생성하려면:

```bash
# crontab 편집
crontab -e

# 다음 라인 추가 (매일 자정 실행)
0 0 * * * cd /path/to/cs-quiz && npm run generate-daily >> /var/log/daily-questions.log 2>&1
```

### GitHub Actions를 사용한 자동 실행

`.github/workflows/daily-questions.yml` 파일 생성:

```yaml
name: Generate Daily Questions

on:
  schedule:
    # 매일 UTC 15:00 (한국시간 자정)
    - cron: '0 15 * * *'
  workflow_dispatch: # 수동 실행 가능

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run generate-daily:week
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Vercel Cron Jobs

`vercel.json`에 추가:

```json
{
  "crons": [
    {
      "path": "/api/cron/generate-daily",
      "schedule": "0 0 * * *"
    }
  ]
}
```

그리고 `/api/cron/generate-daily/route.ts` 생성:

```typescript
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET(request: Request) {
  // Vercel Cron 인증 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await execAsync('npm run generate-daily:week');
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate' }, { status: 500 });
  }
}
```

## 문제 생성 로직

### 선택 알고리즘

1. 날짜를 기반으로 시드 생성 (YYYYMMDD)
2. 시드를 사용한 Fisher-Yates 셔플
3. 섞인 문제 중 처음 20개 선택

### 특징

- **재현 가능**: 같은 날짜는 항상 같은 문제 세트
- **공정성**: 모든 문제가 동등한 확률로 선택
- **다양성**: 매일 다른 문제 조합

## 트러블슈팅

### 문제가 생성되지 않는 경우

```bash
# 데이터베이스 연결 확인
npx prisma db pull

# 문제 수 확인
npx prisma studio
```

### 특정 날짜의 문제 재생성

수동으로 데이터베이스에서 해당 날짜의 레코드를 삭제한 후 다시 실행:

```sql
DELETE FROM "DailyQuestionSet" WHERE date = '2026-02-15';
```

그리고:

```bash
npm run generate-daily
```

### 로그 확인

스크립트 실행 시 다음 정보가 출력됩니다:

- 각 날짜별 생성 결과
- 선택된 문제 수
- 에러 발생 시 상세 정보
- 최종 요약 (생성/이미 존재/에러 건수)

## 모니터링

주기적으로 확인해야 할 사항:

1. **미래 문제 세트 존재 여부**
   ```sql
   SELECT date, id, array_length(questionIds, 1) as question_count
   FROM "DailyQuestionSet"
   WHERE date >= CURRENT_DATE
   ORDER BY date;
   ```

2. **문제 수가 20개인지 확인**
   ```sql
   SELECT date, array_length(questionIds, 1) as question_count
   FROM "DailyQuestionSet"
   WHERE array_length(questionIds, 1) != 20;
   ```

3. **배치 실행 로그 확인**

## 권장 사항

- **최소 3일치 문제를 미리 생성**해두는 것을 권장합니다
- 일주일에 한 번씩 `generate-daily:week` 실행
- 배포 후 첫 실행 시 `generate-daily:month`로 한 달치 생성

## API 동작 변경

이전과 달리 API는 더 이상 문제를 실시간으로 생성하지 않습니다:

- **이전**: 오늘의 문제 세트가 없으면 즉시 생성
- **현재**: 오늘의 문제 세트가 없으면 404 에러 반환

이는 성능과 안정성을 위한 의도된 동작입니다. 배치 스크립트를 통해 미리 문제를 생성해야 합니다.
