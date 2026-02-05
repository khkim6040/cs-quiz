# CS Quiz 서비스 구현 계획

## 1. 현재 상태 분석

### 기존 구조
- **프레임워크**: Next.js 14 (App Router)
- **데이터베이스**: SQLite with Prisma ORM
- **스타일링**: Tailwind CSS
- **언어**: TypeScript

### 현재 기능
- ✅ 주제별 퀴즈 표시 (컴퓨터 보안, 데이터베이스, 알고리즘, 자료구조)
- ✅ 랜덤 퀴즈 기능
- ✅ 다국어 지원 (한국어/영어)
- ✅ 문제 표시 및 정답 확인
- ✅ Seed 데이터 (4개 주제, 각 주제별 문제)

### 현재 데이터 모델
```prisma
Topic {
  id, name_ko, name_en
  questions: Question[]
}

Question {
  id, topicId, text_ko, text_en, hint_ko, hint_en
  answerOptions: AnswerOption[]
}

AnswerOption {
  id, questionId, text_ko, text_en, rationale_ko, rationale_en, isCorrect
}
```

## 2. 필요한 개선사항

### 문제 1: 문제 소스 웹사이트 확보 ✅
**조사 완료**: 15개 신뢰할 수 있는 CS 교육 자료 소스 확인
- MIT OpenCourseWare (Creative Commons BY-NC-SA)
- Stanford Online
- Khan Academy (Creative Commons BY-NC-SA)
- Open Data Structures (Creative Commons BY)
- Project Euler (Creative Commons BY-NC-SA)
- 기타 10개 소스

**권장 접근법**:
1. Creative Commons 라이선스 자료 우선 활용
2. 교육적 개념 추출 후 AI로 완전 재가공
3. 문제 형식, 시나리오, 구현 세부사항 전면 변경

### 문제 2: AI 재가공 전략 🔄
**진행 중**: AI 재가공 프롬프트 템플릿 개발 중

**핵심 전략**:
- 원본 문제를 직접 사용하지 않고, 교육적 "개념"만 추출
- 완전히 새로운 시나리오와 컨텍스트 생성
- Transformative work로 fair use 범위 내 활용
- 2단계 검증: 독창성 검증 + 교육적 품질 검증

**LLM API 비교** (비용 및 품질):
| API | 비용 (1M 토큰 입력) | 비용 (1M 토큰 출력) | 품질 | 추천도 |
|-----|-------------------|-------------------|------|--------|
| GPT-4 Turbo | $10 | $30 | 최고 | ⭐⭐⭐⭐⭐ |
| Claude 3.5 Sonnet | $3 | $15 | 최고 | ⭐⭐⭐⭐⭐ |
| GPT-3.5 Turbo | $0.50 | $1.50 | 좋음 | ⭐⭐⭐⭐ |
| Gemini 1.5 Pro | $1.25 | $5 | 좋음 | ⭐⭐⭐⭐ |

**추천**: Claude 3.5 Sonnet (가성비 + 품질 균형)

### 문제 3: 호스팅 플랫폼 ✅
**조사 완료**: 8개 플랫폼 상세 비교

**TOP 3 추천**:
1. **Render** (최우선 추천) - $14/월
   - Web Service + PostgreSQL 통합
   - Cron Jobs 네이티브 지원
   - 쉬운 설정 및 관리

2. **Cloudflare Pages + Workers + D1** - 무료~$5/월
   - 매우 관대한 무료 티어
   - Edge Network로 빠른 응답
   - D1 SQLite 데이터베이스 포함

3. **Railway** - $10-20/월
   - 풀스택 앱에 최적화
   - 훌륭한 개발자 경험

**현재 프로젝트 기준 추천**:
- **개발/테스트**: Cloudflare Pages (무료)
- **프로덕션**: Render ($14/월)

### 문제 4: 일일 문제 세트 제공 로직
**설계 필요사항**:

#### 4.1 데이터 모델 확장
```prisma
// 추가 필요 모델

model DailyQuestionSet {
  id          String   @id @default(cuid())
  date        DateTime @unique
  questionIds String   // JSON array of question IDs
  createdAt   DateTime @default(now())
}

model UserScore {
  id             String   @id @default(cuid())
  userId         String
  dailySetId     String
  topicId        String?  // null for random
  score          Int
  totalQuestions Int
  completedAt    DateTime

  dailySet       DailyQuestionSet @relation(fields: [dailySetId], references: [id])

  @@unique([userId, dailySetId, topicId])
}

model User {
  id        String   @id @default(cuid())
  username  String   @unique
  createdAt DateTime @default(now())
}
```

