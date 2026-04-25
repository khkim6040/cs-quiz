import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { toKST } from "@/lib/timezone";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userId = cookies().get("userId")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const response = NextResponse.json({ error: "User not found" }, { status: 401 });
      response.cookies.delete("userId");
      return response;
    }

    // 1. Topic accuracy: group by topicId
    const byTopic = await prisma.quizSession.groupBy({
      by: ["topicId"],
      where: { userId },
      _sum: { solvedCount: true, correctCount: true, timeSpent: true },
    });

    // Get topic names
    const topicIds = byTopic.map((t) => t.topicId).filter((id): id is string => id !== null);
    const topics = await prisma.topic.findMany({
      where: { id: { in: topicIds } },
      select: { id: true, name_ko: true, name_en: true },
    });
    const topicMap = new Map(topics.map((t) => [t.id, t]));

    const topicStats = byTopic
      .filter((t) => t.topicId !== null)
      .map((t) => {
        const topic = topicMap.get(t.topicId!);
        const solved = t._sum.solvedCount || 0;
        const correct = t._sum.correctCount || 0;
        return {
          topicId: t.topicId!,
          name_ko: topic?.name_ko || t.topicId!,
          name_en: topic?.name_en || t.topicId!,
          solved,
          correct,
          accuracy: solved > 0 ? Math.round((correct / solved) * 100) : 0,
        };
      })
      .sort((a, b) => b.solved - a.solved);

    // 2. Overall summary (all sessions, including topicId=null)
    const overallTotals = await prisma.quizSession.aggregate({
      where: { userId },
      _sum: { solvedCount: true, correctCount: true, timeSpent: true },
    });

    const totalSolved = overallTotals._sum.solvedCount || 0;
    const totalCorrect = overallTotals._sum.correctCount || 0;
    const totalTime = overallTotals._sum.timeSpent || 0;

    // 3. Daily trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const recentSessions = await prisma.quizSession.findMany({
      where: { userId, completedAt: { gte: thirtyDaysAgo } },
      select: { solvedCount: true, correctCount: true, completedAt: true },
      orderBy: { completedAt: "asc" },
    });

    const dailyMap = new Map<string, { solved: number; correct: number }>();
    for (const session of recentSessions) {
      const dateKey = toKST(session.completedAt).toISOString().slice(0, 10);
      const existing = dailyMap.get(dateKey) || { solved: 0, correct: 0 };
      existing.solved += session.solvedCount;
      existing.correct += session.correctCount;
      dailyMap.set(dateKey, existing);
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, solved: data.solved, correct: data.correct }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 4. Weak areas (bottom 3 by accuracy, min 5 solved)
    const weakAreas = topicStats
      .filter((t) => t.solved >= 5)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 3);

    return NextResponse.json({
      summary: {
        totalSolved,
        totalCorrect,
        accuracy: totalSolved > 0 ? Math.round((totalCorrect / totalSolved) * 100) : 0,
        totalTimeSeconds: totalTime,
      },
      topicStats,
      dailyTrend,
      weakAreas,
    });
  } catch (error) {
    console.error("Failed to get stats:", error);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
