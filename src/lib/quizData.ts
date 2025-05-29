import { QuestionData, Topic } from "@/types/quizTypes";

export const topicsData: Topic[] = [
  { id: "computerSecurity", name: "컴퓨터 보안" },
  { id: "database", name: "데이터베이스" },
  { id: "algorithm", name: "알고리즘" },
  { id: "dataStructure", name: "자료구조" },
];

export const questionsData: QuestionData[] = [
  // 컴퓨터 보안 예시 문제
  {
    id: "cs001",
    topicId: "computerSecurity",
    question:
      "주소 공간 레이아웃 무작위화(ASLR)는 실행될 때마다 스택, 힙, 라이브러리 등의 메모리 주소를 변경하여 버퍼 오버플로우 공격을 완벽하게 방어한다.",
    answerOptions: [
      {
        text: "True",
        rationale:
          "ASLR은 버퍼 오버플로우 공격 성공 확률을 크게 낮추지만, 정보 유출 취약점과 결합되거나 부분적인 무작위화만 적용될 경우 우회될 수 있습니다. 따라서 완벽한 방어책은 아닙니다.",
        isCorrect: false,
      },
      {
        text: "False",
        rationale:
          "ASLR은 공격 성공 확률을 낮추는 중요한 방어 기법이지만, 특정 조건 하에서는 우회될 수 있으므로 버퍼 오버플로우 공격을 완벽하게 방어하지는 못합니다.",
        isCorrect: true,
      },
    ],
    hint: "ASLR은 공격을 더 어렵게 만들지만, 만능은 아닙니다.",
  },
  {
    id: "cs002",
    topicId: "computerSecurity",
    question:
      "하이브리드 암호화 시스템에서 공개키 암호는 실제 대량의 데이터를 암호화하는 데 주로 사용되고, 대칭키 암호는 공개키를 안전하게 교환하는 데 사용된다.",
    answerOptions: [
      {
        text: "True",
        rationale:
          "실제 대량 데이터 암호화에는 속도가 빠른 대칭키 암호가 사용되며, 공개키 암호는 이 대칭키를 안전하게 암호화하여 교환하는 데 사용됩니다.",
        isCorrect: false,
      },
      {
        text: "False",
        rationale:
          "하이브리드 암호화에서는 비효율적인 공개키 암호로 대량의 데이터를 직접 암호화하지 않습니다. 대신, 빠르고 효율적인 대칭키로 데이터를 암호화하고, 이 대칭키를 공개키 암호로 안전하게 암호화하여 전달합니다.",
        isCorrect: true,
      },
    ],
    hint: "어떤 암호화 방식이 더 빠르고, 어떤 방식이 키 교환에 적합한지 생각해보세요.",
  },
  // 데이터베이스 예시 문제
  {
    id: "db001",
    topicId: "database",
    question:
      "정규화(Normalization)는 데이터 중복을 최소화하고 데이터 무결성을 향상시키기 위한 과정이다.",
    answerOptions: [
      {
        text: "True",
        rationale:
          "정규화는 데이터베이스 설계 시 중복을 제거하고 데이터 삽입, 삭제, 갱신 시 발생할 수 있는 이상 현상을 방지하여 무결성을 유지하는 데 도움이 됩니다.",
        isCorrect: true,
      },
      {
        text: "False",
        rationale: "정규화의 주 목적은 데이터 중복 최소화와 무결성 향상입니다.",
        isCorrect: false,
      },
    ],
    hint: "데이터베이스 테이블 설계 원칙 중 하나입니다.",
  },
];
