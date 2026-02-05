# CS Quiz - 남은 작업 목록

## 🔴 필수 작업 (배포 전)

### 1. 사용자 인증 UI 구현
**현재 상태**: API만 구현됨, UI 없음

**작업 내용**:
- [ ] 로그인 모달 또는 페이지 추가
- [ ] 홈페이지에 로그인/로그아웃 버튼 추가
- [ ] 사용자 이름 표시 컴포넌트
- [ ] 로그인 안 한 사용자 처리 로직
  - 오늘의 퀴즈: 로그인 필수
  - 일반 퀴즈: 로그인 선택 (점수 기록 없이 연습 가능)

**예상 시간**: 1-2시간

**파일**:
```typescript
// src/components/LoginModal.tsx
// src/components/UserMenu.tsx
// src/app/layout.tsx 수정
```

---

### 2. AI로 문제 대량 생성
**현재 상태**: 스크립트 완성, 데이터 생성 안 됨

**작업 내용**:
- [ ] Anthropic API 키 발급 및 설정
- [ ] 각 주제별 개념 목록 작성
  - 컴퓨터 보안: 암호화, 인증, 네트워크 보안 등 20개 개념
  - 데이터베이스: 정규화, 트랜잭션, 인덱스 등 20개 개념
  - 알고리즘: 정렬, 탐색, 동적 프로그래밍 등 20개 개념
  - 자료구조: 트리, 그래프, 해시 등 20개 개념
- [ ] 각 개념당 3-5개 문제 생성
- [ ] 총 목표: **300-400개 문제**
- [ ] 품질 검증 및 수동 리뷰
- [ ] 데이터베이스에 저장

**예상 시간**: 4-6시간 (API 호출 시간 포함)

**명령어**:
```bash
# .env 파일에 API 키 추가
ANTHROPIC_API_KEY="sk-ant-..."

# 실행
npm run regenerate

# 또는 개념 목록 파일 생성 후 배치 실행
```

**예상 비용**:
- Claude 3.5 Sonnet 사용 시
- 문제당 약 2,000 토큰 (입력 1,000 + 출력 1,000)
- 400문제 × 2,000토큰 = 800,000토큰
- 비용: 약 $3-5

---

### 3. 실제 배포

#### Option A: Cloudflare Pages (무료, 추천)

**작업 내용**:
- [ ] Cloudflare 계정 생성
- [ ] Wrangler CLI 설치 및 로그인
- [ ] D1 데이터베이스 생성
  ```bash
  wrangler d1 create cs-quiz-db
  ```
- [ ] D1에 스키마 마이그레이션
  ```bash
  wrangler d1 execute cs-quiz-db --file=./prisma/migrations/20250530054736_init_sqlite/migration.sql
  wrangler d1 execute cs-quiz-db --file=./prisma/migrations/20260205132336_add_user_daily_leaderboard/migration.sql
  ```
- [ ] D1에 Seed 데이터 삽입
  - 로컬 SQLite → SQL 파일로 export
  - D1에 import
- [ ] GitHub 레포지토리 푸시
- [ ] Cloudflare Pages에서 GitHub 연동
- [ ] 환경 변수 설정
  - `ANTHROPIC_API_KEY`
  - `NODE_ENV=production`
- [ ] D1 바인딩 설정
- [ ] 배포 확인 및 테스트

**예상 시간**: 2-3시간

**참고**: `DEPLOYMENT.md` 파일

#### Option B: Vercel (더 쉬움, SQLite 파일 업로드)

**작업 내용**:
- [ ] Vercel 계정 생성
- [ ] GitHub 연동 및 Import Project
- [ ] 환경 변수 설정
  ```
  DATABASE_URL=file:./prisma/dev.db
  ANTHROPIC_API_KEY=sk-ant-...
  ```
- [ ] SQLite 파일을 레포지토리에 포함 (또는 Vercel Postgres 사용)
- [ ] 배포

**예상 시간**: 30분-1시간

**장점**: 설정이 훨씬 간단
**단점**: 무료 티어 제한 (대역폭, 빌드 시간)

---

### 4. Cron Job 설정 (일일 문제 세트 자동 생성)

**현재 상태**: API는 있지만 자동 실행 안 됨

#### Cloudflare 사용 시:

**작업 내용**:
- [ ] `functions/scheduled.ts` 생성
  ```typescript
  export const onRequest: PagesFunction = async (context) => {
    // 일일 문제 세트 생성 API 호출
    const response = await fetch('https://your-domain.pages.dev/api/daily-set');
    return new Response('OK');
  };
  ```
- [ ] `wrangler.toml`에 Cron Triggers 추가
  ```toml
  [triggers]
  crons = ["0 0 * * *"]  # 매일 자정 KST 기준
  ```

#### Vercel 사용 시:

**작업 내용**:
- [ ] Vercel Cron Jobs 설정
- [ ] `vercel.json` 생성
  ```json
  {
    "crons": [{
      "path": "/api/daily-set",
      "schedule": "0 0 * * *"
    }]
  }
  ```

