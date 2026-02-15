'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LeaderboardEntry, LeaderboardResponse } from '@/types/quizTypes';

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dailySetId = searchParams.get('dailySetId');
  const topicId = searchParams.get('topicId');
  const { user } = useAuth();
  const { t } = useLanguage();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!dailySetId) {
        setError('dailySetId required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ dailySetId });
        if (topicId) params.append('topicId', topicId);

        const res = await fetch(`/api/leaderboard?${params}`);
        if (!res.ok) {
          throw new Error(t('leaderboard.errorLoad'));
        }
        const data: LeaderboardResponse = await res.json();
        setLeaderboard(data.topUsers);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [dailySetId, topicId, t]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 animate-pulse">{t('leaderboard.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{t('common.error')}: {error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            {t('common.goHome')}
          </button>
        </div>
      </div>
    );
  }

  const currentUserEntry = user ? leaderboard.find(entry => entry.username === user.username) : null;
  const isCurrentUser = (username: string) => user && user.username === username;

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            {t('leaderboard.title')}
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            {t('common.homeShort')}
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-xl text-gray-600">{t('leaderboard.noParticipants')}</p>
            <p className="text-gray-500 mt-2">{t('leaderboard.beFirst')}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-orange-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold">{t('leaderboard.rankHeader')}</th>
                    <th className="px-6 py-4 text-left font-bold">{t('leaderboard.userHeader')}</th>
                    <th className="px-6 py-4 text-center font-bold">{t('leaderboard.scoreHeader')}</th>
                    <th className="px-6 py-4 text-center font-bold">{t('leaderboard.correctHeader')}</th>
                    <th className="px-6 py-4 text-center font-bold">{t('leaderboard.timeHeader')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => {
                    const isCurrent = isCurrentUser(entry.username);
                    return (
                      <tr
                        key={index}
                        className={`
                          transition-colors
                          ${isCurrent
                            ? 'bg-orange-50 border-l-4 border-orange-500 hover:bg-orange-100'
                            : entry.rank === 1
                              ? 'bg-amber-50 hover:bg-amber-100'
                              : entry.rank === 2
                                ? 'bg-gray-50 hover:bg-gray-100'
                                : entry.rank === 3
                                  ? 'bg-orange-50/50 hover:bg-orange-100/50'
                                  : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {entry.rank === 1 && (
                              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                              </div>
                            )}
                            {entry.rank === 2 && (
                              <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                              </div>
                            )}
                            {entry.rank === 3 && (
                              <div className="w-8 h-8 bg-gradient-to-br from-orange-300 to-amber-400 rounded-lg flex items-center justify-center shadow-md">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                              </div>
                            )}
                            <span className={`font-bold text-lg ${isCurrent ? 'text-orange-700' : entry.rank <= 3 ? 'text-gray-800' : 'text-gray-600'}`}>
                              #{entry.rank}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isCurrent ? 'text-orange-900 font-bold' : 'text-gray-900'}`}>
                              {entry.username}
                            </span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs rounded-full font-bold shadow-sm">
                                {t('common.me')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-bold text-lg ${isCurrent ? 'text-orange-600' : 'text-gray-800'}`}>
                            {entry.score}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={isCurrent ? 'text-orange-900 font-semibold' : 'text-gray-700'}>
                            {entry.correctAnswers} / {entry.totalQuestions}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={isCurrent ? 'text-orange-900 font-semibold' : 'text-gray-600'}>
                            {entry.timeSpent ? t('common.timeFormat', { min: Math.floor(entry.timeSpent / 60), sec: entry.timeSpent % 60 }) : '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 내 순위 요약 (100위 밖일 때) */}
        {user && currentUserEntry && currentUserEntry.rank > 100 && (
          <div className="mt-6 p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl">
            <p className="text-sm text-orange-700 mb-2 font-bold">{t('leaderboard.myRank')}</p>
            <div className="flex justify-between items-center">
              <span className="text-orange-900 font-bold text-lg">#{currentUserEntry.rank}</span>
              <span className="text-orange-800 font-semibold">{t('common.points', { score: currentUserEntry.score })}</span>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/daily')}
            className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-bold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {t('leaderboard.challengeDaily')}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 animate-pulse">&nbsp;</p>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
