'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import QuestionComponent from '@/components/QuestionComponent';
import { QuestionData } from '@/types/quizTypes';
import { SEARCH_PAGE_SIZE, SearchParams } from '@/lib/search';

export type SearchResult = QuestionData & { topicName_ko: string; topicName_en: string };

interface SearchContentProps {
  topics: { id: string; name_ko: string; name_en: string }[];
  params: SearchParams;
  results: SearchResult[] | null; // null = 아직 검색 전
  total: number;
}

const DIFFICULTY_OPTIONS = [
  ['EASY', 'quiz.difficultyEasy'],
  ['MEDIUM', 'quiz.difficultyMedium'],
  ['HARD', 'quiz.difficultyHard'],
] as const;

const fieldClass =
  'min-w-0 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-orange-500 focus:outline-none transition-colors';

export default function SearchContent({ topics, params, results, total }: SearchContentProps) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const l = (ko: string, en: string) => (language === 'en' ? en : ko);
  const [isPending, startTransition] = useTransition();
  const [openId, setOpenId] = useState<string | null>(null);

  // 검색 조건은 URL에만 둔다 → 뒤로가기/공유가 그대로 동작
  const navigate = (next: Partial<SearchParams>) => {
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...params, page: 1, ...next })) {
      const v = String(value).trim();
      if (v && !(key === 'page' && v === '1')) qs.set(key, v);
    }
    setOpenId(null);
    startTransition(() => router.push(`/search?${qs}`));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    navigate(Object.fromEntries(new FormData(e.currentTarget)) as Partial<SearchParams>);
  };

  const submitOnChange = (e: React.ChangeEvent<HTMLSelectElement>) => e.currentTarget.form?.requestSubmit();
  const totalPages = Math.ceil(total / SEARCH_PAGE_SIZE);

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          {t('search.title')}
        </h1>

        {/* key: 뒤로가기 등으로 URL이 바뀌면 입력값도 URL에 맞춰 다시 채운다 */}
        <form
          key={`${params.q}|${params.topic}|${params.difficulty}`}
          role="search"
          onSubmit={handleSubmit}
          className="space-y-2 mb-6"
        >
          <div className="flex gap-2">
            <input
              type="search"
              name="q"
              defaultValue={params.q}
              placeholder={t('search.placeholder')}
              aria-label={t('search.title')}
              maxLength={100}
              autoFocus={results === null}
              className={`${fieldClass} flex-1 px-4 py-3`}
            />
            <button
              type="submit"
              className="px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl font-semibold shadow-md hover:from-orange-600 hover:to-amber-600 transition-all focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              {t('search.submit')}
            </button>
          </div>
          <div className="flex gap-2">
            <select
              name="topic"
              defaultValue={params.topic}
              onChange={submitOnChange}
              aria-label={t('search.allTopics')}
              className={`${fieldClass} flex-1 px-3 py-2 text-sm`}
            >
              <option value="">{t('search.allTopics')}</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {l(topic.name_ko, topic.name_en)}
                </option>
              ))}
            </select>
            <select
              name="difficulty"
              defaultValue={params.difficulty}
              onChange={submitOnChange}
              aria-label={t('search.allDifficulties')}
              className={`${fieldClass} flex-1 px-3 py-2 text-sm`}
            >
              <option value="">{t('search.allDifficulties')}</option>
              {DIFFICULTY_OPTIONS.map(([value, tKey]) => (
                <option key={value} value={value}>
                  {t(tKey)}
                </option>
              ))}
            </select>
          </div>
        </form>

        <div aria-busy={isPending} className={`transition-opacity ${isPending ? 'opacity-50' : ''}`}>
          {results === null ? (
            <p className="text-center py-16 text-gray-500 dark:text-gray-400">{t('search.prompt')}</p>
          ) : results.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">{t('search.noResults')}</p>
              <p className="text-sm text-gray-500">{t('search.noResultsDesc')}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {t('search.resultCount', { count: total })}
              </p>
              <ul className="space-y-3">
                {results.map((q) => {
                  const open = openId === q.id;
                  return (
                    <li
                      key={q.id}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : q.id)}
                        aria-expanded={open}
                        className="w-full text-left p-4 flex items-start justify-between gap-3 rounded-xl focus-visible:ring-2 focus-visible:ring-orange-500"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            {l(q.topicName_ko, q.topicName_en)}
                          </p>
                          {!open && (
                            <p className="text-gray-800 dark:text-gray-200 line-clamp-2">
                              {l(q.question_ko, q.question_en)}
                            </p>
                          )}
                        </div>
                        <svg
                          className={`w-5 h-5 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {open && (
                        <div className="px-4 -mt-6">
                          <QuestionComponent questionData={q} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-4 mt-6">
                  <button
                    type="button"
                    disabled={params.page <= 1}
                    onClick={() => navigate({ page: params.page - 1 })}
                    className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-500 disabled:opacity-40 disabled:hover:border-gray-200 transition-colors"
                  >
                    {t('search.prev')}
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {params.page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={params.page >= totalPages}
                    onClick={() => navigate({ page: params.page + 1 })}
                    className="px-4 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-500 disabled:opacity-40 disabled:hover:border-gray-200 transition-colors"
                  >
                    {t('search.next')}
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
