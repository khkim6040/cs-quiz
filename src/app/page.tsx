import prisma from '@/lib/prisma';
import { getTodayInKST } from '@/lib/timezone';
import { Topic } from '@/types/quizTypes';
import HomeContent from '@/components/HomeContent';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let topics: Topic[] = [];
  let dailySetId: string | null = null;

  try {
    const [dbTopics, dailySet] = await Promise.all([
      prisma.topic.findMany({
        include: { _count: { select: { questions: true } } },
      }),
      prisma.dailyQuestionSet.findUnique({
        where: { date: getTodayInKST() },
        select: { id: true },
      }),
    ]);

    topics = dbTopics.map((topic) => ({
      id: topic.id as Topic['id'],
      name_ko: topic.name_ko,
      name_en: topic.name_en,
      questionCount: topic._count.questions,
    }));

    dailySetId = dailySet?.id ?? null;
  } catch (error) {
    console.error('Failed to fetch homepage data:', error);
  }

  return <HomeContent topics={topics} dailySetId={dailySetId} />;
}
