# CS Quiz Generator Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/generate-quiz <topicId>` 스킬을 구현하여 CS 퀴즈 문제의 생성-평가-임포트 파이프라인을 자동화한다.

**Architecture:** 선행 리팩토링(validate.ts 추출) → 레퍼런스 데이터 생성 → 스킬 프롬프트(coordinator) 작성 → 에이전트별 프롬프트 작성. 스킬은 Claude Code custom command(`.claude/commands/generate-quiz.md`)로 구현되며, 내부에서 executor/analyst 에이전트를 dispatch하여 파이프라인을 순차 실행한다.

**Tech Stack:** TypeScript, Prisma, Claude Code custom commands, Agent subagent dispatch

**Spec:** `docs/superpowers/specs/2026-03-21-generate-quiz-skill-design.md`

---

## File Structure

| 파일 | 역할 | 작업 |
|---|---|---|
| `scripts/ai-regenerate/validate.ts` | 구조+시맨틱 검증 유틸 | Create |
| `scripts/ai-regenerate/import.ts` | 기존 import 스크립트 | Modify (validate 함수 import로 교체) |
| `scripts/ai-regenerate/references.json` | 토픽별 실러버스 데이터 | Create |
| `.claude/commands/generate-quiz.md` | 스킬 진입점 (Coordinator) | Create |
| `scripts/ai-regenerate/agent-prompts/skill-gap-analyzer.md` | Gap Analyzer 프롬프트 | Create |
| `scripts/ai-regenerate/agent-prompts/skill-concept-generator.md` | Concept Map Generator 프롬프트 | Create |
| `scripts/ai-regenerate/agent-prompts/skill-question-generator.md` | Question Generator 프롬프트 | Create |
| `scripts/ai-regenerate/agent-prompts/skill-evaluator.md` | Evaluator 프롬프트 | Create |

---

### Task 1: validateQuestion() 추출 및 리팩토링

**Files:**
- Create: `scripts/ai-regenerate/validate.ts`
- Modify: `scripts/ai-regenerate/import.ts:123-186`
- Test: `scripts/ai-regenerate/__tests__/validate.test.ts`

- [ ] **Step 1: Write failing tests for validateQuestion**

```typescript
// scripts/ai-regenerate/__tests__/validate.test.ts
import { describe, it, expect } from "vitest";
import { validateQuestion } from "../validate";

describe("validateQuestion", () => {
  const validQuestion = {
    question_ko: "테스트 질문입니다.",
    question_en: "This is a test question.",
    hint_ko: "힌트입니다.",
    hint_en: "This is a hint.",
    topic: "algorithm",
    difficulty: "easy",
    concept: "Sorting",
    questionType: "conceptual",
    answerOptions: [
      {
        text_ko: "정답",
        text_en: "Correct answer",
        rationale_ko: "이것이 정답인 이유는 다음과 같습니다. 정렬 알고리즘의 기본 원리에 따라...",
        rationale_en: "This is correct because of the fundamental principle of sorting algorithms...",
        isCorrect: true,
      },
      {
        text_ko: "오답",
        text_en: "Wrong answer",
        rationale_ko: "이것은 틀린 이유는 다음과 같습니다. 해당 주장은 실제 동작과 다르기 때문에...",
        rationale_en: "This is incorrect because the claim does not match the actual behavior...",
        isCorrect: false,
      },
    ],
  };

  it("returns valid for a correct question", () => {
    const result = validateQuestion(validQuestion);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects missing required fields", () => {
    const q = { ...validQuestion, question_ko: "" };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "question_ko")).toBe(true);
  });

  it("detects invalid topic ID", () => {
    const q = { ...validQuestion, topic: "invalidTopic" };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "topic")).toBe(true);
  });

  it("detects multiple correct answers", () => {
    const q = {
      ...validQuestion,
      answerOptions: validQuestion.answerOptions.map((o) => ({
        ...o,
        isCorrect: true,
      })),
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "answerOptions")).toBe(true);
  });

  it("detects no correct answer", () => {
    const q = {
      ...validQuestion,
      answerOptions: validQuestion.answerOptions.map((o) => ({
        ...o,
        isCorrect: false,
      })),
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
  });

  it("detects missing answer option fields", () => {
    const q = {
      ...validQuestion,
      answerOptions: [
        { text_ko: "답", isCorrect: true },
        { text_ko: "답2", isCorrect: false },
      ],
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.field.startsWith("answerOptions["))
    ).toBe(true);
  });

  it("detects invalid difficulty value", () => {
    const q = { ...validQuestion, difficulty: "extreme" };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "difficulty")).toBe(true);
  });

  it("detects short rationale (semantic check)", () => {
    const q = {
      ...validQuestion,
      answerOptions: [
        {
          ...validQuestion.answerOptions[0],
          rationale_ko: "짧음",
          rationale_en: "short",
        },
        validQuestion.answerOptions[1],
      ],
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.field === "answerOptions[0].rationale_ko")
    ).toBe(true);
  });

  it("detects hint_en containing correct answer text", () => {
    const correctText = validQuestion.answerOptions.find(
      (o) => o.isCorrect
    )!.text_en;
    const q = { ...validQuestion, hint_en: `The answer is ${correctText}` };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "hint_en")).toBe(true);
  });

  it("detects hint_ko containing correct answer text", () => {
    const correctText = validQuestion.answerOptions.find(
      (o) => o.isCorrect
    )!.text_ko;
    const q = { ...validQuestion, hint_ko: `정답은 ${correctText}입니다` };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "hint_ko")).toBe(true);
  });

  it("detects concept keyword missing from question_en", () => {
    const q = {
      ...validQuestion,
      concept: "QuickSort",
      question_en: "What is the time complexity of this algorithm?",
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "question_en")).toBe(true);
  });

  it("passes when concept keyword is present in question_en", () => {
    const q = {
      ...validQuestion,
      concept: "Sorting",
      question_en: "Which sorting algorithm has O(n log n) worst case?",
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(true);
  });

  it("detects trivial distractor (short rationale on incorrect option)", () => {
    const q = {
      ...validQuestion,
      answerOptions: [
        validQuestion.answerOptions[0],
        {
          ...validQuestion.answerOptions[1],
          rationale_ko: "틀림",
          rationale_en: "wrong",
        },
      ],
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) =>
          e.field === "answerOptions[1].rationale_ko" ||
          e.field === "answerOptions[1].rationale_en"
      )
    ).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run scripts/ai-regenerate/__tests__/validate.test.ts`
