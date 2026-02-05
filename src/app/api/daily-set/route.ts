// src/app/api/daily-set/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘의 문제 세트 조회
    let dailySet = await prisma.dailyQuestionSet.findUnique({
      where: { date: today },
    });

    // 오늘의 세트가 없으면 생성
    if (!dailySet) {
      dailySet = await generateDailySet(today);
    }

    return NextResponse.json(dailySet);
  } catch (error) {
    console.error("Failed to get daily set:", error);
    return NextResponse.json(
      { error: "Failed to get daily question set" },
      { status: 500 }
    );
  }
}

async function generateDailySet(date: Date) {
  // 각 주제에서 5문제씩 랜덤 선택
  const topics = await prisma.topic.findMany();

  const questionIds: string[] = [];

  for (const topic of topics) {
    const questions = await prisma.question.findMany({
      where: { topicId: topic.id },
      select: { id: true },
    });

    // 랜덤 섞기
    const shuffled = questions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(5, questions.length));
    questionIds.push(...selected.map(q => q.id));
  }

  // 전체 셔플
  const finalShuffled = questionIds.sort(() => Math.random() - 0.5);

  // 데이터베이스에 저장
  const dailySet = await prisma.dailyQuestionSet.create({
    data: {
      date,
      questionIds: JSON.stringify(finalShuffled),
    },
  });

  return dailySet;
}
