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
  const dupes = questions
    .map((q, index) => ({ q, index }))
    .filter(({ q }) => existingSet.has(q.question_en.trim().toLowerCase().replace(/\s+/g, ' ')));
  console.log(JSON.stringify({ duplicates: dupes.length, indices: dupes.map(d => d.index) }));
  await prisma.$disconnect();
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
