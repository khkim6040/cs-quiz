import type { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { orderAnswerOptions } from '@/lib/question';
import { parseSearchParams, buildSearchWhere, keywordPattern, SEARCH_PAGE_SIZE } from '@/lib/search';
import { TopicId } from '@/types/quizTypes';
import SearchContent, { SearchResult } from '@/components/SearchContent';

export const metadata: Metadata = {
  title: '문제 검색',
  description: '키워드, 주제, 난이도로 CS 퀴즈 문제를 찾아 바로 풀어보세요.',
  robots: { index: false },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const params = parseSearchParams(searchParams);
  const where = buildSearchWhere(params);

  if (where && params.q) {
    const pattern = keywordPattern(params.q);
    // ponytail: 검색마다 본문 순차 스캔(현재 ~1천 문제), 수만 개를 넘으면 공백 제거 식에 pg_trgm GIN 인덱스 추가
    const matches = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Question"
      WHERE regexp_replace(text_ko, '[[:space:]]', '', 'g') ILIKE ${pattern}
         OR regexp_replace(text_en, '[[:space:]]', '', 'g') ILIKE ${pattern}`;
    where.id = { in: matches.map((m) => m.id) };
  }

  const [topics, total, rows] = await Promise.all([
    prisma.topic.findMany({ select: { id: true, name_ko: true, name_en: true } }),
    where ? prisma.question.count({ where }) : 0,
    where
      ? prisma.question.findMany({
          where,
          include: { answerOptions: true, topic: { select: { name_ko: true, name_en: true } } },
          orderBy: [{ topicId: 'asc' }, { id: 'asc' }],
          skip: (params.page - 1) * SEARCH_PAGE_SIZE,
          take: SEARCH_PAGE_SIZE,
        })
      : [],
  ]);

  const results: SearchResult[] = rows.map((q) => ({
    id: q.id,
    topicId: q.topicId as TopicId,
    topicName_ko: q.topic.name_ko,
    topicName_en: q.topic.name_en || q.topic.name_ko,
    question_ko: q.text_ko,
    question_en: q.text_en || q.text_ko,
    hint_ko: q.hint_ko,
    hint_en: q.hint_en || q.hint_ko,
    difficulty: q.difficulty,
    answerOptions: orderAnswerOptions(
      q.answerOptions.map((o) => ({
        id: o.id,
        text_ko: o.text_ko,
        text_en: o.text_en || o.text_ko,
        rationale_ko: o.rationale_ko,
        rationale_en: o.rationale_en || o.rationale_ko,
        isCorrect: o.isCorrect,
      }))
    ),
  }));

  return (
    <SearchContent
      topics={topics}
      params={params}
      results={where ? results : null}
      total={total}
    />
  );
}
