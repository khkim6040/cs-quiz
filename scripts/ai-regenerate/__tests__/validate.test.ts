// scripts/ai-regenerate/__tests__/validate.test.ts
import { describe, it, expect } from "vitest";
import { validateQuestion } from "../validate";

describe("validateQuestion", () => {
  const validQuestion = {
    question_ko: "테스트 질문입니다.",
    question_en: "This is a test question.",
    hint_ko: "힌트입니다.",
    hint_en: "This is a hint.",
    topic: "algorithm",
    difficulty: "easy",
    concept: "Sorting",
    questionType: "conceptual",
    answerOptions: [
      {
        text_ko: "정답",
        text_en: "Correct answer",
        rationale_ko: "이것이 정답인 이유는 다음과 같습니다. 정렬 알고리즘의 기본 원리에 따라...",
        rationale_en: "This is correct because of the fundamental principle of sorting algorithms...",
        isCorrect: true,
      },
      {
        text_ko: "오답",
        text_en: "Wrong answer",
        rationale_ko: "이것은 틀린 이유는 다음과 같습니다. 해당 주장은 실제 동작과 다르기 때문에...",
        rationale_en: "This is incorrect because the claim does not match the actual behavior...",
        isCorrect: false,
      },
    ],
  };

  it("returns valid for a correct question", () => {
    const result = validateQuestion(validQuestion);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("detects missing required fields", () => {
    const q = { ...validQuestion, question_ko: "" };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "question_ko")).toBe(true);
  });

  it("detects invalid topic ID", () => {
    const q = { ...validQuestion, topic: "invalidTopic" };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "topic")).toBe(true);
  });

  it("detects multiple correct answers", () => {
    const q = {
      ...validQuestion,
      answerOptions: validQuestion.answerOptions.map((o) => ({
        ...o,
        isCorrect: true,
      })),
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "answerOptions")).toBe(true);
  });

  it("detects no correct answer", () => {
    const q = {
      ...validQuestion,
      answerOptions: validQuestion.answerOptions.map((o) => ({
        ...o,
        isCorrect: false,
      })),
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
  });

  it("detects missing answer option fields", () => {
    const q = {
      ...validQuestion,
      answerOptions: [
        { text_ko: "답", isCorrect: true },
        { text_ko: "답2", isCorrect: false },
      ],
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.field.startsWith("answerOptions["))
    ).toBe(true);
  });

  it("detects invalid difficulty value", () => {
    const q = { ...validQuestion, difficulty: "extreme" };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "difficulty")).toBe(true);
  });

  it("detects short rationale (semantic check)", () => {
    const q = {
      ...validQuestion,
      answerOptions: [
        {
          ...validQuestion.answerOptions[0],
          rationale_ko: "짧음",
          rationale_en: "short",
        },
        validQuestion.answerOptions[1],
      ],
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.field === "answerOptions[0].rationale_ko")
    ).toBe(true);
  });

  it("detects hint_en containing correct answer text", () => {
    const correctText = validQuestion.answerOptions.find(
      (o) => o.isCorrect
    )!.text_en;
    const q = { ...validQuestion, hint_en: `The answer is ${correctText}` };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "hint_en")).toBe(true);
  });

  it("detects hint_ko containing correct answer text", () => {
    const correctText = validQuestion.answerOptions.find(
      (o) => o.isCorrect
    )!.text_ko;
    const q = { ...validQuestion, hint_ko: `정답은 ${correctText}입니다` };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "hint_ko")).toBe(true);
  });

  it("detects concept keyword missing from question_en", () => {
    const q = {
      ...validQuestion,
      concept: "QuickSort",
      question_en: "What is the time complexity of this algorithm?",
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "question_en")).toBe(true);
  });

  it("passes when concept keyword is present in question_en", () => {
    const q = {
      ...validQuestion,
      concept: "Sorting",
      question_en: "Which sorting algorithm has O(n log n) worst case?",
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(true);
  });

  it("detects trivial distractor (short rationale on incorrect option)", () => {
    const q = {
      ...validQuestion,
      answerOptions: [
        validQuestion.answerOptions[0],
        {
          ...validQuestion.answerOptions[1],
          rationale_ko: "틀림",
          rationale_en: "wrong",
        },
      ],
    };
    const result = validateQuestion(q);
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) =>
          e.field === "answerOptions[1].rationale_ko" ||
          e.field === "answerOptions[1].rationale_en"
      )
    ).toBe(true);
  });
});
