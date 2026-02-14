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

    // topicId가 null인 경우 명시적으로 null 사용
    const topicIdValue = topicId ? topicId : null;

    // 기존 점수 찾기
    // topicId가 null이면 일일 퀴즈이므로 userId_dailySetId 제약 사용
    // topicId가 있으면 토픽별 퀴즈이므로 userId_dailySetId_topicId 제약 사용
    const existingScore = topicIdValue
      ? await prisma.userScore.findUnique({
        where: {
          userId_dailySetId_topicId: {
            userId,
            dailySetId,
            topicId: topicIdValue,
          },
        },
      })
      : await prisma.userScore.findUnique({
        where: {
          userId_dailySetId: {
            userId,
            dailySetId,
          },
        },
      });

    let userScore;
    if (existingScore) {
      // 업데이트
      userScore = await prisma.userScore.update({
        where: {
          id: existingScore.id,
        },
        data: {
          score,
          correctAnswers,
          totalQuestions,
          timeSpent,
          completedAt: new Date(),
        },
      });
    } else {
      // 생성
      userScore = await prisma.userScore.create({
        data: {
          userId,
          dailySetId,
          topicId: topicIdValue,
          score,
          correctAnswers,
          totalQuestions,
          timeSpent,
        },
      });
    }

    // 사용자의 순위 조회
    const rank = await prisma.userScore.count({
      where: {
        dailySetId,
        topicId: topicIdValue,
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
