# Difficulty System Design

**Issue**: #22 — feat: 문제 난이도 시스템 도입 (Easy / Medium / Hard)
**Date**: 2026-03-22

## Goal

모든 문제에 난이도(EASY / MEDIUM / HARD)를 부여하고, 문제 풀이 시 난이도 뱃지를 표시한다.

## Scope

### In scope
- DB 스키마에 `difficulty` enum 필드 추가
- API 응답에 `difficulty` 포함
- 문제 카드에 난이도 뱃지 UI
- 임포트 파이프라인에서 `difficulty` 저장
- 기존 문제 난이도 일괄 태깅 (Claude Code 일회성 스킬)

### Out of scope
- 난이도 필터링 UI/API
- 일일 퀴즈 난이도 분포 로직
- 난이도별 가중 점수

## Design

### 1. Schema

Prisma enum을 사용한다. 기존 문제는 마이그레이션 시 `MEDIUM` 기본값이 부여된다.

```prisma
enum Difficulty {
  EASY
  MEDIUM
  HARD
}

model Question {
  // ... existing fields
  difficulty Difficulty @default(MEDIUM)
}
```

### 2. Types

`src/types/quizTypes.ts`의 `QuestionData` 인터페이스에 `difficulty` 추가:

```ts
export interface QuestionData {
  // ... existing fields
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}
```

### 3. API Changes

**`GET /api/questions/[topicId]`** — `formatQuestion()`에서 `difficulty` 필드를 응답에 포함:

```ts
return {
  // ... existing fields
  difficulty: q.difficulty,
};
```

**`GET /api/daily-questions`** — `formattedQuestions`에 동일하게 `difficulty` 포함:

```ts
return {
  // ... existing fields
  difficulty: question.difficulty,
};
```

### 4. Import Pipeline

**`scripts/ai-regenerate/import.ts`**:
- `GeneratedQuestion.difficulty`를 `string` (required)으로 변경
- `importQuestion()`에서 소문자 → enum 변환 후 DB 저장:

```ts
import { Difficulty } from '@prisma/client';

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  easy: 'EASY',
  medium: 'MEDIUM',
  hard: 'HARD',
};

// prisma.question.create data에 추가:
difficulty: DIFFICULTY_MAP[q.difficulty] ?? 'MEDIUM',
```

validate.ts의 검증 로직은 이미 `difficulty` 필수 검증을 하고 있으므로 변경 불필요. 단, `import.ts`의 `GeneratedQuestion` 인터페이스에서 `difficulty?: string` → `difficulty: string`으로 required화한다.

### 5. Frontend Badge

`QuestionComponent.tsx`에서 문제 텍스트 위에 pill 형태 뱃지 표시:

| Difficulty | Color | 한국어 | English |
|---|---|---|---|
| EASY | 초록 (`green-100`/`green-700`) | 쉬움 | Easy |
| MEDIUM | 주황 (`orange-100`/`orange-700`) | 보통 | Medium |
| HARD | 빨강 (`red-100`/`red-700`) | 어려움 | Hard |

스타일: `px-2 py-0.5 text-xs font-medium rounded-full`

다크모드 대응: `dark:bg-green-900/30 dark:text-green-400` 등.

번역 키 추가 (기존 bilingual 패턴 준수). `Translations` 타입이 2레벨까지만 허용하므로 플랫 키 사용:
```ts
// ko.ts — quiz 하위:
difficultyEasy: '쉬움',
difficultyMedium: '보통',
difficultyHard: '어려움',

// en.ts — quiz 하위:
difficultyEasy: 'Easy',
difficultyMedium: 'Medium',
difficultyHard: 'Hard',
```

뱃지 텍스트는 `t('quiz.difficultyEasy')` 형태로 렌더링한다.

### 6. Existing Question Tagging

Claude Code 일회성 스킬로 처리:
1. Prisma를 통해 DB에서 문제 목록 조회
2. 문제 텍스트 + 선택지 + 해설을 Claude Code가 분석하여 난이도 판단
3. `prisma.question.update()`로 DB 업데이트

Claude API(ANTHROPIC_API_KEY) 과금 없이 Claude Code 대화 내에서 직접 수행.

## Notes

- `QuestionData.difficulty`는 required 필드다. DB 스키마의 `@default(MEDIUM)` 덕분에 모든 문제가 항상 `difficulty` 값을 가지므로, API 응답에서 누락될 일이 없다.
- 마이그레이션: `npx prisma migrate dev`로 로컬 적용 후, 프로덕션(Neon)에는 `npx prisma migrate deploy`로 적용. `@default(MEDIUM)` 덕분에 무중단 컬럼 추가.

## File Changes

| File | Change |
|---|---|
| `prisma/schema.prisma` | `Difficulty` enum 추가, `Question.difficulty` 필드 추가 |
| `src/types/quizTypes.ts` | `QuestionData`에 `difficulty` 추가 |
| `src/app/api/questions/[topicId]/route.ts` | 응답에 `difficulty` 포함 |
| `src/app/api/daily-questions/route.ts` | 응답에 `difficulty` 포함 |
| `src/app/daily/page.tsx` | 로컬 `Question` 인터페이스에 `difficulty` 추가, `QuestionComponent`에 전달 |
| `scripts/ai-regenerate/import.ts` | `difficulty` DB 저장, `GeneratedQuestion.difficulty` required화, `Difficulty` enum import |
| `src/components/QuestionComponent.tsx` | 난이도 뱃지 UI 추가 |
| `src/lib/translations/ko.ts` | `quiz.difficulty` 번역 키 추가 |
| `src/lib/translations/en.ts` | `quiz.difficulty` 번역 키 추가 |
