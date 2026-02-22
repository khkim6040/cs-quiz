'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ConceptItem {
  name: string;
  questionCount: number;
}

interface ConceptGroup {
  topicId: string;
  topicName: string;
  concepts: ConceptItem[];
}

interface ConceptsResponse {
  groups: ConceptGroup[];
  totalTopics: number;
  totalConcepts: number;
  hasMore: boolean;
}

const BATCH_SIZE = 3;

export default function ConceptShowcase() {
  const { t, language } = useLanguage();
  const [groups, setGroups] = useState<ConceptGroup[]>([]);
  const [totalTopics, setTotalTopics] = useState(0);
  const [totalConcepts, setTotalConcepts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const isFetchingRef = useRef(false);

  const fetchConcepts = useCallback(async (reset = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);

    const currentOffset = reset ? 0 : offsetRef.current;
    let moreAvailable = false;

    try {
      const res = await fetch(
        `/api/concepts?lang=${language}&offset=${currentOffset}&limit=${BATCH_SIZE}`
      );
      if (!res.ok) throw new Error('Failed to fetch');
      const data: ConceptsResponse = await res.json();

      if (reset) {
        setGroups(data.groups);
      } else {
        setGroups((prev) => [...prev, ...data.groups]);
      }

      setTotalTopics(data.totalTopics);
      setTotalConcepts(data.totalConcepts);
      setHasMore(data.hasMore);
      offsetRef.current = currentOffset + BATCH_SIZE;
      moreAvailable = data.hasMore;
    } catch (err) {
      console.error('Failed to load concepts:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      isFetchingRef.current = false;

      // Re-check: sentinel이 여전히 뷰포트에 보이면 다음 배치도 로드
      if (moreAvailable) {
        requestAnimationFrame(() => {
          const sentinel = sentinelRef.current;
          if (sentinel) {
            const rect = sentinel.getBoundingClientRect();
            const inView = rect.top < window.innerHeight + 200;
            if (inView && !isFetchingRef.current) {
              fetchConcepts();
            }
          }
        });
      }
    }
  }, [language]);

  // Reset on language change
  useEffect(() => {
    offsetRef.current = 0;
    setGroups([]);
    setInitialLoading(true);
    setHasMore(true);
    fetchConcepts(true);
  }, [language, fetchConcepts]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (initialLoading) return; // sentinel이 DOM에 없는 skeleton 상태에선 스킵
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingRef.current) {
          fetchConcepts();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, fetchConcepts, initialLoading]);

  if (initialLoading) {
    return (
      <section className="w-full max-w-4xl mt-12">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto" />
          <div className="h-5 bg-gray-100 rounded w-32 mx-auto" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-50 rounded-xl p-6 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-36" />
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((j) => (
                  <div key={j} className="h-8 bg-gray-200 rounded-full w-20" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (totalConcepts === 0) return null;

  return (
    <section className="w-full max-w-4xl mt-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t('showcase.title')}
        </h2>
        <p className="text-gray-500">
          {t('showcase.subtitle', {
            topics: totalTopics,
            concepts: totalConcepts,
          })}
        </p>
      </div>

      {/* Topic Groups */}
      <div className="space-y-4">
        {groups.map((group, groupIndex) => (
          <div
            key={group.topicId}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 animate-fadeSlideUp"
            style={{ animationDelay: `${(groupIndex % BATCH_SIZE) * 100}ms` }}
          >
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gradient-to-br from-orange-400 to-amber-500" />
              {group.topicName}
              <span className="text-sm font-normal text-gray-400 ml-1">
                {group.concepts.length}
              </span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {group.concepts.map((concept, i) => (
                <span
                  key={concept.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gradient-to-br from-orange-50 to-amber-50 text-gray-700 rounded-full border border-orange-100 hover:border-orange-300 hover:shadow-sm transition-all duration-200 animate-fadeSlideUp"
                  style={{ animationDelay: `${(groupIndex % BATCH_SIZE) * 100 + i * 30}ms` }}
                >
                  {concept.name}
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 text-xs font-medium text-orange-600 bg-orange-100 rounded-full">
                    {concept.questionCount}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && !initialLoading && (
        <div className="text-center py-6 text-gray-400 text-sm animate-pulse">
          {t('showcase.loading')}
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {hasMore && <div ref={sentinelRef} className="h-4" />}
    </section>
  );
}
