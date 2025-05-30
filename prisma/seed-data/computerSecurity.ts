import { Prisma } from "@prisma/client";

export const computerSecurityQuestions: Prisma.QuestionCreateInput[] = [
  {
    id: "cs001",
    topic: { connect: { id: "computerSecurity" } },
    text_ko:
      "주소 공간 레이아웃 무작위화(ASLR)는 실행될 때마다 스택, 힙, 라이브러리 등의 메모리 주소를 변경하여 버퍼 오버플로우 공격을 완벽하게 방어한다.",
    text_en:
      "Address Space Layout Randomization (ASLR) completely prevents buffer overflow attacks by randomizing memory addresses of stack, heap, and libraries every time a program is executed.",
    hint_ko: "ASLR은 공격을 더 어렵게 만들지만, 만능은 아닙니다.",
    hint_en: "ASLR makes attacks harder, but it's not a silver bullet.",
    answerOptions: {
      create: [
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
  // ... (cs002 ~ cs010 문제들도 유사하게 추가) ...
];
