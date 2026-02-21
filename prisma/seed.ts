// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import { computerSecurityQuestions } from "./seed-data/computerSecurity";
import { databaseQuestions } from "./seed-data/database";
import { algorithmQuestions } from "./seed-data/algorithm";
import { dataStructureQuestions } from "./seed-data/dataStructure";
import { conceptsSeedData } from "./seed-data/concepts";

const prisma = new PrismaClient();

// src/lib/quizData.ts 에 정의된 것과 유사한 초기 데이터
const topicsSeedData = [
  {
    id: "computerSecurity",
    name_ko: "컴퓨터 보안",
    name_en: "Computer Security",
  },
  { id: "database", name_ko: "데이터베이스", name_en: "Database" },
  { id: "algorithm", name_ko: "알고리즘", name_en: "Algorithm" },
  { id: "dataStructure", name_ko: "자료구조", name_en: "Data Structure" },
  { id: "computerNetworking", name_ko: "컴퓨터 네트워킹", name_en: "Computer Networking" },
  { id: "operatingSystem", name_ko: "운영체제", name_en: "Operating System" },
  { id: "computerArchitecture", name_ko: "컴퓨터 구조", name_en: "Computer Architecture" },
  { id: "softwareEngineering", name_ko: "소프트웨어 공학", name_en: "Software Engineering" },
  { id: "springBoot", name_ko: "Spring Boot", name_en: "Spring Boot" },
];

const questionsSeedData = [
  ...computerSecurityQuestions,
  ...databaseQuestions,
  ...algorithmQuestions,
  ...dataStructureQuestions,
];

async function main() {
  console.log(`Start seeding ...`);

  // 기존 데이터 삭제 (선택적, 주의해서 사용)
  await prisma.concept.deleteMany();
  await prisma.answerOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.topic.deleteMany();
  console.log("Deleted existing data.");

  for (const t of topicsSeedData) {
    const topic = await prisma.topic.create({
      data: t,
    });
    console.log(`Created topic with id: ${topic.id}`);
  }

  for (const q of questionsSeedData) {
    const question = await prisma.question.create({
      data: q,
    });
    console.log(`Created question with id: ${question.id}`);
  }

  // Seed concepts
  for (const c of conceptsSeedData) {
    const concept = await prisma.concept.create({
      data: c,
    });
    console.log(`Created concept: ${concept.name_en} (${concept.topicId})`);
  }
  console.log(`Seeding finished. ${conceptsSeedData.length} concepts created.`);
}

main()
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
