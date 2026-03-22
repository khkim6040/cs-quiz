# Difficulty System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add EASY/MEDIUM/HARD difficulty to all questions and display a colored badge on each question card.

**Architecture:** Prisma enum `Difficulty` added to `Question` model with `@default(MEDIUM)`. API routes include `difficulty` in responses. `QuestionComponent` renders a pill badge above the question text. Existing questions default to MEDIUM via migration, then get re-tagged via a Claude Code one-time skill.

**Tech Stack:** Prisma (PostgreSQL), Next.js 14 App Router, React 18, TailwindCSS

**Spec:** `docs/superpowers/specs/2026-03-22-difficulty-system-design.md`

**No test framework is configured in this project.** Verification is done via `npm run check` (lint + type-check) and `npm run build`.

**Note on Prisma `include` behavior:** When using `include` (not `select`), Prisma returns all scalar fields automatically. No changes needed to existing `include` blocks to access the new `difficulty` field.

**Note on `Translations` type:** `Translations` only supports 2-level nesting (`{ [ns: string]: { [key: string]: string } }`). Translation keys must be flat (e.g., `quiz.difficultyEasy`), not nested (e.g., ~~`quiz.difficulty.easy`~~).

---

### Task 1: Schema — Add Difficulty enum and field

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the Difficulty enum before the Question model**

Add before line 33 (before the `Question` model), with a blank line separator:

```prisma
enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

- [ ] **Step 2: Add difficulty field to Question model**

In the `Question` model, add after `hint_en` (line 39):

```prisma
  difficulty    Difficulty     @default(MEDIUM)
```

- [ ] **Step 3: Run migration**

Run: `npx prisma migrate dev --name add-difficulty-to-question`
Expected: Migration created successfully, existing rows get `MEDIUM` default.

- [ ] **Step 4: Verify Prisma client generation**

Run: `npx prisma generate`
Expected: Prisma Client generated, `Difficulty` enum available in `@prisma/client`.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "$(cat <<'EOF'
feat: add Difficulty enum and field to Question model

Adds EASY/MEDIUM/HARD enum with @default(MEDIUM) so existing
questions are automatically tagged as MEDIUM.
EOF
)"
```

---

### Task 2: Types and Translations

**Files:**
- Modify: `src/types/quizTypes.ts:21-29`
- Modify: `src/lib/translations/ko.ts:45-53` (quiz section)
- Modify: `src/lib/translations/en.ts:45-53` (quiz section)

- [ ] **Step 1: Add difficulty to QuestionData interface**

In `src/types/quizTypes.ts`, add `difficulty` field to `QuestionData` after `hint_en` (line 27), before `answerOptions` (line 28):

```ts
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
```

- [ ] **Step 2: Add Korean translation keys**

In `src/lib/translations/ko.ts`, add inside the `quiz` object after `swipeHint` (line 52). Use flat keys since `Translations` type only supports 2-level nesting:

```ts
    difficultyEasy: '쉬움',
    difficultyMedium: '보통',
    difficultyHard: '어려움',
```

- [ ] **Step 3: Add English translation keys**

In `src/lib/translations/en.ts`, add inside the `quiz` object after `swipeHint` (line 52):

```ts
    difficultyEasy: 'Easy',
    difficultyMedium: 'Medium',
    difficultyHard: 'Hard',
```

- [ ] **Step 4: Verify types compile**

Run: `npm run type-check`
Expected: Type errors in `src/app/api/questions/[topicId]/route.ts` (missing `difficulty` in formatQuestion return). The daily-questions route uses `any` typing so it will NOT produce type errors there — verify that route manually in Task 3.

- [ ] **Step 5: Commit**

```bash
git add src/types/quizTypes.ts src/lib/translations/ko.ts src/lib/translations/en.ts
git commit -m "$(cat <<'EOF'
feat: add difficulty type to QuestionData and translation keys
EOF
)"
```

---

### Task 3: API — Include difficulty in question responses