Expected: FAIL — `validateQuestion` not found

- [ ] **Step 3: Implement validate.ts**

```typescript
// scripts/ai-regenerate/validate.ts

export const VALID_TOPIC_IDS = [
  "computerSecurity",
  "database",
  "algorithm",
  "dataStructure",
  "computerNetworking",
  "operatingSystem",
  "computerArchitecture",
  "softwareEngineering",
  "springBoot",
];

const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

const MIN_RATIONALE_LENGTH = 30;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function validateQuestion(q: any): ValidationResult {
  const errors: ValidationError[] = [];

  // ── Structural validation ──

  // Required string fields
  const requiredFields = [
    "question_ko",
    "question_en",
    "hint_ko",
    "hint_en",
    "topic",
  ];
  for (const field of requiredFields) {
    if (!q[field] || typeof q[field] !== "string" || q[field].trim() === "") {
      errors.push({ field, message: `Missing or empty field: ${field}` });
    }
  }

  // Topic ID validation
  if (q.topic && !VALID_TOPIC_IDS.includes(q.topic)) {
    errors.push({
      field: "topic",
      message: `Invalid topic "${q.topic}". Must be one of: ${VALID_TOPIC_IDS.join(", ")}`,
    });
  }

  // Difficulty validation
  if (q.difficulty && !VALID_DIFFICULTIES.includes(q.difficulty)) {
    errors.push({
      field: "difficulty",
      message: `Invalid difficulty "${q.difficulty}". Must be one of: ${VALID_DIFFICULTIES.join(", ")}`,
    });
  }

  // Answer options: must be array
  if (!Array.isArray(q.answerOptions)) {
    errors.push({
      field: "answerOptions",
      message: "answerOptions must be an array",
    });
    return { valid: false, errors };
  }

  // Answer options: minimum count
  if (q.answerOptions.length < 2) {
    errors.push({
      field: "answerOptions",
      message: `Need at least 2 answer options, got ${q.answerOptions.length}`,
    });
  }

  // Answer options: exactly 1 correct
  const correctCount = q.answerOptions.filter(
    (o: any) => o.isCorrect === true
  ).length;
  if (correctCount === 0) {
    errors.push({
      field: "answerOptions",
      message: "No correct answer marked (isCorrect: true)",
    });
  }
  if (correctCount > 1) {
    errors.push({
      field: "answerOptions",
      message: `Multiple correct answers marked (${correctCount})`,
    });
  }

  // Validate each answer option
  const optFields = ["text_ko", "text_en", "rationale_ko", "rationale_en"];
  for (let i = 0; i < q.answerOptions.length; i++) {
    const opt = q.answerOptions[i];
    for (const field of optFields) {
      if (
        !opt[field] ||
        typeof opt[field] !== "string" ||
        opt[field].trim() === ""
      ) {
        errors.push({
          field: `answerOptions[${i}].${field}`,
          message: `${field} is missing or empty`,
        });
      }
    }
    if (typeof opt.isCorrect !== "boolean") {
      errors.push({
        field: `answerOptions[${i}].isCorrect`,
        message: "isCorrect must be a boolean",
      });
    }
  }

  // ── Semantic validation ──

  // Rationale minimum length
  for (let i = 0; i < q.answerOptions.length; i++) {
    const opt = q.answerOptions[i];
    if (
      opt.rationale_ko &&
      typeof opt.rationale_ko === "string" &&
      opt.rationale_ko.trim().length < MIN_RATIONALE_LENGTH
    ) {
      errors.push({
        field: `answerOptions[${i}].rationale_ko`,
        message: `Rationale too short (${opt.rationale_ko.trim().length} chars, min ${MIN_RATIONALE_LENGTH})`,
      });
    }
    if (
      opt.rationale_en &&
      typeof opt.rationale_en === "string" &&
      opt.rationale_en.trim().length < MIN_RATIONALE_LENGTH
    ) {
      errors.push({
        field: `answerOptions[${i}].rationale_en`,
        message: `Rationale too short (${opt.rationale_en.trim().length} chars, min ${MIN_RATIONALE_LENGTH})`,
      });
    }
  }

  // Hint must not contain correct answer text (both languages)
  if (Array.isArray(q.answerOptions)) {
    const correctOption = q.answerOptions.find((o: any) => o.isCorrect);
    if (correctOption) {
      // Check hint_en vs text_en
      if (q.hint_en && correctOption.text_en) {
        const hintLower = q.hint_en.toLowerCase();
        const answerLower = correctOption.text_en.toLowerCase();
        if (answerLower.length > 5 && hintLower.includes(answerLower)) {
          errors.push({
            field: "hint_en",
            message: "Hint contains the correct answer text",
          });
        }
      }
      // Check hint_ko vs text_ko
      if (q.hint_ko && correctOption.text_ko) {
        const answerKo = correctOption.text_ko.trim();
        if (answerKo.length > 3 && q.hint_ko.includes(answerKo)) {
          errors.push({
            field: "hint_ko",
            message: "힌트에 정답 텍스트가 포함되어 있습니다",
          });
        }
      }
    }
  }

  // Concept keyword must appear in question_en
  if (
    q.concept &&
    typeof q.concept === "string" &&
    q.question_en &&
    typeof q.question_en === "string"
  ) {
    const conceptLower = q.concept.toLowerCase();
    const questionLower = q.question_en.toLowerCase();
    // Split multi-word concepts and check if any significant word appears
    const conceptWords = conceptLower
      .split(/[\s/,\-()]+/)
      .filter((w: string) => w.length > 3);
    const hasConceptKeyword = conceptWords.some((w: string) =>
      questionLower.includes(w)
    );
    if (!hasConceptKeyword) {
      errors.push({
        field: "question_en",
        message: `Concept keyword "${q.concept}" not found in question text`,
      });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run scripts/ai-regenerate/__tests__/validate.test.ts`
