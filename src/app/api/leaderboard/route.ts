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

    const allScores = await prisma.userScore.findMany({
      where: whereClause,
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

    // 디버깅: 조회된 스코어 수 로깅
    console.log(`[Leaderboard API] Found ${allScores.length} scores`);
    if (allScores.length > 0) {
      console.log("[Leaderboard API] Sample score:", {
        userId: allScores[0].userId,
        dailySetId: allScores[0].dailySetId,
        topicId: allScores[0].topicId,
        score: allScores[0].score,
      });
    }

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

    console.log("[Leaderboard API] Response:", {
      topUsersCount: topUsers.length,
      currentUserRank: currentUserRank?.rank,
      totalParticipants: formattedLeaderboard.length,
    });

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
