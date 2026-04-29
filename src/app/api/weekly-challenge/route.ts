import { NextResponse } from 'next/server';
import { getCurrentChallenge } from '@/lib/weekly-challenge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { challenge, weekStart, weekEnd, remainingDays } = await getCurrentChallenge();
    return NextResponse.json({
      topicId: challenge.topicId,
      topic: challenge.topic,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      remainingDays,
    });
  } catch (error) {
    console.error('Failed to get weekly challenge:', error);
    return NextResponse.json({ error: 'Failed to get weekly challenge' }, { status: 500 });
  }
}