Expected: All 13 tests PASS

- [ ] **Step 5: Refactor import.ts to use validate.ts**

In `scripts/ai-regenerate/import.ts`:

1. Add import at top:
```typescript
import { validateQuestion, ValidationResult, VALID_TOPIC_IDS } from "./validate";
```

2. Remove the inline `validateQuestion` function (lines 123-186)

3. Remove the inline `VALID_TOPIC_IDS` array (lines 111-121) — 이제 `validate.ts`에서 export하므로 중복 제거

4. Update all call sites — the old function returned `string[]`, the new one returns `ValidationResult`. Find where `validateQuestion` is called and adapt:

```typescript
// Old usage:
const errors = validateQuestion(q, file, index);
if (errors.length > 0) { ... }

// New usage:
const result = validateQuestion(q);
if (!result.valid) {
  const errors = result.errors.map(e => `${e.field}: ${e.message}`);
  ...
}
```

- [ ] **Step 6: Run existing import dry-run to verify no regression**

Run: `npx ts-node -P scripts/tsconfig.scripts.json scripts/ai-regenerate/import.ts --dry-run`
Expected: Same output as before refactoring (validation results unchanged)

- [ ] **Step 7: Commit**

```bash
git add scripts/ai-regenerate/validate.ts scripts/ai-regenerate/__tests__/validate.test.ts scripts/ai-regenerate/import.ts
git commit -m "refactor: validateQuestion을 validate.ts로 추출

- ValidationResult 반환 타입으로 변경 (field + message 배열)
- 시맨틱 검사 추가 (rationale 길이, hint 정답 포함 여부)
- import.ts에서 새 유틸을 import하여 사용"
```

