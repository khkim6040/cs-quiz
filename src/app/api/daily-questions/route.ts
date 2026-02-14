// src/app/api/daily-questions/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang") || "ko";

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // 오늘의 문제 세트 조회
    let dailySet = await prisma.dailyQuestionSet.findUnique({
      where: { date: today },
    });

    // 오늘의 세트가 없으면 생성
    if (!dailySet) {
      dailySet = await generateDailySet(today);
    }

    const questionIds = dailySet.questionIds;

    // 문제들 조회
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
      },
      include: {
        answerOptions: true,
        topic: true,
      },
    });

    // 순서 유지하며 변환
    const orderedQuestions = questionIds
      .map(id => questions.find(q => q.id === id))
      .filter(q => q !== undefined);

    const formattedQuestions = orderedQuestions.map((question) => ({
      id: question.id,
      topicId: question.topicId,
      topicName: lang === "en" ? question.topic.name_en : question.topic.name_ko,
      question: lang === "en" ? question.text_en : question.text_ko,
      hint: lang === "en" ? question.hint_en : question.hint_ko,
      answerOptions: question.answerOptions.map((option) => ({
        text: lang === "en" ? option.text_en : option.text_ko,
        rationale: lang === "en" ? option.rationale_en : option.rationale_ko,
        isCorrect: option.isCorrect,
      })),
    }));

    return NextResponse.json({
      dailySetId: dailySet.id,
      date: dailySet.date,
      questions: formattedQuestions,
    });
  } catch (error) {
    console.error("Failed to get daily questions:", error);
    return NextResponse.json(
      { error: "Failed to get daily questions" },
      { status: 500 }
    );
  }
}

// Fisher-Yates 셔플 알고리즘 (날짜 기반 시드)
function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let random = seed;
  
  // 간단한 선형 합동 생성기 (LCG)
  const lcg = () => {
    random = (random * 1103515245 + 12345) % 2147483648;
    return random / 2147483648;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
}

async function generateDailySet(date: Date) {
  // 날짜를 시드로 사용 (YYYYMMDD 형식)
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  
  const topics = await prisma.topic.findMany();
  const questionIds: string[] = [];

  for (const topic of topics) {
    const questions = await prisma.question.findMany({
      where: { topicId: topic.id },
      select: { id: true },
    });

    // 토픽별로 고유한 시드 사용
    const topicSeed = seed + topic.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const shuffled = seededShuffle(questions, topicSeed);
    const selected = shuffled.slice(0, Math.min(5, questions.length));
    questionIds.push(...selected.map(q => q.id));
  }

  // 전체 문제를 다시 섞음
  const finalShuffled = seededShuffle(questionIds, seed);

  return await prisma.dailyQuestionSet.create({
    data: {
      date,
      questionIds: finalShuffled,
    },
  });
}
