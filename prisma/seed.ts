// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

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
];

const questionsSeedData = [
  {
    id: "cs001",
    topic: { connect: { id: "computerSecurity" } }, // 관계 연결
    text_ko:
      "주소 공간 레이아웃 무작위화(ASLR)는 실행될 때마다 스택, 힙, 라이브러리 등의 메모리 주소를 변경하여 버퍼 오버플로우 공격을 완벽하게 방어한다.",
    text_en:
      "Address Space Layout Randomization (ASLR) completely prevents buffer overflow attacks by randomizing memory addresses of stack, heap, and libraries every time a program is executed.",
    hint_ko: "ASLR은 공격을 더 어렵게 만들지만, 만능은 아닙니다.",
    hint_en: "ASLR makes attacks harder, but it's not a silver bullet.",
    answerOptions: {
      create: [
        // 연결된 AnswerOption 생성
        {
          text_ko: "False",
          text_en: "False",
          rationale_ko:
            "ASLR은 공격 성공 확률을 낮추는 중요한 방어 기법이지만, 특정 조건 하에서는 우회될 수 있으므로 버퍼 오버플로우 공격을 완벽하게 방어하지는 못합니다.",
          rationale_en:
            "ASLR reduces the probability of successful attacks but doesn't prevent them entirely, as it can be bypassed under certain conditions.",
          isCorrect: true,
        },
        {
          text_ko: "True",
          text_en: "True",
          rationale_ko:
            "ASLR은 버퍼 오버플로우 공격 성공 확률을 크게 낮추지만, 정보 유출 취약점과 결합되거나 부분적인 무작위화만 적용될 경우 우회될 수 있습니다. 따라서 완벽한 방어책은 아닙니다.",
          rationale_en:
            "While ASLR significantly reduces the success probability of buffer overflow attacks, it can be bypassed if combined with information disclosure vulnerabilities or if only partial randomization is applied. Thus, it's not a complete defense.",
          isCorrect: false,
        },
      ],
    },
  },
  // ... (cs002 ~ cs010 문제들도 유사하게 추가, answerOptions도 함께) ...
  {
    id: "db001",
    topic: { connect: { id: "database" } },
    text_ko:
      "정규화(Normalization)는 데이터 중복을 최소화하고 데이터 무결성을 향상시키기 위한 과정이다.",
    text_en:
      "Normalization is a process to minimize data redundancy and improve data integrity.",
    hint_ko: "데이터베이스 테이블 설계 원칙 중 하나입니다.",
    hint_en: "It's one of the database table design principles.",
    answerOptions: {
      create: [
        {
          text_ko: "True",
          text_en: "True",
          rationale_ko:
            "정규화는 데이터베이스 설계 시 중복을 제거하고 데이터 삽입, 삭제, 갱신 시 발생할 수 있는 이상 현상을 방지하여 무결성을 유지하는 데 도움이 됩니다.",
          rationale_en:
            "Normalization helps in database design by eliminating redundancy and preventing anomalies during data insertion, deletion, and updates, thereby maintaining integrity.",
          isCorrect: true,
        },
        {
          text_ko: "False",
          text_en: "False",
          rationale_ko:
            "정규화의 주 목적은 데이터 중복 최소화와 무결성 향상입니다.",
          rationale_en:
            "The main purpose of normalization is to minimize data redundancy and enhance integrity.",
          isCorrect: false,
        },
      ],
    },
  },
  // ... 다른 주제의 문제들과 선택지들도 추가 ...
  {
    id: "algo001",
    topic: { connect: { id: "algorithm" } },
    text_ko: "퀵 정렬(Quick Sort)의 시간 복잡도는 어떻게 되나요?",
    text_en: "What is the time complexity of Quick Sort?",
    hint_ko: "퀵 정렬의 시간 복잡도는 어떻게 되나요?",
    hint_en: "What is the time complexity of Quick Sort?",
    answerOptions: {
      create: [
        {
          text_ko: "O(n log n)",
          text_en: "O(n log n)",
          rationale_ko:
            "퀵 정렬은 분할 정복 방식으로 평균적으로 O(n log n)의 시간 복잡도를 가집니다.",
          rationale_en:
            "Quick Sort has an average time complexity of O(n log n) due to its divide-and-conquer approach.",
          isCorrect: true,
        },
        {
          text_ko: "O(n^2)",
          text_en: "O(n^2)",
          rationale_ko:
            "퀵 정렬은 최악의 경우 O(n^2)의 시간 복잡도를 가질 수 있습니다.",
          rationale_en:
            "Quick Sort can have a worst-case time complexity of O(n^2) in certain scenarios.",
          isCorrect: false,
        },
      ],
    },
  },
];

async function main() {
  console.log(`Start seeding ...`);

  // 기존 데이터 삭제 (선택적, 주의해서 사용)
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
    // Prisma.QuestionCreateInput 타입에 맞게 answerOptions를 직접 제공
    const question = await prisma.question.create({
      data: q,
    });
    console.log(`Created question with id: ${question.id}`);
  }
  console.log(`Seeding finished.`);
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