---

### Task 2: references.json 생성

**Files:**
- Create: `scripts/ai-regenerate/references.json`

- [ ] **Step 1: Create references.json**

스펙 문서의 `레퍼런스 관리 > 구조` 섹션에 정의된 JSON을 그대로 파일로 생성한다.
내용: 9개 토픽별 `sources` (출처 목록) + `syllabus` (커리큘럼 목차) 배열.

파일 경로: `scripts/ai-regenerate/references.json`
내용: 스펙 문서 line 441~612의 JSON

- [ ] **Step 2: Validate JSON syntax**

Run: `node -e "JSON.parse(require('fs').readFileSync('scripts/ai-regenerate/references.json', 'utf-8')); console.log('Valid JSON')"`
Expected: `Valid JSON`

- [ ] **Step 3: Commit**

```bash
git add scripts/ai-regenerate/references.json
git commit -m "feat: 토픽별 실러버스 레퍼런스 데이터 추가

9개 CS 토픽의 커리큘럼 목차와 출처를 하드코딩.
스킬의 Concept Map Generator와 Question Generator가 프롬프트에 주입하여 사용."
```

---

### Task 3: Gap Analyzer 에이전트 프롬프트 작성

**Files:**
- Create: `scripts/ai-regenerate/agent-prompts/skill-gap-analyzer.md`

- [ ] **Step 1: Write the Gap Analyzer prompt**

이 프롬프트는 coordinator가 읽어서 executor 에이전트에게 전달한다.

핵심 내용:
- DB에서 해당 토픽의 모든 문제를 Prisma로 조회 (`src/lib/prisma.ts` 사용)
- `generated/concepts/` 디렉토리의 기존 concept map JSON 파일 읽기
- 각 문제의 `text_en`에서 concept + angle 요약 추출
- concept + angle 수준의 forbidden zone 생성
- 출력 형식: `{ coveredConceptAngles: Array<{ concept, angleSummary }>, totalExisting: number }`

프롬프트에 포함해야 할 구체적 지시사항:
- Prisma 클라이언트 경로: `src/lib/prisma.ts`
- DB 필드명: `text_ko`, `text_en` (DB) / `question_ko`, `question_en` (API)
- 기존 concept map 경로: `scripts/ai-regenerate/generated/concepts/`
- semantic similarity 판단 기준 (cosine > 0.8 금지, 0.6~0.8 다양성 요구)

- [ ] **Step 2: Commit**

```bash
git add scripts/ai-regenerate/agent-prompts/skill-gap-analyzer.md
git commit -m "feat: Gap Analyzer 에이전트 프롬프트 작성"
```

---

### Task 4: Concept Map Generator 에이전트 프롬프트 작성

**Files:**
- Create: `scripts/ai-regenerate/agent-prompts/skill-concept-generator.md`

- [ ] **Step 1: Write the Concept Map Generator prompt**

핵심 내용:
- 입력: topicId + forbidden zone + references.json의 해당 토픽 실러버스
- 출력: 스펙의 "Concept Map 출력 형식" 섹션에 정의된 JSON
- 10개 concept × 3 keyAngle (easy/medium/hard 각 1)
- keyAngle 설계 원칙: 구체적 시나리오, 난이도별 구조 제약
- 사용자가 제공한 토픽 생성 프롬프트(`agent1-topic-planner.md`)의 톤 참고
- MECE 원칙, Type B (gap-filling) 모드로 동작