**예상 시간**: 30분

---

## 🟡 권장 작업 (배포 후)

### 5. 에러 처리 개선
- [ ] 로딩 상태 개선 (스켈레톤 UI)
- [ ] 에러 메시지 사용자 친화적으로 변경
- [ ] Toast 알림 추가 (점수 제출 성공 등)
- [ ] 네트워크 에러 재시도 로직

**예상 시간**: 2-3시간

---

### 6. 사용자 경험 개선
- [ ] 프로그레스 바 애니메이션 개선
- [ ] 정답/오답 효과음 추가 (선택적)
- [ ] 문제 북마크 기능
- [ ] 문제 난이도 표시
- [ ] 개인 통계 대시보드
  - 총 푼 문제 수
  - 정답률
  - 강/약점 주제 분석

**예상 시간**: 4-6시간

---

### 7. 관리자 대시보드
- [ ] 관리자 인증 (간단한 비밀번호)
- [ ] 문제 관리 페이지
  - 문제 목록 조회
  - 문제 수정/삭제
  - 문제 통계 (정답률, 시도 횟수)
- [ ] 사용자 통계
  - 일일 활성 사용자
  - 전체 사용자 수
  - 가장 인기 있는 주제
- [ ] AI 재가공 실행 버튼 (웹에서 직접 실행)

**예상 시간**: 6-8시간

---

### 8. 분석 및 모니터링
- [ ] Google Analytics 또는 Plausible 설정
- [ ] Sentry 에러 트래킹 설정
- [ ] 사용자 행동 분석
  - 어떤 주제가 가장 인기?
  - 평균 정답률은?
  - 사용자 리텐션

**예상 시간**: 2-3시간

---

## 🟢 추가 기능 (선택적)

### 9. 소셜 기능
- [ ] 친구 추가 및 친구 간 순위 비교
- [ ] 문제 공유하기 (SNS)
- [ ] 댓글/토론 기능 (문제별)

**예상 시간**: 8-10시간

---

### 10. 더 많은 퀴즈 모드
- [ ] 타임 어택 모드 (제한 시간 내 최대한 많이)
- [ ] 서바이벌 모드 (틀리면 탈락)
- [ ] 주간 챌린지
- [ ] 주제별 레벨 시스템 (초급 → 중급 → 고급)

**예상 시간**: 6-8시간

---

### 11. 모바일 앱
- [ ] React Native로 모바일 앱 제작
- [ ] PWA 설정 (Progressive Web App)
  - manifest.json
  - service-worker.js
  - 오프라인 지원

**예상 시간**: 20-30시간

---

### 12. AI 문제 생성 고도화
- [ ] 사용자 맞춤형 문제 생성
  - 사용자 약점 분석
  - 약한 주제 집중 출제
- [ ] 실시간 문제 생성 (무한 문제)
- [ ] 사용자가 개념 입력하면 즉시 문제 생성

**예상 시간**: 8-10시간

---

### 13. 멀티플레이어
- [ ] 실시간 대결 모드
- [ ] WebSocket 연동
- [ ] 매치메이킹 시스템

**예상 시간**: 15-20시간

---

## 📋 우선순위 체크리스트

### 이번 주 (배포 전)
```
[ ] 1. 사용자 인증 UI 구현 (1-2h)
[ ] 2. AI로 문제 300개 생성 (4-6h)
[ ] 3. Cloudflare/Vercel 배포 (2-3h)
[ ] 4. Cron Job 설정 (30m)
[ ] 5. 배포 테스트 및 버그 수정 (2h)
```
**총 예상 시간**: 10-14시간

### 다음 주 (배포 후 개선)
```
[ ] 6. 에러 처리 개선 (2-3h)
[ ] 7. 사용자 경험 개선 - 기본 (2-3h)
[ ] 8. 분석 및 모니터링 설정 (2h)
```
**총 예상 시간**: 6-8시간

### 장기 계획
- 관리자 대시보드
- 추가 기능들
- 모바일 앱

---

## 💡 팁

### AI 문제 생성 효율화
개념 목록을 미리 작성해두면 배치로 실행 가능:

```typescript
// scripts/concepts.ts
export const concepts = {
  "computerSecurity": [
    "대칭키 암호화",
    "공개키 암호화",
    "해시 함수",
    "디지털 서명",
    // ... 20개
  ],
  "database": [
    "1차 정규화",
    "2차 정규화",
    "ACID 속성",
    // ... 20개
  ],
  // ...
};
```

### 배포 자동화
GitHub Actions로 자동 배포 설정:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: cs-quiz
```

---

## 🎯 1주일 내 MVP 배포 목표

```
Day 1-2: 사용자 인증 UI + 문제 생성 (50% 완료)
Day 3-4: 나머지 문제 생성 + 품질 검증
Day 5: 배포 (Vercel 추천 - 더 빠름)
Day 6: 버그 수정 + 에러 처리
Day 7: 분석 설정 + 홍보 자료 준비
```

성공적인 배포를 응원합니다! 🚀