**Files:**
- Modify: `src/app/api/questions/[topicId]/route.ts:108-116` (formatQuestion return)
- Modify: `src/app/api/daily-questions/route.ts:74-84` (formattedQuestions return)

No changes needed to Prisma queries — `include` returns all scalar fields automatically, so `difficulty` is already available on the query result objects.

- [ ] **Step 1: Update topic questions API**

In `src/app/api/questions/[topicId]/route.ts`, add `difficulty` to the `formatQuestion` return object. After `hint_en` (line 114):

```ts
        difficulty: q.difficulty,
```

- [ ] **Step 2: Update daily questions API**

In `src/app/api/daily-questions/route.ts`, add `difficulty` to the return object inside `formattedQuestions.map()`. After `hint_en` (line 82):

```ts
        difficulty: question.difficulty,
```

Note: This route uses `any` typing (`orderedQuestions.map((question: any) => {`), so TypeScript will not catch a missing field here. Verify manually in Task 7 smoke test.

- [ ] **Step 3: Verify types compile**

Run: `npm run type-check`
Expected: Remaining errors only in `src/app/daily/page.tsx` where the local `Question` interface lacks `difficulty`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/questions/[topicId]/route.ts src/app/api/daily-questions/route.ts
git commit -m "$(cat <<'EOF'
feat: include difficulty field in question API responses
EOF
)"
```

---

### Task 4: Daily page — Add difficulty to local Question interface

**Files:**
- Modify: `src/app/daily/page.tsx:11-28` (Question interface)
- Modify: `src/app/daily/page.tsx:382-390` (questionData prop)

- [ ] **Step 1: Add difficulty to local Question interface**

In `src/app/daily/page.tsx`, add `difficulty` to the `Question` interface after `hint_en` (line 18):

```ts
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
```

- [ ] **Step 2: Pass difficulty to QuestionComponent**

In the `questionData` prop object (line 382-390), add `difficulty`. The full prop should be:

```ts
              questionData={{
                id: currentQuestion.id,
                topicId: currentQuestion.topicId as TopicId,
                question_ko: currentQuestion.question_ko,
                question_en: currentQuestion.question_en,
                hint_ko: currentQuestion.hint_ko,
                hint_en: currentQuestion.hint_en,
                difficulty: currentQuestion.difficulty,
                answerOptions: currentQuestion.answerOptions,
              }}
```

- [ ] **Step 3: Verify types compile**

Run: `npm run type-check`
Expected: No type errors remaining.

- [ ] **Step 4: Commit**

```bash
git add src/app/daily/page.tsx
git commit -m "$(cat <<'EOF'
feat: pass difficulty through daily quiz page to QuestionComponent
EOF
)"
```

---

### Task 5: Frontend — Difficulty badge in QuestionComponent

**Files:**
- Modify: `src/components/QuestionComponent.tsx:177-191` (render section, before question text)

- [ ] **Step 1: Add difficulty badge config**

Inside `QuestionComponent` function body (before the return statement, around line 177), add:

```tsx
  const difficultyConfig = {
    EASY: {
      tKey: 'quiz.difficultyEasy',
      classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    },
    MEDIUM: {
      tKey: 'quiz.difficultyMedium',
      classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    },
    HARD: {
      tKey: 'quiz.difficultyHard',
      classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    },
  };
  const diffCfg = difficultyConfig[questionData.difficulty];
```

- [ ] **Step 2: Render the badge above question text**

In the return JSX, right after `<div ref={containerRef} className="my-6 md:my-8" ...>` (line 183) and before the question text div (line 184), add:

```tsx
      {/* Difficulty badge */}
      <span className={`inline-block mb-3 px-2 py-0.5 text-xs font-medium rounded-full ${diffCfg.classes}`}>
        {t(diffCfg.tKey)}
      </span>
