// src/app/api/leaderboard/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dailySetId = searchParams.get("dailySetId");
    const topicId = searchParams.get("topicId");
    const limit = searchParams.get("limit"); // 상위 N명만 조회
    const userId = cookies().get("userId")?.value;

    if (!dailySetId) {
      return NextResponse.json(
        { error: "dailySetId is required" },
        { status: 400 }
      );
    }

    // 전체 리더보드 조회 (순위 계산용)
    const allScores = await prisma.userScore.findMany({
      where: {
        dailySetId,
        topicId: topicId || null,
      },
      orderBy: [
        { score: "desc" },
        { completedAt: "asc" }, // 동점이면 먼저 완료한 사람 우선
      ],
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // 순위 매기기
    const formattedLeaderboard = allScores.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user.id,
      username: entry.user.username,
      score: entry.score,
      correctAnswers: entry.correctAnswers,
      totalQuestions: entry.totalQuestions,
      timeSpent: entry.timeSpent,
      completedAt: entry.completedAt,
    }));

    // limit이 있으면 상위 N명만 반환
    const limitNum = limit ? parseInt(limit) : formattedLeaderboard.length;
    const topUsers = formattedLeaderboard.slice(0, limitNum);

    // 현재 사용자 순위 찾기
    let currentUserRank = null;
    if (userId) {
      const userEntry = formattedLeaderboard.find(entry => entry.userId === userId);
      if (userEntry) {
        currentUserRank = {
          rank: userEntry.rank,
          username: userEntry.username,
          score: userEntry.score,
          correctAnswers: userEntry.correctAnswers,
          totalQuestions: userEntry.totalQuestions,
        };
      }
    }

    return NextResponse.json({
      topUsers,
      currentUserRank,
      totalParticipants: formattedLeaderboard.length,
    });
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
