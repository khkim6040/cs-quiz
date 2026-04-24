import { unstable_cache } from 'next/cache';
import prisma from '@/lib/prisma';
import { getTodayInKST } from '@/lib/timezone';
import { Topic } from '@/types/quizTypes';
import HomeContent from '@/components/HomeContent';

function getHomepageData() {
  const todayKey = getTodayInKST().toISOString().slice(0, 10);
  return unstable_cache(
    async () => {
      const today = getTodayInKST();
      const [dbTopics, dailySet, diffGroups] = await Promise.all([
        prisma.topic.findMany({
          include: { _count: { select: { questions: true } } },
        }),
        prisma.dailyQuestionSet.findUnique({
          where: { date: today },
          select: { id: true },
        }),
        prisma.question.groupBy({
          by: ['topicId', 'difficulty'],
          _count: { _all: true },
        }),
      ]);
      return { dbTopics, dailySet, diffGroups };
    },
    [`homepage-data-${todayKey}`],
    { revalidate: 3600 }
  )();
}

export default async function HomePage() {
  let topics: Topic[] = [];
  let dailySetId: string | null = null;

  try {
    const { dbTopics, dailySet, diffGroups } = await getHomepageData();

    // Build per-topic difficulty counts
    const diffMap = new Map<string, { EASY: number; MEDIUM: number; HARD: number }>();
    for (const g of diffGroups) {
      if (!diffMap.has(g.topicId)) {
        diffMap.set(g.topicId, { EASY: 0, MEDIUM: 0, HARD: 0 });
      }
      diffMap.get(g.topicId)![g.difficulty] = g._count._all;
    }

    topics = dbTopics.map((topic) => ({
      id: topic.id as Topic['id'],
      name_ko: topic.name_ko,
      name_en: topic.name_en,
      questionCount: topic._count.questions,
      difficultyCounts: diffMap.get(topic.id) ?? { EASY: 0, MEDIUM: 0, HARD: 0 },
    }));

    dailySetId = dailySet?.id ?? null;
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
  }

  return <HomeContent topics={topics} dailySetId={dailySetId} />;
}
