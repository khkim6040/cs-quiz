import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");
    const userId = cookies().get("userId")?.value;

    // 오늘 날짜 범위 (UTC 기준)
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    // 유저별 오늘 총 풀이 수 집계
    const aggregated = await prisma.quizSession.groupBy({
      by: ["userId"],
      where: {
        completedAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      _sum: {
        solvedCount: true,
        correctCount: true,
      },
      orderBy: {
        _sum: {
          solvedCount: "desc",
        },
      },
    });

    // 유저 정보 조회
    const userIds = aggregated.map((a) => a.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    // 순위 매기기
    const ranked = aggregated.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      username: userMap.get(entry.userId) || "Unknown",
      solvedCount: entry._sum.solvedCount || 0,
      correctCount: entry._sum.correctCount || 0,
    }));

    const limitNum = limit ? parseInt(limit) : ranked.length;
    const topUsers = ranked.slice(0, limitNum);

    // 현재 사용자 순위
    let currentUserRank = null;
    if (userId) {
      const userEntry = ranked.find((entry) => entry.userId === userId);
      if (userEntry) {
        currentUserRank = {
          rank: userEntry.rank,
          username: userEntry.username,
          solvedCount: userEntry.solvedCount,
          correctCount: userEntry.correctCount,
        };
      }
    }

    return NextResponse.json({
      topUsers,
      currentUserRank,
      totalParticipants: ranked.length,
    });
  } catch (error) {
    console.error("Failed to get today's leaderboard:", error);
    return NextResponse.json(
      { error: "Failed to get today's leaderboard" },
      { status: 500 }
    );
  }
}
