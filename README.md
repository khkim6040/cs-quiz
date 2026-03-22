# CS Quiz

내가 풀려고 만든 AI로 재가공한 CS 문제를 풀 수 있는 웹 앱

## 동작 방식

- **오늘의 퀴즈** — 매일 15문제가 전체 사용자에게 동일하게 출제됩니다. 점수는 리더보드에 등록됩니다.
- **주제별 퀴즈** — 9개 CS 주제(알고리즘, DB, OS, 네트워크 등) 중 골라서 풀 수 있습니다.
- **랜덤 퀴즈** — 전체 주제에서 무작위로 출제됩니다.
- 문제마다 힌트, 해설, 개념 태그를 제공합니다. 오류 신고도 가능합니다.

## 기술 스택

- Next.js 14 (App Router) + React 18 + TailwindCSS
- Prisma + PostgreSQL (Neon)
- Vercel 배포
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
