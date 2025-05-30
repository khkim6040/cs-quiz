import { Prisma } from "@prisma/client";

export const databaseQuestions: Prisma.QuestionCreateInput[] = [
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
  // ... 추가 문제들 ...
];
