# CS Quiz 🧠

AI로 재가공한 양질의 Computer Science 문제로 실력을 키우세요!

## ✨ 주요 기능

- 📚 **9개 주제**: 컴퓨터 보안, 데이터베이스, 알고리즘, 자료구조, 컴퓨터 네트워킹, 운영체제, 컴퓨터 구조, 소프트웨어 공학, 스프링 부트
- 📅 **오늘의 퀴즈**: 매일 새로운 15문제 세트 (전체 사용자 공통)
- 🏆 **실시간 리더보드**: 점수와 순위 경쟁
- 🎲 **랜덤 퀴즈**: 주제별 또는 전체 주제 무작위 출제
- 🌐 **다국어 지원**: 한국어/영어 (실시간 전환)
- 💡 **힌트 시스템**: 문제별 힌트 제공
- 📝 **상세한 해설**: 모든 답안에 대한 해설 제공
- 🏷️ **개념 태깅**: 문제별 CS 개념 분류 및 홈페이지 쇼케이스
- 🚩 **문제 신고**: 오류 카테고리별 문제 리포트
- 💬 **피드백 기능**: 사용자 의견 수집
- 🔐 **간편 인증**: 사용자명 기반 로그인

## 🚀 빠른 시작

### 1. 설치

```bash
git clone https://github.com/khkim6040/cs-quiz.git
cd cs-quiz
npm install
```

### 2. 환경 변수 설정

`.env` 파일 생성:

```bash
# PostgreSQL 데이터베이스 URL
DATABASE_URL="postgresql://username:password@localhost:5432/cs_quiz"
```

### 3. 데이터베이스 설정

```bash
# Prisma 마이그레이션 실행
npx prisma migrate dev

# Seed 데이터 삽입 (주제, 개념, 샘플 문제 포함)
npx prisma db seed
```

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 접속

## 🔍 코드 품질 관리

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

## 📥 문제 관리

### 문제 import

AI 채팅으로 생성한 JSON 문제를 DB에 투입합니다.

```bash
# 1. JSON 파일을 scripts/ai-regenerate/generated/evaluated/pass/에 저장
# 2. 검증 (DB에 쓰지 않음)
npm run import-questions:dry

# 3. 실제 투입
npm run import-questions

# 특정 파일만 import
npm run import-questions -- --file algorithm-sorting.json
```

### 토픽 추가

```bash
npm run add-topic -- --id springBoot --name-ko "스프링 부트" --name-en "Spring Boot"
```

### 개념 자동 태깅

기존 문제에 CS 개념 태그를 자동 매칭합니다.

```bash
npm run auto-tag:dry   # 검증만
npm run auto-tag       # 실제 태깅
```

### 데일리 문제 세트 생성

한국 시간(KST) 기준으로 날짜별 문제 세트를 미리 생성합니다.

```bash
npm run generate-daily        # 내일 세트 생성
npm run generate-daily:week   # 7일분 생성
npm run generate-daily:month  # 30일분 생성
```

## 📁 프로젝트 구조

