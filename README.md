# CS Quiz

내가 풀려고 만든 AI로 재가공한 CS 문제를 풀 수 있는 웹 앱. 한국어/영어 지원.

## 동작 방식

- **오늘의 퀴즈** — 매일 15문제가 전체 사용자에게 동일하게 출제됨. 점수는 리더보드에 등록
- **주제별 퀴즈** — 9개 CS 주제(알고리즘, DB, OS, 네트워크 등) 중 골라서 풀기
- **랜덤 퀴즈** — 전체 주제에서 무작위 출제
- 문제마다 힌트, 해설, 개념 태그 제공. 오류 신고 가능

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

`.env` 파일 생성:

```
DATABASE_URL="postgresql://username:password@localhost:5432/cs_quiz"
```

DB 초기화 후 실행:

```bash
npx prisma migrate dev
npx prisma db seed
npm run dev
```

http://localhost:3000 접속.

## 배포

Vercel + Neon 조합을 사용한다. 자세한 내용은 [DEPLOYMENT.md](DEPLOYMENT.md) 참고.

## 라이선스

MIT
