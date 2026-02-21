// src/app/api/daily-set/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTodayInKST } from "@/lib/timezone";

export async function GET() {
  try {
    const today = getTodayInKST();

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

async function generateDailySet(date: Date, questionCount: number = 15) {
  // 날짜를 시드로 사용 (YYYYMMDD 형식)
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();

  const MAX_PER_TOPIC = 3;

  // 전체 문제에서 랜덤하게 선택 (토픽당 최대 3문제)
  const allQuestions = await prisma.question.findMany({
    select: { id: true, topicId: true },
  });

  if (allQuestions.length === 0) {
    throw new Error('No questions found in database');
  }

  const shuffled = seededShuffle(allQuestions, seed);
  const topicCount: Record<string, number> = {};
  const selected: string[] = [];

  for (const q of shuffled) {
    if (selected.length >= questionCount) break;
    const count = topicCount[q.topicId] || 0;
    if (count >= MAX_PER_TOPIC) continue;
    topicCount[q.topicId] = count + 1;
    selected.push(q.id);
  }

  const finalShuffled = selected;

  // 데이터베이스에 저장
  const dailySet = await prisma.dailyQuestionSet.create({
    data: {
      date,
      questionIds: finalShuffled,
    },
  });

  return dailySet;
}
