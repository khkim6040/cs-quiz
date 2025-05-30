import { Prisma } from "@prisma/client";

export const algorithmQuestions: Prisma.QuestionCreateInput[] = [
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
  // ... 추가 문제들 ...
];
