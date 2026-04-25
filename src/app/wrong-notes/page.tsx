'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { QuestionData } from '@/types/quizTypes';

interface WrongNoteItem {
  id: string;
  questionId: string;
  status: 'ACTIVE' | 'RESOLVED';
  wrongCount: number;
  consecutiveCorrect: number;
  createdAt: string;
  resolvedAt: string | null;
  question: QuestionData & {
    topic: { id: string; name_ko: string; name_en: string };
  };
}

interface TopicCount {
  topicId: string;
  name_ko: string;
  name_en: string;
  count: number;
}

interface Summary {
  activeCount: number;
  resolvedCount: number;
  byTopic: TopicCount[];
}

const GRADUATE_THRESHOLD = 3;

export default function WrongNotesPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const l = (ko: string, en: string) => language === 'en' ? en : ko;

  const [notes, setNotes] = useState<WrongNoteItem[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    async function fetchData() {
      try {
        const [notesRes, summaryRes] = await Promise.all([
          fetch('/api/wrong-notes?status=ALL'),
          fetch('/api/wrong-notes/summary'),
        ]);
        if (notesRes.ok) setNotes(await notesRes.json());
        if (summaryRes.ok) setSummary(await summaryRes.json());
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 dark:text-gray-400 animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{t('wrongNotes.loginRequired')}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold shadow-md">
            {t('common.goHome')}
          </button>
        </div>
      </div>
    );
  }

  const filteredNotes = notes.filter((note) => {
    if (note.status !== activeTab) return false;
    if (selectedTopic && note.question.topic.id !== selectedTopic) return false;
    return true;
  });

  const canReview = activeTab === 'ACTIVE' && filteredNotes.length > 0;

  const handleReviewStart = () => {
    const topicParam = selectedTopic ? `?topicId=${selectedTopic}` : '';
    router.push(`/quiz/review${topicParam}`);
  };

  const difficultyConfig: Record<string, { tKey: string; classes: string }> = {
    EASY: { tKey: 'quiz.difficultyEasy', classes: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    MEDIUM: { tKey: 'quiz.difficultyMedium', classes: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    HARD: { tKey: 'quiz.difficultyHard', classes: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-red-400 to-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            {t('wrongNotes.title')}
          </h1>
          <button onClick={() => router.push('/')} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium">
            {t('common.homeShort')}
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('wrongNotes.tabActive')}</p>
              <p className="text-2xl md:text-3xl font-bold text-red-600">{summary.activeCount}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('wrongNotes.tabResolved')}</p>
              <p className="text-2xl md:text-3xl font-bold text-green-600">{summary.resolvedCount}</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {notes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">{t('wrongNotes.empty')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">{t('wrongNotes.emptyDesc')}</p>
            <button onClick={() => router.push('/')} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold shadow-md">
              {t('common.goHome')}
            </button>
          </div>
        )}

        {notes.length > 0 && (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-4">
              {(['ACTIVE', 'RESOLVED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    activeTab === tab
                      ? tab === 'ACTIVE'
                        ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700'
                        : 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700'
                      : 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                  }`}
                >
                  {t(`wrongNotes.tab${tab === 'ACTIVE' ? 'Active' : 'Resolved'}`)}
                </button>
              ))}
            </div>

            {/* Topic Filter */}
            {summary && summary.byTopic.length > 1 && activeTab === 'ACTIVE' && (
              <div className="flex gap-2 mb-6 flex-wrap">
                <button
                  onClick={() => setSelectedTopic(null)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                    !selectedTopic
                      ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700'
                      : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                  }`}
                >
                  {t('wrongNotes.allTopics')}
                </button>
                {summary.byTopic.map((topic) => (
                  <button
                    key={topic.topicId}
                    onClick={() => setSelectedTopic(selectedTopic === topic.topicId ? null : topic.topicId)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-all ${
                      selectedTopic === topic.topicId
                        ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700'
                        : 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:border-gray-700'
                    }`}
                  >
                    {l(topic.name_ko, topic.name_en)} ({topic.count})
                  </button>
                ))}
              </div>
            )}

            {/* Review Start Button */}
            {canReview && (
              <button
                onClick={handleReviewStart}
                className="w-full mb-6 px-6 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl hover:from-red-600 hover:to-orange-600 transition-all font-semibold shadow-md hover:shadow-lg text-lg"
              >
                {t('wrongNotes.reviewStart')} ({filteredNotes.length})
              </button>
            )}

            {/* Notes List */}
            <div className="space-y-3">
              {filteredNotes.map((note) => {
                const q = note.question;
                const diffCfg = difficultyConfig[q.difficulty] || difficultyConfig.MEDIUM;
                return (
                  <div key={note.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${diffCfg.classes}`}>
                            {t(diffCfg.tKey)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {l(q.topic.name_ko, q.topic.name_en)}
                          </span>
                        </div>
                        <p className="text-gray-800 dark:text-gray-200 line-clamp-2">
                          {l(q.question_ko, q.question_en)}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm text-red-500 font-medium">
                          {t('wrongNotes.wrongCount', { count: note.wrongCount })}
                        </p>
                        {note.status === 'ACTIVE' && (
                          <div className="flex items-center gap-1 mt-1 justify-end">
                            {Array.from({ length: GRADUATE_THRESHOLD }).map((_, i) => (
                              <div
                                key={i}
                                className={`w-2.5 h-2.5 rounded-full ${
                                  i < note.consecutiveCorrect
                                    ? 'bg-green-500'
                                    : 'bg-gray-200 dark:bg-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                        {note.status === 'RESOLVED' && (
                          <p className="text-sm text-green-600 font-medium mt-1">
                            {t('wrongNotes.graduated')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredNotes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">{t('wrongNotes.reviewEmpty')}</p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