프롬프트에 주입할 컨텍스트:
- `references.json`의 해당 토픽 `syllabus` 배열
- forbidden zone (Gap Analyzer 출력)
- 난이도 구조 규칙:
  - easy → 단일 개념 확인
  - medium → 2개 개념 결합 또는 시나리오 적용
  - hard → edge case / misconception 기반

- [ ] **Step 2: Commit**

```bash
git add scripts/ai-regenerate/agent-prompts/skill-concept-generator.md
git commit -m "feat: Concept Map Generator 에이전트 프롬프트 작성"
```

---

### Task 5: Question Generator 에이전트 프롬프트 작성

**Files:**
- Create: `scripts/ai-regenerate/agent-prompts/skill-question-generator.md`

- [ ] **Step 1: Write the Question Generator prompt**

핵심 내용:
- 입력: concept (keyAngles 포함) + 실러버스 sources
- 출력: `GeneratedQuestion[]` (import.ts 호환 형식)
- 제약 기반 생성 (Constrained Generation):
  - 각 keyAngle이 테스트할 개념 조합을 명시
  - True/False와 Multiple Choice 약 50:50 배분
  - code_trace 유형: 반드시 step-by-step 실행 과정 포함
- 사용자가 제공한 문제 생성 프롬프트의 톤 참고
- few-shot 예시: `generated/evaluated/pass/` 에서 2-3개 선별하여 포함

기존 `agent2-question-creator.md`와의 차이:
- 4개 옵션 고정 → T/F(2개) + MC(4개) 혼합
- keyAngles가 flat string → structured `{angle, difficulty, questionType}`
- code_trace 시 step-by-step 실행 과정 필수 포함

- [ ] **Step 2: Commit**

```bash
git add scripts/ai-regenerate/agent-prompts/skill-question-generator.md
git commit -m "feat: Question Generator 에이전트 프롬프트 작성"
```

---

### Task 6: Evaluator 에이전트 프롬프트 작성

**Files:**
- Create: `scripts/ai-regenerate/agent-prompts/skill-evaluator.md`

- [ ] **Step 1: Write the Evaluator prompt**

핵심 내용:
- 입력: `GeneratedQuestion[]` (Step 3.5 통과한 문제만)
- 3차원 평가: answer_correctness, distractor_quality, difficulty_accuracy (각 1-10)
- 판정: PASS / FIX / REGEN (스펙의 FIX vs REGEN 분기 기준 표 포함)
- 출력: 구조화 피드백 JSON (스펙의 "평가 결과 & 피드백 구조" 섹션)
- code_trace 특별 규칙: 재계산 X, 논리적 일관성 검증만
- 재평가 시 evaluationHistory 포함
- 난이도 calibration 기준:
  - easy: 학부 2-3학년 교과서 수준
  - medium: 2개 개념 결합, 학부 기말고사
  - hard: edge case, 대학원 입시 미만

기존 `agent3-evaluator.md`와의 차이:
- 7차원 → 3차원 축소
- REVISE → FIX/REGEN 분기
- code_trace: 재계산이 아닌 검증만

**용어 정리**: 스펙에서 "REVISE"와 "FIX/REGEN"이 혼용된다. 의도된 설계는 다음과 같다:
- 중간 밴드 (평균 5.0~7.9)를 **FIX** (answer_correctness >= 8, 부분 수정)와 **REGEN** (answer_correctness < 8, 완전 재생성)으로 분기
- 리포트에서는 "REVISE"를 FIX/REGEN의 공통 표시 라벨로 사용 (예: "REVISE: 3 (→ 2 recovered)")
- 에이전트 프롬프트의 verdict 값은 `PASS`, `FIX`, `REGEN` 3가지만 사용

- [ ] **Step 2: Commit**

```bash
git add scripts/ai-regenerate/agent-prompts/skill-evaluator.md
git commit -m "feat: Evaluator 에이전트 프롬프트 작성"
```

---

### Task 7: Coordinator 스킬 작성 (`.claude/commands/generate-quiz.md`)

**Files:**
- Create: `.claude/commands/generate-quiz.md`

- [ ] **Step 1: Create commands directory if needed**

Run: `mkdir -p .claude/commands`

- [ ] **Step 2: Write the coordinator skill**

`.claude/commands/generate-quiz.md` — Claude Code custom command. 아래 전체 내용을 파일로 작성한다.

