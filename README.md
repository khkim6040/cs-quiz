# CS Quiz

내가 풀려고 만든 CS 퀴즈 웹 앱

## 동작 방식

- **오늘의 퀴즈** — 매일 10문제가 전체 사용자에게 동일하게 출제됩니다. 점수는 리더보드에 등록됩니다.
- **주제별 퀴즈** — 9개 CS 주제(알고리즘, DB, OS, 네트워크 등) 중 골라서 풀 수 있습니다.
- **랜덤 퀴즈** — 전체 주제에서 무작위로 출제됩니다.
- **주간 챌린지** — 매주 하나의 주제가 지정되고, 해당 주제 리더보드가 별도로 집계됩니다.
- **오답 노트** — 틀린 문제는 Leitner 박스 기반 간격 반복 시스템으로 복습 시점이 자동으로 계산됩니다.
- **스트릭 / 통계** — 연속 학습일수와 정답률 등 통계를 확인할 수 있습니다.
- **결과 공유** — 퀴즈 결과를 카카오톡 등으로 공유할 수 있습니다.
- 문제마다 힌트, 해설, 개념 태그를 제공합니다. 오류 신고도 가능합니다.

## 기술 스택

- Next.js 14 (App Router) + React 18 + TailwindCSS
- Prisma + PostgreSQL (Neon)
- Vercel 배포
- GitHub Actions — 매일 다음 날짜의 데일리 퀴즈 세트를 자동 생성 (`.github/workflows/generate-daily.yml`)
- Vitest (테스트)

## 설정 및 실행

```bash
git clone https://github.com/khkim6040/cs-quiz.git
cd cs-quiz
npm install
```

`.env` 파일을 생성합니다:

```
DATABASE_URL="postgresql://username:password@localhost:5432/cs_quiz"
```

DB를 초기화한 후 실행합니다:

```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

http://localhost:3000 에 접속하세요.

## 배포

Vercel + Neon 조합을 사용합니다. 자세한 내용은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요.

## 라이선스

MIT
