// scripts/generate-daily-questions.ts
/**
 * 데일리 문제 세트를 미리 생성하는 배치 스크립트
 * 매일 자정에 실행하여 다음 날의 문제를 미리 준비합니다.
 */

import { PrismaClient } from '@prisma/client';
import { getTodayInKST } from '../src/lib/timezone';
import { seededShuffle, dateToSeed } from '../src/lib/shuffle';

const prisma = new PrismaClient();

async function generateDailySet(date: Date, questionCount: number = 15) {
  // 날짜를 시드로 사용 (YYYYMMDD 형식)
  const seed = dateToSeed(date);
  
  const MAX_PER_TOPIC = 3;

  const allQuestions = await prisma.question.findMany({
    select: { id: true, topicId: true },
  });

  if (allQuestions.length === 0) {
    throw new Error('No questions found in database');
  }

  // 전체 문제를 섞은 뒤 토픽당 최대 3문제까지만 선택
  const shuffled = seededShuffle(allQuestions, seed);
  const topicCount: Record<string, number> = {};
  const questionIds: string[] = [];

  for (const q of shuffled) {
    if (questionIds.length >= questionCount) break;
    const count = topicCount[q.topicId] || 0;
    if (count >= MAX_PER_TOPIC) continue;
    topicCount[q.topicId] = count + 1;
    questionIds.push(q.id);
  }

  console.log(`Selected ${questionIds.length} questions for ${date.toISOString().split('T')[0]}`);

  return await prisma.dailyQuestionSet.create({
    data: {
      date,
      questionIds,
    },
  });
}

async function main() {
  const args = process.argv.slice(2);
  const daysAhead = args.length > 0 ? parseInt(args[0], 10) : 1;
  const questionCount = args.length > 1 ? parseInt(args[1], 10) : 15;
  const startOffset = args.length > 2 ? parseInt(args[2], 10) : 0;

  if (isNaN(daysAhead) || daysAhead < 0) {
    console.error('Invalid days ahead parameter. Usage: npm run generate-daily [daysAhead] [questionCount] [startOffset]');
    process.exit(1);
  }

  if (isNaN(startOffset) || startOffset < 0) {
    console.error('Invalid start offset parameter. Must be a non-negative integer.');
    process.exit(1);
  }

  console.log(`Generating daily question sets for ${daysAhead} day(s) starting from +${startOffset} day(s) with ${questionCount} questions each...`);

  const results: Array<{ date: Date; status: string; id?: string; error?: unknown }> = [];

  for (let i = 0; i < daysAhead; i++) {
    // 한국 시간 기준으로 날짜 계산
    const today = getTodayInKST();
    const targetDate = new Date(today);
    targetDate.setUTCDate(targetDate.getUTCDate() + startOffset + i);

    console.log(`Processing date: ${targetDate.toISOString().split('T')[0]} (KST-based)`);

    try {
      // 기존 세트가 있으면 삭제 후 재생성
      const existing = await prisma.dailyQuestionSet.findUnique({
        where: { date: targetDate },
      });

      if (existing) {
        await prisma.dailyQuestionSet.delete({ where: { id: existing.id } });
        console.log(`  Deleted existing set (ID: ${existing.id})`);
      }

      const dailySet = await generateDailySet(targetDate, questionCount);
      console.log(`✓ Created daily set for ${targetDate.toISOString().split('T')[0]} (ID: ${dailySet.id})`);
      results.push({ date: targetDate, status: 'created', id: dailySet.id });
    } catch (error) {
      console.error(`✗ Failed to generate set for ${targetDate.toISOString().split('T')[0]}:`, error);
      results.push({ date: targetDate, status: 'error', error });
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total: ${results.length}`);
  console.log(`Created: ${results.filter(r => r.status === 'created').length}`);
  console.log(`Errors: ${results.filter(r => r.status === 'error').length}`);
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