````markdown
---
description: CS 퀴즈 문제 자동 생성 파이프라인 (30문제/실행)
argument: topicId — 생성할 토픽 ID (e.g., algorithm, database, operatingSystem)
---

# CS Quiz Generator

You are a pipeline coordinator. Execute the following steps sequentially to generate 30 CS quiz questions for the topic `$ARGUMENTS`.

## Configuration

```
TOPIC_ID = $ARGUMENTS
TARGET_QUESTIONS = 30
TOTAL_RETRY_BUDGET = 10
BATCH_SIZE = 4
DATE = $(date +%Y%m%d)
MODEL = opus
```

Validate that TOPIC_ID is one of: computerSecurity, database, algorithm, dataStructure, computerNetworking, operatingSystem, computerArchitecture, softwareEngineering, springBoot. If invalid, stop and report the error.

## Step 1: Gap Analysis

Read the agent prompt at `scripts/ai-regenerate/agent-prompts/skill-gap-analyzer.md`.

Dispatch an Agent with:
- `subagent_type: "oh-my-claudecode:executor"`
- `model: "opus"`
- Prompt: the gap analyzer prompt content, with `TOPIC_ID` injected

The agent must:
1. Query DB via Prisma (`src/lib/prisma.ts`) for all questions where `topicId === TOPIC_ID`
2. Read existing concept maps from `scripts/ai-regenerate/generated/concepts/`
3. Extract `coveredConceptAngles` array and `totalExisting` count

Save the output as `forbiddenZone` for Step 2.

**Failure handling:** If DB connection fails, stop the pipeline and report the error.

## Step 2: Concept Map Generation

Read the agent prompt at `scripts/ai-regenerate/agent-prompts/skill-concept-generator.md`.
Read the references file at `scripts/ai-regenerate/references.json` and extract the entry for `TOPIC_ID`.

Dispatch an Agent with:
- `subagent_type: "oh-my-claudecode:executor"`
- `model: "opus"`
- Prompt: the concept generator prompt content, injecting:
  - `TOPIC_ID`
  - `forbiddenZone` from Step 1
  - `syllabus` array from references.json for this topic
  - `sources` array from references.json for this topic

The agent must output a concept map JSON with 10 concepts × 3 keyAngles (easy/medium/hard).

Save the JSON to `scripts/ai-regenerate/generated/concepts/${TOPIC_ID}-${DATE}.json`.

## Step 3: Question Generation (Batched Parallel)

Read the agent prompt at `scripts/ai-regenerate/agent-prompts/skill-question-generator.md`.

Split the 10 concepts into batches of BATCH_SIZE (4+3+3).

For each batch, dispatch parallel Agents with:
- `subagent_type: "oh-my-claudecode:executor"`
- `model: "opus"`
- Each agent receives a subset of concepts + the question generator prompt + sources from references.json

Each agent generates 3 questions per concept (1 easy, 1 medium, 1 hard) in `GeneratedQuestion[]` format.

Collect all results into a single array (30 questions total).

Save to `scripts/ai-regenerate/generated/questions/${TOPIC_ID}-${DATE}.json`.

## Step 3.5: Early Pruning

Run structural + semantic validation on all generated questions:

```bash
npx ts-node -P scripts/tsconfig.scripts.json -e "
const { validateQuestion } = require('./scripts/ai-regenerate/validate');
const questions = require('./scripts/ai-regenerate/generated/questions/${TOPIC_ID}-${DATE}.json');
const results = questions.map((q, i) => ({ index: i, ...validateQuestion(q) }));
const failures = results.filter(r => !r.valid);
console.log(JSON.stringify({ total: questions.length, passed: results.length - failures.length, failures }, null, 2));
"
```

Also check for duplicates against existing DB questions:

```bash
npx ts-node -P scripts/tsconfig.scripts.json -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const questions = require('./scripts/ai-regenerate/generated/questions/${TOPIC_ID}-${DATE}.json');
async function checkDupes() {
  const existing = await prisma.question.findMany({ where: { topicId: '${TOPIC_ID}' }, select: { text_en: true } });
  const existingSet = new Set(existing.map(q => q.text_en.trim().toLowerCase().replace(/\s+/g, ' ')));
  const dupes = questions.filter((q, i) => existingSet.has(q.question_en.trim().toLowerCase().replace(/\s+/g, ' ')));
  console.log(JSON.stringify({ duplicates: dupes.length, indices: dupes.map((_, i) => i) }));
  await prisma.\$disconnect();
}
checkDupes();
"
```

