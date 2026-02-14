// src/app/api/daily-set/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    console.log("[Daily Set API] Looking for date:", today.toISOString());

    // 오늘의 문제 세트 조회
    let dailySet = await prisma.dailyQuestionSet.findUnique({
      where: { date: today },
    });

    // 오늘의 세트가 없으면 생성
    if (!dailySet) {
      console.log("[Daily Set API] No daily set found, generating...");
      dailySet = await generateDailySet(today);
    }

    console.log("[Daily Set API] Returning dailySet:", {
      id: dailySet.id,
      date: dailySet.date,
      questionCount: dailySet.questionIds.length,
    });

    return NextResponse.json(dailySet);
  } catch (error) {
    console.error("Failed to get daily set:", error);
    return NextResponse.json(
      { error: "Failed to get daily question set" },
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
  
  // 각 주제에서 5문제씩 랜덤 선택
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

  // 전체 셔플
  const finalShuffled = seededShuffle(questionIds, seed);

  // 데이터베이스에 저장
  const dailySet = await prisma.dailyQuestionSet.create({
    data: {
      date,
      questionIds: finalShuffled,
    },
  });

  return dailySet;
}
