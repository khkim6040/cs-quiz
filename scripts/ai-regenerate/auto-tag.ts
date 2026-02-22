// scripts/ai-regenerate/auto-tag.ts
//
// 기존 DB 문제에 concept 태그를 자동으로 부여하는 스크립트
// JSON 파일에서 text_en → concept 매핑을 복원하여 시드 concept에 연결
//
// Usage:
//   npm run auto-tag           # 실제 태깅
//   npm run auto-tag:dry       # dry-run (DB 변경 없이 결과만 확인)

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import { loadSeedConcepts, matchConcept } from "./concept-matcher";

const prisma = new PrismaClient();

interface TagStats {
  totalUntagged: number;
  jsonMapped: number;
  conceptMatched: number;
  conceptUnmatched: number;
  alreadyTagged: number;
}

function normalizeForComparison(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * JSON 파일들에서 text_en → concept 매핑 테이블 구축
 */
function buildConceptMap(dirPath: string): Map<string, string> {
  const map = new Map<string, string>();

  if (!fs.existsSync(dirPath)) {
    console.error(`Directory not found: ${dirPath}`);
    return map;
  }

  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const questions = Array.isArray(data) ? data : [data];

      for (const q of questions) {
        if (q.question_en && q.concept) {
          const key = normalizeForComparison(q.question_en);
          map.set(key, q.concept);
        }
      }
    } catch (e) {
      console.error(`Failed to parse ${file}: ${(e as Error).message}`);
    }
  }

  return map;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const dirIndex = args.indexOf("--dir");
  const inputDir =
    dirIndex !== -1 && args[dirIndex + 1]
      ? args[dirIndex + 1]
      : path.join(__dirname, "generated", "evaluated", "pass");

  console.log("╔══════════════════════════════════════════╗");
  console.log("║   CS Quiz — Auto Concept Tagger          ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log();
  console.log(`  JSON source: ${inputDir}`);
  console.log(`  Dry run:     ${dryRun}`);
  console.log();

  // 1. Load seed concepts
  await loadSeedConcepts(prisma);
  console.log("  Seed concepts loaded.\n");

  // 2. Build text_en → concept mapping from JSON files
  const conceptMap = buildConceptMap(inputDir);
  console.log(`  JSON concept mappings: ${conceptMap.size}\n`);

  // 3. Find untagged questions
  const untagged = await prisma.question.findMany({
    where: { concepts: { none: {} } },
    select: { id: true, topicId: true, text_en: true },
  });

  const stats: TagStats = {
    totalUntagged: untagged.length,
    jsonMapped: 0,
    conceptMatched: 0,
    conceptUnmatched: 0,
    alreadyTagged: 0,
  };

  console.log(`  Untagged questions: ${untagged.length}\n`);

  if (untagged.length === 0) {
    console.log("  All questions already tagged. Nothing to do.");
    return;
  }

  // 4. Process each untagged question
  for (const q of untagged) {
    const key = normalizeForComparison(q.text_en);
    const rawConcept = conceptMap.get(key);

    if (!rawConcept) {
      continue; // JSON에 없는 문제는 스킵
    }

    stats.jsonMapped++;
    const matched = matchConcept(rawConcept, q.topicId);

    if (matched) {
      stats.conceptMatched++;
      if (!dryRun) {
        await prisma.question.update({
          where: { id: q.id },
          data: { concepts: { connect: [{ id: matched.id }] } },
        });
      }
      console.log(
        `  ✓ [${q.topicId}] "${rawConcept}" → ${matched.name_en}`
      );
    } else {
      stats.conceptUnmatched++;
      console.log(
        `  ✗ [${q.topicId}] "${rawConcept}" → (no match)`
      );
    }
  }

  // 5. Summary
  console.log();
  console.log("╔══════════════════════════════════════════╗");
  console.log("║   Auto-Tag Summary                       ║");
  console.log("╚══════════════════════════════════════════╝");
  console.log(`  Untagged questions:   ${stats.totalUntagged}`);
  console.log(`  JSON mappings found:  ${stats.jsonMapped}`);
  console.log(`  Concepts matched:     ${stats.conceptMatched}`);
  console.log(`  Concepts unmatched:   ${stats.conceptUnmatched}`);

  if (dryRun) {
    console.log("\n  (Dry run — no data was written to DB)");
  } else {
    console.log(`\n  Tagged ${stats.conceptMatched} questions.`);
  }
}

main()
  .catch((e) => {
    console.error("Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
