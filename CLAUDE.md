# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CS Quiz is a Korean/English bilingual Computer Science quiz web app. It features daily quizzes, topic/random quizzes, leaderboards, and AI-powered question generation. Deployed on Vercel + Neon PostgreSQL.

## Commands

```bash
# Development
npm run dev              # Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run check            # Lint + type-check (run before commits)
npm run lint             # ESLint only
npm run lint:fix         # ESLint with auto-fix
npm run lint:strict      # ESLint with zero warnings tolerance
npm run type-check       # tsc --noEmit only

# Database
npx prisma migrate dev   # Run migrations
npx prisma db seed       # Seed topics + questions from prisma/seed-data/
npx prisma studio        # DB browser GUI

# Question pipeline
npm run import-questions      # Import generated JSON from generated/evaluated/pass/ into DB
npm run import-questions:dry  # Dry-run (validate without writing)
npm run add-topic -- --id <id> --name-ko "한글명" --name-en "English Name"
npm run auto-tag              # Auto-tag existing questions with concepts
npm run auto-tag:dry          # Dry-run concept tagging

# Daily question sets
npm run generate-daily        # Generate tomorrow's daily set
npm run generate-daily:week   # Generate next 7 days
npm run generate-daily:month  # Generate next 30 days

# Tests (Vitest)
npm run test             # Run all tests once
npm run test:watch       # Watch mode
```

Tests live in `__tests__/` folders next to the code they cover (e.g. `src/lib/__tests__/`, `scripts/ai-regenerate/__tests__/`). Run a single file with `npx vitest run path/to/file.test.ts`.

## Commit Convention

`feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — PostgreSQL connection string
- `ANTHROPIC_API_KEY` — For AI question generation scripts only (not needed for dev server)

## Architecture

**Stack**: Next.js 14 (App Router) + React 18 + TailwindCSS + Prisma (PostgreSQL)

**Path alias**: `@/*` maps to `./src/*`

### Bilingual pattern

DB columns use `_ko`/`_en` suffixes (e.g., `text_ko`, `text_en`, `hint_ko`, `hint_en`). API routes return **both** language columns — the frontend components select the appropriate one at render time using the `language` value from `LanguageContext`. UI static strings use the translation system at `src/lib/translations/{ko,en}.ts` accessed via the `useLanguage()` hook's `t()` function (dot-notation keys like `t('daily.title')`).

### Data models (`prisma/schema.prisma`)

- `Topic` → `Question` → `AnswerOption` (1:N:N)
- `Question` ↔ `Concept` (M:N implicit relation, concepts are per-topic with `@@unique([topicId, name_en])`)
- `DailyQuestionSet` stores question IDs as PostgreSQL `String[]` array, one set per date
- `UserScore` has unique constraint on `[userId, dailySetId, topicId]`
- `WrongNote` implements a Leitner-box spaced-repetition system (`leitnerBox`, `nextReviewAt`, `consecutiveCorrect`) per `[userId, questionId]`
- `QuizSession` records every completed quiz attempt (`quizType`: `'daily' | 'topic' | 'random'`) for streak/stats calculations
- `WeeklyChallenge` picks one topic per week (`weekStart` unique)
- All 9 topic IDs: `computerSecurity`, `database`, `algorithm`, `dataStructure`, `computerNetworking`, `operatingSystem`, `computerArchitecture`, `softwareEngineering`, `springBoot`

### Key patterns

- **Prisma client**: Singleton at `src/lib/prisma.ts` — all server-side DB access uses this
- **Auth**: Cookie-based with simple username login, no password. `AuthContext` auto-restores sessions from localStorage
- **API field rename gotcha**: The questions endpoint (`/api/questions/[topicId]`) renames DB field `text_ko` → `question_ko` in its response to match the frontend `QuestionData` type. The DB schema uses `text_ko`/`text_en` but all frontend code expects `question_ko`/`question_en`
- **Client state**: React Context for auth (`useAuth()`) and language (`useLanguage()`), both wrap the entire app in `layout.tsx`
- **Daily set caching**: `/daily` (`src/app/daily/page.tsx`) and `/api/daily-set` are `force-dynamic` so "does today's set exist" is always checked fresh (cheap, unique-indexed lookup). The expensive part — fetching the 10 full questions/options/topics for that set — is cached with `unstable_cache` keyed by the **immutable `dailySetId`**, not by date, with `revalidate: false`. Never key this cache by date: a date can flip from "no set" to "has a set" during the cache window, which locks in a stale empty result until expiry; an ID never changes what it points to, so it's safe to cache indefinitely
- **KST date handling**: `getTodayInKST()` in `src/lib/timezone.ts` is the single source of truth for "today" (DB dates are stored as UTC midnight of the KST calendar day). Use it anywhere a route needs to look up today's `DailyQuestionSet`

### Scripts

All scripts under `scripts/` use a separate tsconfig at `scripts/tsconfig.scripts.json` (CommonJS module, ES2020 target). Run via `ts-node -P scripts/tsconfig.scripts.json`.

### Question import pipeline

1. Generate question JSON (structure defined in `scripts/ai-regenerate/import.ts` — `GeneratedQuestion` interface). The `/generate-quiz` slash command runs the full multi-agent pipeline (gap analysis → concept map → parallel question generation → evaluation/fix/regen loop → dry-run import) instead of a single AI chat — see `.claude/commands/generate-quiz.md` and `scripts/ai-regenerate/README.md`
2. Place JSON files in `scripts/ai-regenerate/generated/evaluated/pass/`
3. Validate with `npm run import-questions:dry`
4. Import with `npm run import-questions`

### Daily batch in production

`.github/workflows/generate-daily.yml` runs `npm run generate-daily -- 1 10 1` daily via cron (KST 06:00) to pre-generate tomorrow's set — this is what actually keeps `/daily` populated in production, not a Vercel cron. GitHub auto-disables scheduled workflows after 60 days with no push to the repo; the workflow's last step commits a timestamp file (`.github/last-daily-run.txt`) on every successful run specifically to reset that counter. If `/daily` ever appears stuck on stale data, check `gh workflow list` for `disabled_inactivity` before assuming a code bug.

### Adding a new topic

1. Add topic ID to `VALID_TOPIC_IDS` in `scripts/ai-regenerate/validate.ts`
2. Add to DB: `npm run add-topic -- --id <slug> --name-ko "한글" --name-en "English"`
3. Add to `TopicId` union type in `src/types/quizTypes.ts`
4. Add translations in `src/lib/translations/ko.ts` and `en.ts`
