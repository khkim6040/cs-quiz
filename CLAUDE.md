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
```

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
- Topic IDs are string slugs (e.g., `computerSecurity`, `database`, `algorithm`, `dataStructure`, `computerNetworking`, `operatingSystem`)

### Key patterns

- **Prisma client**: Singleton at `src/lib/prisma.ts` — all server-side DB access uses this
- **Auth**: Cookie-based with simple username login, no password. `AuthContext` auto-restores sessions from localStorage
- **API routes**: Next.js Route Handlers in `src/app/api/`. The questions endpoint (`/api/questions/[topicId]`) renames DB field `text_ko` → `question_ko` in its response to match the frontend `QuestionData` type
- **Client state**: React Context for auth (`useAuth()`) and language (`useLanguage()`), both wrap the entire app in `layout.tsx`

### Scripts

All scripts under `scripts/` use a separate tsconfig at `scripts/tsconfig.scripts.json` (CommonJS module, ES2020 target). Run via `ts-node -P scripts/tsconfig.scripts.json`.

### Question import pipeline

1. Generate question JSON via AI chat (structure defined in `scripts/ai-regenerate/import.ts` — `GeneratedQuestion` interface)
2. Place JSON files in `scripts/ai-regenerate/generated/evaluated/pass/`
3. Validate with `npm run import-questions:dry`
4. Import with `npm run import-questions`

### Adding a new topic

1. Add topic ID to `VALID_TOPIC_IDS` in `scripts/ai-regenerate/import.ts`
2. Add to DB: `npm run add-topic -- --id <slug> --name-ko "한글" --name-en "English"`
3. Add to `TopicId` union type in `src/types/quizTypes.ts`
4. Add translations in `src/lib/translations/ko.ts` and `en.ts`
