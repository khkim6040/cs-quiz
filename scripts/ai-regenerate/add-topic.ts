// scripts/ai-regenerate/add-topic.ts
//
// DB에 새로운 토픽을 추가하는 스크립트
// Usage: npx ts-node -P scripts/tsconfig.scripts.json scripts/ai-regenerate/add-topic.ts [options]
//
// Options:
//   --id <id>        토픽 ID (camelCase, 예: softwareEngineering)
//   --name-ko <name> 한글 이름 (예: "소프트웨어 공학")
//   --name-en <name> 영문 이름 (예: "Software Engineering")
//   --dry-run        실제 DB에 쓰지 않고 검증만 수행
//
// Examples:
//   npm run add-topic -- --id softwareEngineering --name-ko "소프트웨어 공학" --name-en "Software Engineering"
//   npm run add-topic -- --id machineLearning --name-ko "머신러닝" --name-en "Machine Learning" --dry-run

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TopicData {
    id: string;
    name_ko: string;
    name_en: string;
}

function parseArgs(): { topics: TopicData[]; dryRun: boolean } {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");
    const topics: TopicData[] = [];

    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--id" && args[i + 1]) {
            const id = args[i + 1];
            const nameKoIndex = args.indexOf("--name-ko", i);
            const nameEnIndex = args.indexOf("--name-en", i);

            if (nameKoIndex === -1 || nameEnIndex === -1) {
                console.error(`Error: --id "${id}" requires both --name-ko and --name-en`);
                process.exit(1);
            }

            const name_ko = args[nameKoIndex + 1];
            const name_en = args[nameEnIndex + 1];

            if (!name_ko || !name_en) {
                console.error(`Error: Missing values for --name-ko or --name-en`);
                process.exit(1);
            }

            topics.push({ id, name_ko, name_en });
        }
    }

    return { topics, dryRun };
}

function validateTopicId(id: string): string[] {
    const errors: string[] = [];

    if (!id || id.trim() === "") {
        errors.push("Topic ID cannot be empty");
        return errors;
    }

    // camelCase 검증
    if (!/^[a-z][a-zA-Z0-9]*$/.test(id)) {
        errors.push(
            `Topic ID must be in camelCase format (start with lowercase, no spaces/special chars): "${id}"`
        );
    }

    // 길이 검증
    if (id.length < 3) {
        errors.push("Topic ID must be at least 3 characters long");
    }

    if (id.length > 50) {
        errors.push("Topic ID must be less than 50 characters");
    }

    return errors;
}

function validateTopicData(topic: TopicData): string[] {
    const errors: string[] = [];

    // ID 검증
    errors.push(...validateTopicId(topic.id));

    // 이름 검증
    if (!topic.name_ko || topic.name_ko.trim() === "") {
        errors.push("Korean name (--name-ko) cannot be empty");
    }

    if (!topic.name_en || topic.name_en.trim() === "") {
        errors.push("English name (--name-en) cannot be empty");
    }

    return errors;
}

async function topicExists(id: string): Promise<boolean> {
    const existing = await prisma.topic.findUnique({
        where: { id },
    });
    return existing !== null;
}

async function addTopic(topic: TopicData): Promise<void> {
    await prisma.topic.create({
        data: {
            id: topic.id,
            name_ko: topic.name_ko,
            name_en: topic.name_en,
        },
    });
}

async function main() {
    const { topics, dryRun } = parseArgs();

    if (topics.length === 0) {
        console.log("╔══════════════════════════════════════════╗");
        console.log("║   CS Quiz — Add Topic                    ║");
        console.log("╚══════════════════════════════════════════╝");
        console.log();
        console.log("Usage:");
        console.log("  npm run add-topic -- --id <id> --name-ko <name> --name-en <name>");
        console.log();
        console.log("Example:");
        console.log('  npm run add-topic -- --id softwareEngineering --name-ko "소프트웨어 공학" --name-en "Software Engineering"');
        console.log();
        console.log("Options:");
        console.log("  --id <id>        Topic ID in camelCase");
        console.log("  --name-ko <name> Korean name");
        console.log("  --name-en <name> English name");
        console.log("  --dry-run        Validate only, don't write to DB");
        process.exit(0);
    }

    console.log("╔══════════════════════════════════════════╗");
    console.log("║   CS Quiz — Add Topic                    ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log();
    console.log(`  Dry run:  ${dryRun}`);
    console.log();

    // 기존 토픽 목록 출력
    const existingTopics = await prisma.topic.findMany();
    console.log(`  Existing topics in DB (${existingTopics.length}):`);
    for (const t of existingTopics) {
        console.log(`    - ${t.id} (${t.name_ko} / ${t.name_en})`);
    }
    console.log();

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // 각 토픽 처리
    for (const topic of topics) {
        console.log(`── Processing: ${topic.id} ──`);

        // 검증
        const errors = validateTopicData(topic);
        if (errors.length > 0) {
            console.log(`  ❌ VALIDATION ERROR:`);
            for (const err of errors) {
                console.log(`     - ${err}`);
            }
            errorCount++;
            console.log();
            continue;
        }

        // 중복 체크
        const exists = await topicExists(topic.id);
        if (exists) {
            console.log(`  ⚠️  SKIPPED: Topic "${topic.id}" already exists in DB`);
            skipCount++;
            console.log();
            continue;
        }

        // 추가
        if (!dryRun) {
            try {
                await addTopic(topic);
                console.log(`  ✅ ADDED: ${topic.id}`);
                console.log(`     Korean:  ${topic.name_ko}`);
                console.log(`     English: ${topic.name_en}`);
                successCount++;
            } catch (e) {
                console.log(`  ❌ DB ERROR: ${(e as Error).message}`);
                errorCount++;
            }
        } else {
            console.log(`  ✓ VALID: ${topic.id}`);
            console.log(`     Korean:  ${topic.name_ko}`);
            console.log(`     English: ${topic.name_en}`);
            successCount++;
        }
        console.log();
    }

    // 요약
    console.log("╔══════════════════════════════════════════╗");
    console.log("║   Summary                                ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log(`  Topics processed: ${topics.length}`);
    console.log(`  Success:          ${successCount}`);
    console.log(`  Skipped:          ${skipCount} (already exists)`);
    console.log(`  Errors:           ${errorCount}`);

    if (dryRun) {
        console.log("\n  (Dry run — no data was written to DB)");
    }

    if (successCount > 0 && !dryRun) {
        console.log("\n  ✨ Next steps:");
        console.log("     1. Add topic ID to VALID_TOPIC_IDS in scripts/ai-regenerate/import.ts");
        console.log("     2. Add TopicId type in src/types/quizTypes.ts");
        console.log("     3. Add translations in src/lib/translations/ko.ts and en.ts");
    }
}

main()
    .catch((e) => {
        console.error("Fatal error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