```
cs-quiz/
├── prisma/
│   ├── schema.prisma          # DB 스키마 (PostgreSQL)
│   ├── migrations/            # 마이그레이션 파일들
│   ├── seed.ts                # 초기 데이터 (주제, 개념, 문제)
│   └── seed-data/             # 문제 및 개념 데이터
│       ├── algorithm.ts
│       ├── computerSecurity.ts
│       ├── database.ts
│       ├── dataStructure.ts
│       └── concepts.ts        # 토픽별 개념 정의
├── scripts/
│   ├── tsconfig.scripts.json  # 스크립트 전용 tsconfig
│   ├── generate-daily-questions.ts  # 데일리 문제 세트 배치 생성
│   └── ai-regenerate/
│       ├── import.ts          # 문제 JSON → DB 투입
│       ├── add-topic.ts       # 새 토픽 추가
│       ├── auto-tag.ts        # 기존 문제 개념 자동 태깅
│       ├── concept-matcher.ts # 개념 매칭 로직
│       ├── prompts.ts         # AI 프롬프트 템플릿
│       ├── regenerate.ts      # AI 문제 재생성
│       └── generated/         # AI 생성 결과물
│           └── evaluated/
│               ├── pass/      # import 대상 JSON
│               ├── revise/
│               └── reject/
├── src/
│   ├── app/
│   │   ├── api/               # API 라우트
│   │   │   ├── auth/          # 인증 (로그인/로그아웃/me)
│   │   │   ├── concepts/      # 개념 쇼케이스 데이터
│   │   │   ├── daily-set/     # 일일 문제 세트 생성/조회
│   │   │   ├── daily-questions/  # 일일 퀴즈 조회
│   │   │   ├── feedback/      # 피드백 및 문제 신고
│   │   │   ├── leaderboard/   # 리더보드
│   │   │   │   └── today/     # 오늘의 리더보드
│   │   │   ├── questions/[topicId]/  # 주제별 문제 조회
│   │   │   ├── quiz-session/  # 퀴즈 세션 저장
│   │   │   ├── submit-score/  # 점수 제출
│   │   │   └── topics/        # 주제 목록
│   │   ├── daily/             # 오늘의 퀴즈 페이지
│   │   ├── leaderboard/       # 리더보드 페이지
│   │   ├── quiz/[topicId]/    # 주제별 퀴즈 페이지
│   │   ├── page.tsx           # 홈페이지
│   │   ├── layout.tsx         # 레이아웃 (헤더, 메뉴)
│   │   └── globals.css        # 전역 스타일
│   ├── components/
│   │   ├── ConceptShowcase.tsx     # 개념 쇼케이스 (무한 스크롤)
│   │   ├── FeedbackButton.tsx      # 피드백 버튼
│   │   ├── LanguageToggle.tsx      # 언어 전환 버튼
│   │   ├── LeaderboardAccordion.tsx  # 리더보드 아코디언
│   │   ├── LoginModal.tsx          # 로그인 모달
│   │   ├── QuestionComponent.tsx   # 문제 컴포넌트
│   │   ├── QuestionReportButton.tsx  # 문제 신고 버튼
│   │   └── UserMenu.tsx            # 사용자 메뉴
│   ├── contexts/
│   │   ├── AuthContext.tsx    # 인증 컨텍스트
│   │   └── LanguageContext.tsx  # 언어 컨텍스트
│   ├── lib/
│   │   ├── localStorage.ts    # 로컬 스토리지 유틸
│   │   ├── prisma.ts          # Prisma 클라이언트 (싱글톤)
│   │   ├── timezone.ts        # 타임존 유틸 (KST)
│   │   └── translations/      # 다국어 번역
│   │       ├── ko.ts          # 한국어
│   │       ├── en.ts          # 영어
│   │       └── index.ts       # 번역 헬퍼
│   └── types/
│       └── quizTypes.ts       # 타입 정의
├── CLAUDE.md                  # Claude Code 가이드
├── DEPLOYMENT.md              # 배포 가이드
├── LINT_GUIDE.md              # 린트 가이드
└── README.md
```

## 🎯 사용 방법

### 일반 사용자

1. **홈페이지**에서 원하는 모드 선택:
   - 📅 **오늘의 퀴즈**: 매일 새로운 15문제 (일일 도전)
   - 🎲 **랜덤 퀴즈**: 전체 주제 무작위 출제
   - 📚 **주제별 퀴즈**: 주제 선택 후 풀기

2. **퀴즈 풀기**:
   - 문제 읽기 (마크다운 지원)
   - 💡 힌트 보기 (선택, 통계와 같은 줄에 표시)
   - 답안 선택
   - 해설 확인 (정답/오답 모두 제공)
   - 🚩 문제 오류 신고 (카테고리 선택)
   - 다음 문제로

3. **통계 확인**:
   - 맞은 문제 / 푼 문제 실시간 표시
   - 퀴즈 완료 후 세션 저장

4. **리더보드**:
   - 오늘의 퀴즈 완료 후 자동 표시
   - 점수 등록 및 순위 확인
   - 주제별 / 일일 리더보드

5. **언어 전환**:
   - 상단 메뉴에서 한국어/영어 전환
   - 실시간 반영 (새로고침 불필요)

## 🧩 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인 (username)
- `GET /api/auth/me` - 현재 사용자 조회
- `POST /api/auth/logout` - 로그아웃

### 퀴즈
- `GET /api/topics?lang={ko|en}` - 주제 목록
- `GET /api/questions/:topicId?count={number}` - 주제별 랜덤 문제 (topicId=`random`으로 전체 랜덤)
- `GET /api/daily-questions?lang={ko|en}` - 오늘의 퀴즈
- `GET /api/daily-set` - 오늘의 문제 세트 조회/생성