Remove any questions that fail validation or are duplicates. These are free REJECTs (no budget cost).

Track how many questions remain. If fewer than TARGET_QUESTIONS, note the deficit for the evaluation loop.

## Step 4-5: Evaluation + FIX/REGEN Loop

Initialize: `budgetUsed = 0`

Read the agent prompt at `scripts/ai-regenerate/agent-prompts/skill-evaluator.md`.

### 4a. LLM Evaluation

Dispatch an Agent with:
- `subagent_type: "oh-my-claudecode:executor"`
- `model: "opus"`
- Prompt: evaluator prompt + all questions that passed Step 3.5

The evaluator returns for each question:
```json
{
  "questionIndex": N,
  "verdict": "PASS" | "FIX" | "REGEN",
  "scores": { "answer_correctness": N, "distractor_quality": N, "difficulty_accuracy": N },
  "feedback": [{ "dimension": "...", "issue": "...", "action": "..." }]
}
```

Verdict rules:
- `answer_correctness < 8` → REGEN (regardless of average)
- 3-dimension average >= 8.0 → PASS
- 3-dimension average 5.0~7.9 AND answer_correctness >= 8 → FIX
- 3-dimension average < 5.0 → REGEN

### 4b. FIX Processing

For each FIX verdict (while budgetUsed < TOTAL_RETRY_BUDGET):
- Dispatch Agent (`oh-my-claudecode:executor`, model: opus) with:
  - The original question
  - The structured feedback
  - Instruction: only modify rationale/distractor, do not change the core question or correct answer
- Run the fixed question through Step 3.5 validation
- Re-evaluate with evaluator (include evaluationHistory)
- `budgetUsed += 1`

### 4c. REGEN Processing

For each REGEN verdict (while budgetUsed < TOTAL_RETRY_BUDGET):
- Dispatch Agent (`oh-my-claudecode:executor`, model: opus) with:
  - The same concept + angle from the concept map
  - Instruction: generate a completely new question (do not try to fix the old one)
- Run through Step 3.5 → 4a evaluation
- `budgetUsed += 1`

### 4d. Difficulty-Aware Supplement

After FIX/REGEN processing, check if TARGET_QUESTIONS is met.

If not, identify which (concept, difficulty) combinations are missing:
```
expected: 10 concepts × 3 difficulties = 30 slots
actual: count PASS questions per (concept, difficulty)
deficit: slots with 0 PASS questions
```

For each deficit (while budgetUsed < TOTAL_RETRY_BUDGET):
- Dispatch Concept Map Generator for additional concepts/angles targeting the missing difficulty
- Dispatch Question Generator for the new angles
- Run through 3.5 → 4a
- `budgetUsed += 1`

### 5a. Dry-Run Import

```bash
npx ts-node -P scripts/tsconfig.scripts.json scripts/ai-regenerate/import.ts --dry-run --dir scripts/ai-regenerate/generated/evaluated/pass/ --file ${TOPIC_ID}-${DATE}.json
```

If dry-run reports duplicates (while budgetUsed < TOTAL_RETRY_BUDGET):
- Remove duplicate questions
- Generate replacements via Question Generator for the same concept+angle
- Run through 3.5 → 4a
- `budgetUsed += 1`

If dry-run passes:
```bash
npx ts-node -P scripts/tsconfig.scripts.json scripts/ai-regenerate/import.ts --dir scripts/ai-regenerate/generated/evaluated/pass/ --file ${TOPIC_ID}-${DATE}.json
npx ts-node -P scripts/tsconfig.scripts.json scripts/ai-regenerate/auto-tag.ts
```

### Budget Exhaustion

If `budgetUsed >= TOTAL_RETRY_BUDGET` at any point:
- Stop retrying
- Import whatever PASS questions exist
- Note the deficit in the report

## Step 6: Report

Save PASS questions to `scripts/ai-regenerate/generated/evaluated/pass/${TOPIC_ID}-${DATE}.json`.
Save REJECT questions to `scripts/ai-regenerate/generated/evaluated/reject/${TOPIC_ID}-${DATE}.json`.

Output the following report to the terminal:

