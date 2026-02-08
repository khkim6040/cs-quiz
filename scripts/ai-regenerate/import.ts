// scripts/ai-regenerate/import.ts
//
// 채팅 UI에서 생성한 문제 JSON 파일들을 DB에 투입하는 스크립트
// Usage: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/ai-regenerate/import.ts [options]
//
// Options:
//   --dry-run       실제 DB에 쓰지 않고 검증만 수행
//   --dir <path>    JSON 파일 디렉토리 (기본: generated/evaluated/pass)
//   --clear         기존 문제 삭제 후 import (주의!)

// ┌─────────────┬────────────────────────────────────────────────────┐
// │    기능     │                        설명                        │
// ├─────────────┼────────────────────────────────────────────────────┤
// │ JSON 검증   │ 필수 필드, 토픽 ID, 정답 개수 등 체크              │
// ├─────────────┼────────────────────────────────────────────────────┤
// │ 중복 감지   │ 영문 질문 텍스트 기준으로 기존 DB와 비교           │
// ├─────────────┼────────────────────────────────────────────────────┤
// │ dry-run     │ npm run import-questions:dry로 실제 쓰기 없이 검증 │
// ├─────────────┼────────────────────────────────────────────────────┤
// │ 전체 import │ npm run import-questions로 DB 투입                 │
// ├─────────────┼────────────────────────────────────────────────────┤
// │ 초기화 모드 │ --clear 옵션으로 기존 문제 삭제 후 import          │
// └─────────────┴────────────────────────────────────────────────────┘
// 사용법

// # 1. 채팅에서 생성한 JSON을 pass/ 디렉토리에 저장
// #    generated/evaluated/pass/algorithm-sorting.json

// # 2. 검증 (DB에 쓰지 않음)
// npm run import-questions:dry

// # 3. 실제 투입
// npm run import-questions

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// ─── Types ───────────────────────────────────────────────

interface GeneratedAnswerOption {
  text_ko: string;
  text_en: string;
  rationale_ko: string;
  rationale_en: string;
  isCorrect: boolean;
}

interface GeneratedQuestion {
  question_ko: string;
  question_en: string;
  hint_ko: string;
  hint_en: string;
  topic: string;
  difficulty?: string;
  concept?: string;
  questionType?: string;
  answerOptions: GeneratedAnswerOption[];
}

interface ValidationError {
  file: string;
  index: number;
  errors: string[];
}

interface ImportStats {
  filesProcessed: number;
  questionsFound: number;
  questionsValid: number;
  questionsImported: number;
  questionsDuplicate: number;
  questionsInvalid: number;
  validationErrors: ValidationError[];
}

// ─── Validation ──────────────────────────────────────────

const VALID_TOPIC_IDS = [
  "computerSecurity",
  "database",
  "algorithm",
  "dataStructure",
];

function validateQuestion(
  q: any,
  file: string,
  index: number
): string[] {
  const errors: string[] = [];

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
      errors.push(`Missing or empty field: ${field}`);
    }
  }

  // Topic ID validation
  if (q.topic && !VALID_TOPIC_IDS.includes(q.topic)) {
    errors.push(
      `Invalid topic "${q.topic}". Must be one of: ${VALID_TOPIC_IDS.join(", ")}`
    );
  }

  // Answer options validation
  if (!Array.isArray(q.answerOptions)) {
    errors.push("answerOptions must be an array");
    return errors;
  }

  if (q.answerOptions.length < 2) {
    errors.push(`Need at least 2 answer options, got ${q.answerOptions.length}`);
  }

  const correctCount = q.answerOptions.filter(
    (o: any) => o.isCorrect === true
  ).length;
  if (correctCount === 0) {
    errors.push("No correct answer marked (isCorrect: true)");
  }
  if (correctCount > 1) {
    errors.push(`Multiple correct answers marked (${correctCount})`);
  }

  // Validate each answer option
  for (let i = 0; i < q.answerOptions.length; i++) {
    const opt = q.answerOptions[i];
    const optFields = ["text_ko", "text_en", "rationale_ko", "rationale_en"];
    for (const field of optFields) {
      if (!opt[field] || typeof opt[field] !== "string" || opt[field].trim() === "") {
        errors.push(`answerOptions[${i}].${field} is missing or empty`);
      }
    }
    if (typeof opt.isCorrect !== "boolean") {
      errors.push(`answerOptions[${i}].isCorrect must be a boolean`);
    }
  }

  return errors;
}

// ─── File Reading ────────────────────────────────────────

function readJsonFiles(dirPath: string): { file: string; data: any[] }[] {
  const results: { file: string; data: any[] }[] = [];

  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return results;
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));

  if (files.length === 0) {
    console.log(`No JSON files found in ${dirPath}`);
    return results;
  }

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const questions = Array.isArray(data) ? data : [data];
      results.push({ file, data: questions });
    } catch (e) {
      console.error(`Failed to parse ${file}: ${(e as Error).message}`);
    }
  }

  return results;
}