```

- [ ] **Step 3: Verify full build**

Run: `npm run check`
Expected: Lint + type-check pass with zero errors.

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Visual check**

Run: `npm run dev`
Open http://localhost:3000 and start any topic quiz. Verify:
- Badge appears above each question
- All questions show "보통" / "Medium" (since all are MEDIUM by default)
- Badge color is orange
- Dark mode badge renders correctly

- [ ] **Step 5: Commit**

```bash
git add src/components/QuestionComponent.tsx
git commit -m "$(cat <<'EOF'
feat: display difficulty badge on question cards

Shows colored pill badge (green/orange/red) above question text.
Uses translation keys for bilingual support.
EOF
)"
```

---

### Task 6: Import pipeline — Store difficulty in DB

**Files:**
- Modify: `scripts/ai-regenerate/import.ts:62,80-91,189-210`

- [ ] **Step 1: Add Difficulty to existing Prisma import and add mapping**

In `scripts/ai-regenerate/import.ts`, merge `Difficulty` into the existing import on line 62:

```ts
import { PrismaClient, Difficulty } from "@prisma/client";
```

Add after the `GeneratedQuestion` interface (after line 91):

```ts
const DIFFICULTY_MAP: Record<string, Difficulty> = {
  easy: "EASY",
  medium: "MEDIUM",
  hard: "HARD",
};
```

- [ ] **Step 2: Make difficulty required in GeneratedQuestion**

Change line 86 from:

```ts
  difficulty?: string;
```

to:

```ts
  difficulty: string;
```

This aligns the TypeScript interface with `validate.ts`, which already enforces `difficulty` as required at runtime.

- [ ] **Step 3: Store difficulty in importQuestion**

In the `importQuestion` function (line 189-210), add `difficulty` to the `prisma.question.create` data object. After `hint_en: q.hint_en,` (line 196):

```ts
      difficulty: DIFFICULTY_MAP[q.difficulty] ?? "MEDIUM",
```

- [ ] **Step 4: Verify script compiles**

Run: `npx tsc -P scripts/tsconfig.scripts.json --noEmit`
Expected: No type errors.

- [ ] **Step 5: Verify dry run works**

Run: `npm run import-questions:dry`
Expected: Script runs without errors (may show 0 files if pass/ directory is empty — that's fine).

- [ ] **Step 6: Commit**

```bash
git add scripts/ai-regenerate/import.ts
git commit -m "$(cat <<'EOF'
feat: store difficulty field in question import pipeline

Maps lowercase difficulty string to Prisma Difficulty enum.
Falls back to MEDIUM if mapping fails.
EOF
)"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full lint + type-check**

Run: `npm run check`
Expected: Zero errors, zero warnings.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev` and verify:
1. Topic quiz (`/quiz/algorithm`) — difficulty badge visible
2. Daily quiz (`/daily`) — difficulty badge visible
3. Language toggle — badge text switches between Korean/English
4. Dark mode — badge colors render correctly

- [ ] **Step 4: Runtime verification of daily-questions API**

Run: `curl -s http://localhost:3000/api/daily-questions | node -e "process.stdin.on('data',d=>{const j=JSON.parse(d);console.log(j.questions?.[0]?.difficulty)})"`
Expected: Prints `MEDIUM` (confirms the `any`-typed route actually includes `difficulty`).

---

### Task 8: Existing question tagging (separate session)

This task is handled via a Claude Code one-time skill, not code changes. Run in a separate session after Tasks 1-7 are merged.

- [ ] **Step 1: Query all questions from DB**

Use Prisma to fetch all questions with their text, answer options, and rationales.

- [ ] **Step 2: Analyze and classify**

Claude Code reads each question and assigns EASY/MEDIUM/HARD based on:
- Concept complexity
- Number of reasoning steps required
- Answer option similarity/distinguishability

- [ ] **Step 3: Update DB**

Run `prisma.question.update()` for each question with the assigned difficulty.

- [ ] **Step 4: Verify distribution**

Query difficulty distribution to ensure reasonable spread across topics.