```
═══════════════════════════════════════════════════════
  CS Quiz Generator Report — ${TOPIC_ID} (${DATE})
═══════════════════════════════════════════════════════

📊 Summary
  Target: ${TARGET_QUESTIONS} questions
  Generated: [total generated]    Imported: [total imported]
  PASS: [N]    REVISE: [FIX+REGEN count] (→ [recovered] recovered)    REJECT: [N]
  Supplement rounds: [N]
  Retry budget used: ${budgetUsed}/${TOTAL_RETRY_BUDGET}

📂 Files
  Concept map:  generated/concepts/${TOPIC_ID}-${DATE}.json
  Questions:    generated/questions/${TOPIC_ID}-${DATE}.json
  PASS:         generated/evaluated/pass/${TOPIC_ID}-${DATE}.json
  REJECT:       generated/evaluated/reject/${TOPIC_ID}-${DATE}.json

📝 Concept Breakdown
  [Table: Concept | Easy | Medium | Hard | Status]
  Difficulty distribution: Easy [N] / Medium [N] / Hard [N]

📋 Evaluation Scores (PASS avg)
  answer_correctness:  [avg]
  distractor_quality:  [avg]
  difficulty_accuracy: [avg]

❌ REJECT Details
  [For each rejected question: index, concept, difficulty, reason, retry history]

⚠️  Warnings
  [Budget exhaustion, deficit, any anomalies]

⏱️  Timing
  Gap Analysis:           [duration]
  Concept Map Generation: [duration]
  Question Generation:    [duration] ([N] batches)
  Evaluation + FIX/REGEN: [duration]
  Import & Tag:           [duration]
  ─────────────────────────────
  Total:                  [duration]
```
````

- [ ] **Step 3: Commit**

```bash
git add .claude/commands/generate-quiz.md
git commit -m "feat: /generate-quiz 스킬 coordinator 프롬프트 작성"
```

---

### Task 8: 통합 테스트 (dry-run)

**Files:**
- 모든 이전 task의 산출물

- [ ] **Step 1: validate.ts 테스트 통과 확인**

Run: `npx vitest run scripts/ai-regenerate/__tests__/validate.test.ts`
Expected: All tests PASS

- [ ] **Step 2: import.ts dry-run 리그레션 확인**

Run: `npx ts-node -P scripts/tsconfig.scripts.json scripts/ai-regenerate/import.ts --dry-run`
Expected: 기존과 동일한 validation 결과

- [ ] **Step 3: references.json 무결성 확인**

Run: `node -e "const r = JSON.parse(require('fs').readFileSync('scripts/ai-regenerate/references.json','utf-8')); const topics = Object.keys(r); console.log(topics.length + ' topics:', topics.join(', ')); topics.forEach(t => console.log(t + ':', r[t].syllabus.length, 'syllabus items'))"`
Expected: 9 topics, 각 토픽당 10-13개 syllabus 항목

- [ ] **Step 4: 스킬 파일 존재 확인**

Run: `ls -la .claude/commands/generate-quiz.md scripts/ai-regenerate/agent-prompts/skill-*.md`
Expected: 5개 파일 (coordinator 1 + agent prompts 4)

- [ ] **Step 5: /generate-quiz 스킬을 algorithm 토픽으로 테스트 실행**

Run: `/generate-quiz algorithm`

검증 포인트:
- Step 1 (Gap Analysis)이 DB에서 algorithm 문제를 조회하는지
- Step 2 (Concept Map)가 forbidden zone을 제외하고 concept map을 생성하는지
- Step 3 (Question Generation)가 배치로 문제를 생성하는지
- Step 3.5 (Early Pruning)가 validateQuestion()을 실행하는지
- Step 4 (Evaluation)가 FIX/REGEN 분기를 올바르게 수행하는지
- Step 5 (Import)가 dry-run → import → auto-tag을 실행하는지
- Step 6 (Report)가 상세 리포트를 출력하는지
- 생성된 파일들이 올바른 경로에 저장되는지

- [ ] **Step 6: 최종 커밋**

```bash
git add -A
git commit -m "feat: /generate-quiz 스킬 구현 완료

- validate.ts: 구조+시맨틱 검증 유틸 (import.ts와 공유)
- references.json: 9개 토픽 실러버스 데이터
- 4개 에이전트 프롬프트 (gap-analyzer, concept-generator, question-generator, evaluator)
- coordinator 스킬 (.claude/commands/generate-quiz.md)"
```
