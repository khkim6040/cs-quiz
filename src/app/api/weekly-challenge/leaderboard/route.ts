import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentChallenge } from '@/lib/weekly-challenge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { challenge, weekStart, weekEnd } = await getCurrentChallenge();

    const sessions = await prisma.quizSession.findMany({
      where: {
        topicId: challenge.topicId,
        quizType: 'topic',
        completedAt: { gte: weekStart, lt: weekEnd },
        solvedCount: { gt: 0 },
      },
      select: {
        userId: true,
        solvedCount: true,
        correctCount: true,
        user: { select: { username: true } },
      },
    });

    const userBest = new Map<string, { username: string; bestAccuracy: number; bestSolvedCount: number; totalSolved: number }>();
    for (const s of sessions) {
      const accuracy = Math.round((s.correctCount / s.solvedCount) * 100);
      const existing = userBest.get(s.userId);
      if (!existing) {
        userBest.set(s.userId, {
          username: s.user.username,
          bestAccuracy: accuracy,
          bestSolvedCount: s.solvedCount,
          totalSolved: s.solvedCount,
        });
      } else {
        existing.totalSolved += s.solvedCount;
        if (accuracy > existing.bestAccuracy || (accuracy === existing.bestAccuracy && s.solvedCount > existing.bestSolvedCount)) {
          existing.bestAccuracy = accuracy;
          existing.bestSolvedCount = s.solvedCount;
          existing.username = s.user.username;
        }
      }
    }

    const leaderboard = Array.from(userBest.values())
      .sort((a, b) => b.bestAccuracy - a.bestAccuracy || b.totalSolved - a.totalSolved)
      .slice(0, 50)
      .map((entry, i) => ({ rank: i + 1, ...entry }));

    return NextResponse.json({ topicId: challenge.topicId, leaderboard });
  } catch (error) {
    console.error('Failed to get weekly challenge leaderboard:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
