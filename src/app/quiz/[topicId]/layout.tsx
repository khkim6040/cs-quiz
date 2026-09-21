import type { Metadata } from 'next';
import prisma from '@/lib/prisma';

export async function generateMetadata({ params }: { params: { topicId: string } }): Promise<Metadata> {
  const topic = await prisma.topic.findUnique({
    where: { id: params.topicId },
    select: { name_ko: true, name_en: true },
  });
  if (!topic) return {};
  return {
    title: `${topic.name_ko} 퀴즈`,
    description: `${topic.name_ko}(${topic.name_en}) 핵심 개념을 4지선다 퀴즈로 점검하세요. 힌트와 해설 제공.`,
  };
}

export default function TopicQuizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
