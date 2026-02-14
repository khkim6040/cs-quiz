# CS Quiz 🧠

AI로 재가공한 양질의 Computer Science 문제로 실력을 키우세요!

## ✨ 주요 기능

- 📚 **4개 주제**: 컴퓨터 보안, 데이터베이스, 알고리즘, 자료구조
- 📅 **오늘의 퀴즈**: 매일 새로운 문제 세트 (전체 사용자 공통)
- 🏆 **실시간 리더보드**: 점수와 순위 경쟁
- 🎲 **랜덤 퀴즈**: 모든 주제에서 무작위 출제
- 🌐 **다국어 지원**: 한국어/영어
- 🤖 **AI 재가공**: Claude를 활용한 독창적인 문제 생성

## 🚀 빠른 시작

### 1. 설치

```bash
git clone https://github.com/yourusername/cs-quiz.git
cd cs-quiz
npm install
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
DATABASE_URL="file:./dev.db"
ANTHROPIC_API_KEY="your-claude-api-key-here"
```

### 3. 데이터베이스 설정

```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev

# Seed 데이터 삽입
npx prisma db seed
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속

## 🔍 코드 품질 관리

### 린트 실행
```bash
# 기본 린트 검사
npm run lint

# 자동 수정
npm run lint:fix

# TypeScript 타입 체크
npm run type-check

# 모두 실행 (커밋 전 권장)
npm run check
```

자세한 내용은 [LINT_GUIDE.md](LINT_GUIDE.md)를 참고하세요.

## 📁 프로젝트 구조

```
cs-quiz/
├── prisma/
│   ├── schema.prisma          # DB 스키마
│   ├── migrations/            # 마이그레이션 파일들
│   ├── seed.ts                # 초기 데이터
│   └── seed-data/             # 문제 데이터
├── scripts/
│   └── ai-regenerate/         # AI 재가공 스크립트
│       ├── prompts.ts         # 프롬프트 템플릿
│       └── regenerate.ts      # 메인 로직
├── src/
│   ├── app/
│   │   ├── api/               # API 라우트
│   │   │   ├── auth/          # 인증 (로그인/로그아웃)
│   │   │   ├── daily-set/     # 일일 문제 세트 생성
│   │   │   ├── daily-questions/  # 일일 퀴즈 조회
│   │   │   ├── leaderboard/   # 리더보드
│   │   │   ├── submit-score/  # 점수 제출
│   │   │   ├── topics/        # 주제 목록
│   │   │   └── questions/     # 문제 조회
│   │   ├── daily/             # 오늘의 퀴즈 페이지
│   │   ├── leaderboard/       # 리더보드 페이지
│   │   ├── quiz/              # 주제별 퀴즈 페이지
│   │   ├── page.tsx           # 홈페이지
│   │   └── layout.tsx
│   ├── components/
│   │   └── QuestionComponent.tsx  # 문제 컴포넌트
│   ├── lib/
│   │   └── prisma.ts          # Prisma 클라이언트
│   └── types/
│       └── quizTypes.ts       # 타입 정의
├── DEPLOYMENT.md              # 배포 가이드
├── IMPLEMENTATION_PLAN.md     # 구현 계획
└── README.md
```

## 🎯 사용 방법

### 일반 사용자

1. **홈페이지**에서 원하는 모드 선택:
   - 📅 오늘의 퀴즈 (일일 도전)
   - 주제별 퀴즈 (컴퓨터 보안, 데이터베이스 등)
   - 🎲 랜덤 퀴즈

2. **퀴즈 풀기**:
   - 문제 읽기
   - 💡 힌트 보기 (선택)
   - 답안 선택
   - 해설 확인
   - 다음 문제로

3. **리더보드 확인**:
   - 오늘의 퀴즈 완료 후 자동 표시
   - 또는 직접 리더보드 페이지 방문

### AI 문제 재가공 (관리자)

새로운 문제를 AI로 생성:

```bash
# Anthropic API 키 필요
npm run regenerate
```

프롬프트는 `scripts/ai-regenerate/prompts.ts`에서 커스터마이즈 가능합니다.

## 🧩 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인 (username)
- `GET /api/auth/me` - 현재 사용자
- `POST /api/auth/logout` - 로그아웃

### 퀴즈
- `GET /api/topics` - 주제 목록
- `GET /api/questions/:topicId` - 주제별 랜덤 문제
- `GET /api/daily-questions` - 오늘의 퀴즈
- `GET /api/daily-set` - 오늘의 문제 세트 조회/생성

### 점수 & 순위
- `POST /api/submit-score` - 점수 제출
- `GET /api/leaderboard?dailySetId=xxx` - 리더보드 조회

## 🛠 기술 스택

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (개발), Cloudflare D1 (프로덕션)
- **ORM**: Prisma
- **AI**: Anthropic Claude API
- **Hosting**: Cloudflare Pages (무료)

## 📦 배포

상세한 배포 가이드는 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요.

### Cloudflare Pages (무료)

```bash
# 1. D1 데이터베이스 생성
wrangler d1 create cs-quiz-db

# 2. 마이그레이션 실행
wrangler d1 execute cs-quiz-db --file=./prisma/migrations/*/migration.sql

# 3. GitHub 푸시
git push origin main

# 4. Cloudflare Pages에서 GitHub 연동
```

### Vercel (더 쉬운 대안)

1. Vercel에서 Import Project
2. 환경 변수 설정
3. Deploy!

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: 멋진 기능 추가'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

MIT License

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 교육 자료들로부터 영감을 받았습니다:
- MIT OpenCourseWare
- Khan Academy
- Open Data Structures
- Project Euler

모든 문제는 AI를 통해 재가공되었으며, 원본 자료의 저작권을 존중합니다.

## 📞 문의

문제나 제안사항이 있으시면 [Issues](https://github.com/yourusername/cs-quiz/issues)에 남겨주세요!

---

Made with ❤️ by CS Quiz Team
