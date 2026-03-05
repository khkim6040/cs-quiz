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

    // 디버깅: 쿼리 파라미터 로깅
    console.log("[Leaderboard API] Query params:", { 
      dailySetId, 
      topicId, 
      topicIdRaw: searchParams.get("topicId"),
      limit, 
      userId 
    });

    // 전체 리더보드 조회 (순위 계산용)
    const whereClause = {
      dailySetId,
      topicId: topicId || null,
    };
    
    console.log("[Leaderboard API] Where clause:", whereClause);

    const orderBy = [
      { score: "desc" as const },
      { completedAt: "asc" as const },
    ];
    const takeCount = limit ? parseInt(limit) : undefined;

    const [topScores, totalParticipants] = await Promise.all([
      prisma.userScore.findMany({
        where: whereClause,
        orderBy,
        take: takeCount,
        include: {
          user: { select: { id: true, username: true } },
        },
      }),
      prisma.userScore.count({ where: whereClause }),
    ]);

    const topUsers = topScores.map((entry, index) => ({
      rank: index + 1,
      userId: entry.user.id,
      username: entry.user.username,
      score: entry.score,
      correctAnswers: entry.correctAnswers,
      totalQuestions: entry.totalQuestions,
      timeSpent: entry.timeSpent,
      completedAt: entry.completedAt,
    }));

    // 현재 사용자 순위 찾기
    let currentUserRank = null;
    if (userId) {
      // topUsers 안에 있으면 바로 사용
      const inTop = topUsers.find(entry => entry.userId === userId);
      if (inTop) {
        currentUserRank = {
          rank: inTop.rank,
          username: inTop.username,
          score: inTop.score,
          correctAnswers: inTop.correctAnswers,
          totalQuestions: inTop.totalQuestions,
        };
      } else {
        // topUsers 밖이면 별도 조회
        const userScore = await prisma.userScore.findFirst({
          where: { ...whereClause, userId },
          include: { user: { select: { username: true } } },
        });
        if (userScore) {
          const higherCount = await prisma.userScore.count({
            where: {
              ...whereClause,
              OR: [
                { score: { gt: userScore.score } },
                { score: userScore.score, completedAt: { lt: userScore.completedAt } },
              ],
            },
          });
          currentUserRank = {
            rank: higherCount + 1,
            username: userScore.user.username,
            score: userScore.score,
            correctAnswers: userScore.correctAnswers,
            totalQuestions: userScore.totalQuestions,
          };
        }
      }
    }

    return NextResponse.json({
      topUsers,
      currentUserRank,
      totalParticipants,
    });
  } catch (error) {
    console.error("Failed to get leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to get leaderboard" },
      { status: 500 }
    );
  }
}
