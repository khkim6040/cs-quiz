# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CS Quiz is a Korean/English bilingual Computer Science quiz web app covering 4 topics: computer security, databases, algorithms, and data structures. It features daily quizzes, leaderboards, and AI-powered question generation using the Anthropic Claude API.

## Commands

```bash
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint
npx prisma migrate dev   # Run database migrations
npx prisma db seed       # Seed database with question data
npm run regenerate       # AI question regeneration (requires ANTHROPIC_API_KEY)
npm run import-questions # Import generated questions into DB
npm run import-questions:dry  # Dry-run import
```

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — PostgreSQL connection string (e.g., `"postgresql://user:pass@host:5432/csquiz"`)
- `ANTHROPIC_API_KEY` — For AI question generation scripts

## Architecture

**Stack**: Next.js 14 (App Router) + React 18 + TailwindCSS + Prisma (PostgreSQL) + Anthropic Claude API

**Bilingual pattern**: All user-facing content in the database has `_ko` and `_en` suffixed columns (e.g., `text_ko`, `text_en`, `hint_ko`, `hint_en`). The frontend types (`src/types/quizTypes.ts`) use language-neutral field names (`text`, `hint`) — the API routes select the appropriate language column before returning data.

**Key data models** (`prisma/schema.prisma`):
- `Topic` → `Question` → `AnswerOption` (1:N:N hierarchy)
- `DailyQuestionSet` stores question IDs as a PostgreSQL native `String[]` array
- `UserScore` links users to daily sets with a unique constraint on `[userId, dailySetId, topicId]`

**API routes** (`src/app/api/`): Next.js Route Handlers. Auth is cookie-based with simple username login. All DB access goes through the singleton Prisma client at `src/lib/prisma.ts`.

**Question data pipeline**: Raw seed data lives in `prisma/seed-data/*.ts` (one file per topic). The `scripts/ai-regenerate/` pipeline uses Claude to regenerate/refine questions, with prompt templates in `prompts.ts` and output in `scripts/ai-regenerate/generated/`.

**Deployment**: Vercel + Neon PostgreSQL (free tier).