### 개념
- `GET /api/concepts?lang={ko|en}&offset={n}&limit={n}` - 토픽별 개념 목록 (페이지네이션)

### 점수 & 순위
- `POST /api/submit-score` - 점수 제출
- `GET /api/leaderboard?dailySetId={id}&topicId={id}&limit={number}` - 리더보드 조회
- `GET /api/leaderboard/today?limit={number}` - 오늘의 리더보드

### 세션 & 피드백
- `POST /api/quiz-session` - 퀴즈 세션 저장
- `POST /api/feedback` - 피드백 및 문제 신고 제출

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **UI**: React Markdown, Tailwind Typography
- **상태 관리**: React Context API
- **인증**: 쿠키 + localStorage 기반
- **배포**: Vercel

## 🗄️ 데이터베이스 스키마

### 주요 모델

- **Topic**: 퀴즈 주제 (9개)
- **Concept**: CS 개념 (토픽별, Question과 M:N 관계)
- **Question**: 문제 (한/영 지원, 개념 태깅)
- **AnswerOption**: 답안 선택지 (해설 포함)
- **User**: 사용자
- **DailyQuestionSet**: 일일 문제 세트 (토픽당 최대 3문제, 날짜 기반 시드 셔플)
- **UserScore**: 사용자 점수 (리더보드용)
- **QuizSession**: 퀴즈 세션 (통계용)
- **Feedback**: 사용자 피드백 및 문제 신고 (카테고리별)

## 📦 배포

상세한 배포 가이드는 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요.

### Vercel + Neon (권장)

1. **Neon에서 PostgreSQL 데이터베이스 생성**
   - https://neon.tech 에서 무료 계정 생성
   - 새 프로젝트 생성 후 연결 문자열 복사

2. **GitHub에 푸시**
   ```bash
   git push origin main
   ```

3. **Vercel에서 프로젝트 연동**
   - https://vercel.com 에서 Import Project
   - GitHub 저장소 선택
   - 환경 변수 설정:
     ```
     DATABASE_URL="postgresql://..."
     ```

4. **초기 데이터 설정**
   ```bash
   # 로컬에서 프로덕션 DB에 마이그레이션 실행
   npx prisma migrate deploy

   # 시드 데이터 삽입
   npx prisma db seed
   ```

5. **Deploy!**

### 환경 변수 (프로덕션)

```bash
DATABASE_URL="postgresql://..."  # Neon PostgreSQL 연결 문자열
```

## 🎨 주요 기능 상세

### 다국어 지원
- Context API 기반 언어 전환
- 실시간 UI 업데이트
- localStorage 저장으로 설정 유지

### 힌트 시스템
- 문제당 1개 힌트 제공
- 답변 전에만 확인 가능
- 통계 버튼과 같은 줄에 표시되어 공간 효율적

### 해설 아코디언
- 모든 답안에 대한 상세 해설
- 정답은 자동 펼침
- 오답도 클릭하여 확인 가능

### 개념 쇼케이스
- 홈페이지 하단에서 토픽별 CS 개념 태그 표시
- Intersection Observer 기반 무한 스크롤
- 토픽별 3개씩 배치 로딩

### 문제 신고
- 6개 카테고리: 오답, 문제 오류, 선지 오류, 해설 오류, 번역 오류, 기타
- 문제 풀이 중 바로 신고 가능
- Feedback 모델에 카테고리 태깅하여 저장

### 리더보드
- 일일 퀴즈 전용
- 점수 = (정답 수 × 100) - (소요 시간(초) / 10)
- 실시간 순위 업데이트
- 주제별 필터링

## 🤝 기여

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: 멋진 기능 추가'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 커밋 컨벤션

- `feat:` 새로운 기능
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 포맷팅
- `refactor:` 코드 리팩토링
- `test:` 테스트 추가
- `chore:` 빌드/설정 변경

## 📄 라이선스

MIT License

## 🙏 감사의 말

이 프로젝트는 다음 오픈소스 교육 자료들로부터 영감을 받았습니다:
- MIT OpenCourseWare
- Khan Academy
- Open Data Structures

모든 문제는 교육 목적으로 작성되었으며, 원본 자료의 저작권을 존중합니다.

## 📞 문의

문제나 제안사항이 있으시면 [Issues](https://github.com/khkim6040/cs-quiz/issues)에 남겨주세요!

---

Made with ❤️ by CS Quiz Team
