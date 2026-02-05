// src/app/api/submit-score/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const userId = cookies().get("userId")?.value;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please login first" },
        { status: 401 }
      );
    }

    const { dailySetId, topicId, correctAnswers, totalQuestions, timeSpent } =
      await request.json();

    // 점수 계산
    const accuracy = correctAnswers / totalQuestions;
    const timeBonus = Math.max(0, 1000 - timeSpent);
    const score = Math.round(accuracy * 1000 + timeBonus * 0.1);

    // 점수 저장 또는 업데이트
    const userScore = await prisma.userScore.upsert({
      where: {
        userId_dailySetId_topicId: {
          userId,
          dailySetId,
          topicId: topicId || null,
        },
      },
      update: {
        score,
        correctAnswers,
        totalQuestions,
        timeSpent,
        completedAt: new Date(),
      },
      create: {
        userId,
        dailySetId,
        topicId: topicId || null,
        score,
        correctAnswers,
        totalQuestions,
        timeSpent,
      },
    });

    // 사용자의 순위 조회
    const rank = await prisma.userScore.count({
      where: {
        dailySetId,
        topicId: topicId || null,
        score: {
          gt: score,
        },
      },
    });

    return NextResponse.json({
      score: userScore.score,
      rank: rank + 1,
    });
  } catch (error) {
    console.error("Failed to submit score:", error);
    return NextResponse.json(
      { error: "Failed to submit score" },
      { status: 500 }
    );
  }
}
