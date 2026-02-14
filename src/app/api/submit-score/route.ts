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

    console.log("[Submit Score API] Request data:", {
      userId,
      dailySetId,
      topicId,
      topicIdType: typeof topicId,
      correctAnswers,
      totalQuestions,
      timeSpent,
    });

    // 점수 계산
    const accuracy = correctAnswers / totalQuestions;
    const timeBonus = Math.max(0, 1000 - timeSpent);
    const score = Math.round(accuracy * 1000 + timeBonus * 0.1);

    // topicId가 null인 경우 명시적으로 null 사용
    const topicIdValue = topicId ? topicId : null;

    console.log("[Submit Score API] Processed topicId:", {
      original: topicId,
      processed: topicIdValue,
    });

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

    console.log("[Submit Score API] Existing score:", existingScore ? "found" : "not found");

    let userScore;
    if (existingScore) {
      // 업데이트
      console.log("[Submit Score API] Updating existing score");
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
      console.log("[Submit Score API] Creating new score");
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

    console.log("[Submit Score API] Saved score:", {
      id: userScore.id,
      userId: userScore.userId,
      dailySetId: userScore.dailySetId,
      topicId: userScore.topicId,
      score: userScore.score,
    });

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