// ─── Duplicate Detection ─────────────────────────────────

async function getExistingQuestionTexts(): Promise<Set<string>> {
  const existing = await prisma.question.findMany({
    select: { text_en: true },
  });
  return new Set(existing.map((q) => q.text_en.trim().toLowerCase()));
}

function normalizeForComparison(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

// ─── Import ──────────────────────────────────────────────

async function importQuestion(q: GeneratedQuestion): Promise<string> {
  const created = await prisma.question.create({
    data: {
      topicId: q.topic,
      text_ko: q.question_ko,
      text_en: q.question_en,
      hint_ko: q.hint_ko,
      hint_en: q.hint_en,
      answerOptions: {
        create: q.answerOptions.map((opt) => ({
          text_ko: opt.text_ko,
          text_en: opt.text_en,
          rationale_ko: opt.rationale_ko,
          rationale_en: opt.rationale_en,
          isCorrect: opt.isCorrect,
        })),
      },
    },
  });
  return created.id;
}

// ─── Main ────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const clearFirst = args.includes("--clear");

  const dirIndex = args.indexOf("--dir");
  const inputDir =
    dirIndex !== -1 && args[dirIndex + 1]
      ? args[dirIndex + 1]
      : path.join(__dirname, "generated", "evaluated", "pass");

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   CS Quiz — Question Import              ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log(`  Source:   ${inputDir}`);
  console.log(`  Dry run:  ${dryRun}`);
  console.log(`  Clear DB: ${clearFirst}`);
  console.log();

  // Verify topics exist
  const topics = await prisma.topic.findMany();
  if (topics.length === 0) {
    console.error(
      "No topics found in DB. Run 'npx prisma db seed' first."
    );
    process.exit(1);
  }
  console.log(
    `  Topics in DB: ${topics.map((t) => t.id).join(", ")}`
  );
  console.log();

  // Clear existing questions if requested
  if (clearFirst && !dryRun) {
    console.log("  Clearing existing questions...");
    await prisma.answerOption.deleteMany();
    await prisma.question.deleteMany();
    console.log("  Cleared.\n");
  }

  // Load existing questions for duplicate detection
  const existingTexts = await getExistingQuestionTexts();
  console.log(`  Existing questions in DB: ${existingTexts.size}\n`);

  // Read all JSON files
  const fileData = readJsonFiles(inputDir);

  const stats: ImportStats = {
    filesProcessed: fileData.length,
    questionsFound: 0,
    questionsValid: 0,
    questionsImported: 0,
    questionsDuplicate: 0,
    questionsInvalid: 0,
    validationErrors: [],
  };

  // Process each file
  for (const { file, data } of fileData) {
    console.log(`── ${file} (${data.length} questions) ──`);
    stats.questionsFound += data.length;

    for (let i = 0; i < data.length; i++) {
      const q = data[i];

      // Validate
      const errors = validateQuestion(q, file, i);
      if (errors.length > 0) {
        stats.questionsInvalid++;
        stats.validationErrors.push({ file, index: i, errors });
        console.log(`  [${i}] INVALID: ${errors[0]}`);
        continue;
      }

      // Duplicate check
      const normalized = normalizeForComparison(q.question_en);
      if (existingTexts.has(normalized)) {
        stats.questionsDuplicate++;
        console.log(
          `  [${i}] DUPLICATE: ${q.question_en.substring(0, 60)}...`
        );
        continue;
      }

      stats.questionsValid++;

      // Import
      if (!dryRun) {
        try {
          const id = await importQuestion(q);
          stats.questionsImported++;
          existingTexts.add(normalized); // prevent duplicates within batch
          console.log(
            `  [${i}] IMPORTED (${id}): ${q.question_en.substring(0, 60)}...`
          );
        } catch (e) {
          console.error(
            `  [${i}] DB ERROR: ${(e as Error).message}`
          );
          stats.questionsInvalid++;
        }
      } else {
        console.log(
          `  [${i}] VALID: ${q.question_en.substring(0, 60)}...`
        );
      }
    }
    console.log();
  }

  // Print summary
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Import Summary                         ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`  Files processed:    ${stats.filesProcessed}`);
  console.log(`  Questions found:    ${stats.questionsFound}`);
  console.log(`  Valid:              ${stats.questionsValid}`);
  console.log(`  Imported:           ${stats.questionsImported}`);
  console.log(`  Duplicates skipped: ${stats.questionsDuplicate}`);
  console.log(`  Invalid skipped:    ${stats.questionsInvalid}`);

  if (stats.validationErrors.length > 0) {
    console.log(`\n── Validation Errors ──`);
    for (const ve of stats.validationErrors) {
      console.log(`  ${ve.file} [${ve.index}]:`);
      for (const err of ve.errors) {
        console.log(`    - ${err}`);
      }
    }
  }

  if (dryRun) {
    console.log("\n  (Dry run — no data was written to DB)");
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
