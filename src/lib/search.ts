import type { Prisma } from '@prisma/client';

export const SEARCH_PAGE_SIZE = 20;
const MAX_QUERY_LENGTH = 100;
const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

export interface SearchParams {
  q: string;
  topic: string;
  difficulty: (typeof DIFFICULTIES)[number] | '';
  page: number;
}

type RawSearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export function parseSearchParams(raw: RawSearchParams): SearchParams {
  const difficulty = first(raw.difficulty);
  return {
    q: first(raw.q).trim().slice(0, MAX_QUERY_LENGTH),
    topic: first(raw.topic).trim(),
    difficulty: DIFFICULTIES.find((d) => d === difficulty) ?? '',
    page: Math.max(1, parseInt(first(raw.page), 10) || 1),
  };
}

/**
 * 주제·난이도 조건. 검색 조건이 하나도 없으면 null (전체 목록을 노출하지 않음).
 * 키워드는 공백 무시 비교가 필요해 Prisma 조건이 아닌 keywordPattern + raw SQL로 거른다.
 */
export function buildSearchWhere({ q, topic, difficulty }: SearchParams): Prisma.QuestionWhereInput | null {
  if (!q && !topic && !difficulty) return null;
  return {
    ...(topic ? { topicId: topic } : {}),
    ...(difficulty ? { difficulty } : {}),
  };
}

/**
 * 공백을 지운 본문과 비교할 ILIKE 패턴. '교착상태'와 '교착 상태'를 같은 검색어로 취급한다.
 * LIKE 와일드카드는 이스케이프해 '100%', 'snake_case'를 글자 그대로 찾는다.
 */
export function keywordPattern(q: string): string {
  return `%${q.replace(/\s+/g, '').replace(/[\\%_]/g, '\\$&')}%`;
}
