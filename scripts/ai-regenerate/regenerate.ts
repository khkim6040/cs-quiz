// scripts/ai-regenerate/regenerate.ts
import Anthropic from "@anthropic-ai/sdk";
import { PrismaClient } from "@prisma/client";
import { PromptTemplates } from "./prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

const prisma = new PrismaClient();

interface GeneratedQuestion {
  question_ko: string;
  question_en: string;
  hint_ko: string;
  hint_en: string;
  topic: string;
  answerOptions: Array<{
    text_ko: string;
    text_en: string;
    rationale_ko: string;
    rationale_en: string;
    isCorrect: boolean;
  }>;
}

/**
 * Claude API를 사용하여 문제 재생성
 */
async function regenerateQuestion(
  topic: string,
  concept: string,
  questionType: "theory" | "algorithm" | "code"
): Promise<GeneratedQuestion | null> {
  try {
    let prompt = "";

    switch (questionType) {
      case "algorithm":
        prompt = PromptTemplates.algorithmProblem(concept, "Medium");
        break;
      case "theory":
        prompt = PromptTemplates.theoryQuestion(topic, concept);
        break;
      case "code":
        prompt = PromptTemplates.codeAnalysis(topic, concept);
        break;
    }

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // JSON 추출 (마크다운 코드 블록 제거)
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3, -3).trim();
    }

    const question = JSON.parse(jsonText) as GeneratedQuestion;

    // 품질 검증
    const qualityCheck = await checkQuality(JSON.stringify(question));

    if (qualityCheck.recommendation === "REJECT") {
      console.log("❌ Question rejected:", qualityCheck.feedback);
      return null;
    }

    if (qualityCheck.overall_score < 7) {
      console.log("⚠️ Low quality score:", qualityCheck.overall_score);
      return null;
    }

    console.log("✅ Question accepted. Score:", qualityCheck.overall_score);
    return question;

  } catch (error) {
    console.error("Error regenerating question:", error);
    return null;
  }
}

/**
 * 품질 검증
 */
async function checkQuality(generatedProblem: string): Promise<any> {
  try {
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: PromptTemplates.qualityCheck(generatedProblem),
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    let jsonText = content.text.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7, -3).trim();
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3, -3).trim();
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error checking quality:", error);
    return {
      overall_score: 5,
      recommendation: "ACCEPT",
      feedback: "Quality check failed, accepting by default",
    };
  }
}

/**
 * 데이터베이스에 문제 저장
 */
async function saveQuestion(
  question: GeneratedQuestion,
  topicId: string
): Promise<void> {
  try {
    const createdQuestion = await prisma.question.create({
      data: {
        topicId,
        text_ko: question.question_ko,
        text_en: question.question_en,
        hint_ko: question.hint_ko,
        hint_en: question.hint_en,
        answerOptions: {
          create: question.answerOptions.map((option) => ({
            text_ko: option.text_ko,
            text_en: option.text_en,
            rationale_ko: option.rationale_ko,
            rationale_en: option.rationale_en,
            isCorrect: option.isCorrect,
          })),
        },
      },
    });

    console.log(`✅ Saved question: ${createdQuestion.id}`);
  } catch (error) {
    console.error("Error saving question:", error);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log("🚀 Starting AI question regeneration...\n");

  // 예시: 알고리즘 문제 생성
  const topics = await prisma.topic.findMany();

  for (const topic of topics) {
    console.log(`\n📚 Generating questions for: ${topic.name_ko}`);

    // 각 주제당 3개의 문제 생성 시도
    for (let i = 0; i < 3; i++) {
      console.log(`\n  Attempt ${i + 1}/3...`);

      const concept = `${topic.name_ko} 관련 개념`;
      const questionType = i % 3 === 0 ? "theory" : i % 3 === 1 ? "algorithm" : "code";

      const question = await regenerateQuestion(
        topic.name_en,
        concept,
        questionType as any
      );

      if (question) {
        await saveQuestion(question, topic.id);
      } else {
        console.log("  ⏭️ Skipping this question");
      }

      // API 레이트 리미트 방지를 위한 대기
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n✨ Question regeneration completed!");
}

// 실행
if (require.main === module) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}

export { regenerateQuestion, checkQuality, saveQuestion };