#### 4.2 일일 문제 세트 생성 로직
```typescript
// Cron Job (매일 자정 실행)
async function generateDailyQuestionSet() {
  const today = new Date().setHours(0, 0, 0, 0);

  // 각 주제별로 N개씩 문제 선택
  const questionsByTopic = await Promise.all(
    topics.map(topic =>
      prisma.question.findMany({
        where: { topicId: topic.id },
        orderBy: { /* 랜덤 또는 최근 미출제 */ },
        take: 5  // 주제당 5문제
      })
    )
  );

  // 일일 세트 저장
  await prisma.dailyQuestionSet.create({
    data: {
      date: new Date(today),
      questionIds: JSON.stringify(questionIds)
    }
  });
}
```

#### 4.3 세 가지 모드 구현
1. **분야별 퀴즈**: 특정 주제에서 랜덤 선택
2. **랜덤 퀴즈**: 모든 주제에서 랜덤 선택
3. **오늘의 퀴즈** (신규): 일일 고정 세트 (전체 사용자 동일)

### 문제 5: 일일 사용자 순위 시스템

#### 5.1 순위 계산 로직
```typescript
// 점수 계산 공식
const calculateScore = (
  correctAnswers: number,
  totalQuestions: number,
  timeSpent: number  // 초 단위
) => {
  const accuracy = correctAnswers / totalQuestions;
  const timeBonus = Math.max(0, 1000 - timeSpent);  // 빠를수록 보너스
  return Math.round(accuracy * 1000 + timeBonus * 0.1);
};
```

#### 5.2 리더보드 API
```typescript
// GET /api/leaderboard?dailySetId=xxx&topicId=yyy
async function getLeaderboard(dailySetId: string, topicId?: string) {
  return await prisma.userScore.findMany({
    where: {
      dailySetId,
      topicId: topicId || null
    },
    orderBy: { score: 'desc' },
    take: 100,
    include: {
      user: { select: { username: true } }
    }
  });
}
```

#### 5.3 UI 컴포넌트
- 퀴즈 완료 후 순위 표시
- 실시간 리더보드 페이지
- 개인 통계 대시보드

## 3. 구현 로드맵

### Phase 1: 데이터 모델 및 기반 구축 (1-2주)
- [ ] Prisma 스키마 확장 (User, DailyQuestionSet, UserScore)
- [ ] 마이그레이션 실행
- [ ] 사용자 인증 구현 (간단한 username 기반 또는 OAuth)
- [ ] 일일 문제 세트 생성 로직 구현

### Phase 2: AI 재가공 파이프라인 (2-3주)
- [ ] 문제 소스에서 개념 추출 스크립트
- [ ] AI 재가공 프롬프트 템플릿 완성
- [ ] Claude API 통합
- [ ] 품질 검증 시스템 구현
- [ ] 재가공 문제 데이터베이스 저장

### Phase 3: 일일 퀴즈 기능 (1주)
- [ ] "오늘의 퀴즈" 페이지 추가
- [ ] Cron Job 설정 (일일 문제 세트 생성)
- [ ] 일일 세트 API 구현
- [ ] UI 업데이트

### Phase 4: 순위 시스템 (1주)
- [ ] 점수 계산 로직 구현
- [ ] UserScore 저장 API
- [ ] 리더보드 API 구현
- [ ] 리더보드 UI 컴포넌트
- [ ] 개인 통계 페이지

### Phase 5: 배포 및 최적화 (1주)
- [ ] Render 또는 Cloudflare Pages 설정
- [ ] 환경 변수 설정 (DATABASE_URL, ANTHROPIC_API_KEY)
- [ ] 프로덕션 빌드 및 배포
- [ ] 성능 모니터링 설정
- [ ] 버그 수정 및 UX 개선

## 4. 즉시 시작 가능한 작업

### Option A: 데이터 모델 확장부터 시작
프로젝트의 기반을 먼저 다지는 접근

### Option B: AI 재가공 파이프라인 프로토타입
문제 생성 자동화부터 시작

### Option C: 일일 퀴즈 + 순위 시스템 MVP
기존 문제로 새 기능 먼저 구현

## 5. 다음 단계 질문

어느 방향으로 먼저 진행할까요?

1. **데이터 모델 확장 + 사용자 인증** (기반 구축)
2. **AI 재가공 파이프라인 구축** (콘텐츠 생성 자동화)
3. **일일 퀴즈 + 순위 시스템 구현** (핵심 기능 MVP)

또는 병렬로 진행하고 싶은 작업이 있으면 말씀해주세요!
