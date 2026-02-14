// scripts/generate-daily-questions.ts
/**
 * 데일리 문제 세트를 미리 생성하는 배치 스크립트
 * 매일 자정에 실행하여 다음 날의 문제를 미리 준비합니다.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fisher-Yates 셔플 알고리즘 (날짜 기반 시드)
function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let random = seed;
  
  // 간단한 선형 합동 생성기 (LCG)
  const lcg = () => {
    random = (random * 1103515245 + 12345) % 2147483648;
    return random / 2147483648;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  
  return arr;
}

async function generateDailySet(date: Date, questionCount: number = 20) {
  // 날짜를 시드로 사용 (YYYYMMDD 형식)
  const seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
  
  // ID만 가져오기 (효율적)
  const allQuestions = await prisma.question.findMany({
    select: { id: true },
  });

  if (allQuestions.length === 0) {
    throw new Error('No questions found in database');
  }

  // 전체 문제를 섞어서 지정된 개수만큼 선택
  const shuffled = seededShuffle(allQuestions, seed);
  const selected = shuffled.slice(0, Math.min(questionCount, allQuestions.length));
  const questionIds = selected.map(q => q.id);

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
  const questionCount = args.length > 1 ? parseInt(args[1], 10) : 20;

  if (isNaN(daysAhead) || daysAhead < 0) {
    console.error('Invalid days ahead parameter. Usage: npm run generate-daily [daysAhead] [questionCount]');
    process.exit(1);
  }

  console.log(`Generating daily question sets for ${daysAhead} day(s) ahead with ${questionCount} questions each...`);

  const results = [];
  
  for (let i = 0; i < daysAhead; i++) {
    const targetDate = new Date();
    targetDate.setUTCHours(0, 0, 0, 0);
    targetDate.setDate(targetDate.getDate() + i);

    try {
      // 이미 존재하는지 확인
      const existing = await prisma.dailyQuestionSet.findUnique({
        where: { date: targetDate },
      });

      if (existing) {
        console.log(`✓ Daily set for ${targetDate.toISOString().split('T')[0]} already exists (ID: ${existing.id})`);
        results.push({ date: targetDate, status: 'exists', id: existing.id });
      } else {
        const dailySet = await generateDailySet(targetDate, questionCount);
        console.log(`✓ Created daily set for ${targetDate.toISOString().split('T')[0]} (ID: ${dailySet.id})`);
        results.push({ date: targetDate, status: 'created', id: dailySet.id });
      }
    } catch (error) {
      console.error(`✗ Failed to generate set for ${targetDate.toISOString().split('T')[0]}:`, error);
      results.push({ date: targetDate, status: 'error', error });
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Total: ${results.length}`);
  console.log(`Created: ${results.filter(r => r.status === 'created').length}`);
  console.log(`Already exists: ${results.filter(r => r.status === 'exists').length}`);
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
