// src/app/api/leaderboard/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dailySetId = searchParams.get("dailySetId");
    const topicId = searchParams.get("topicId");

    if (!dailySetId) {
      return NextResponse.json(
        { error: "dailySetId is required" },
        { status: 400 }
      );
    }

    const leaderboard = await prisma.userScore.findMany({
      where: {
        dailySetId,
        topicId: topicId || null,
      },
      orderBy: [
        { score: "desc" },
        { completedAt: "asc" }, // 동점이면 먼저 완료한 사람 우선
      ],
      take: 100,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    const formattedLeaderboard = leaderboard.map((entry, index) => ({
      rank: index + 1,
      username: entry.user.username,
      score: entry.score,
      correctAnswers: entry.correctAnswers,
      totalQuestions: entry.totalQuestions,
      timeSpent: entry.timeSpent,
      completedAt: entry.completedAt,
    }));

    return NextResponse.json(formattedLeaderboard);
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
