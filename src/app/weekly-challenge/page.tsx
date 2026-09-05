'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/skeleton/Skeleton';

interface ChallengeInfo {
  topicId: string;
  topic: { name_ko: string; name_en: string };
  remainingDays: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  bestAccuracy: number;
  totalSolved: number;
}

export default function WeeklyChallengePage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<ChallengeInfo | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/weekly-challenge').then((r) => r.json()),
      fetch('/api/weekly-challenge/leaderboard').then((r) => r.json()),
    ])
      .then(([challengeData, lbData]) => {
        setChallenge(challengeData);
        setLeaderboard(lbData.leaderboard || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-10 w-40 mb-8" />
          <Skeleton className="h-20 w-full rounded-2xl mb-6" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl mb-3" />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            {t('weeklyChallenge.title')}
          </h1>
          <button onClick={() => router.push('/')} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium">
            {t('common.homeShort')}
          </button>
        </div>

        {challenge && (
          <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-2xl shadow-lg mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200 text-sm font-medium mb-1">{t('weeklyChallenge.banner')}</p>
                <p className="text-2xl font-bold">
                  {language === 'en' ? challenge.topic.name_en : challenge.topic.name_ko}
                </p>
              </div>
              <div className="text-right">
                <p className="text-purple-200 text-sm">{t('weeklyChallenge.remaining', { count: challenge.remainingDays })}</p>
                <button
                  onClick={() => router.push(`/quiz/${challenge.topicId}`)}
                  className="mt-2 px-4 py-2 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  {t('weeklyChallenge.goSolve')}
                </button>
              </div>
            </div>
          </div>
        )}

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <p className="text-xl text-gray-600 dark:text-gray-400">{t('weeklyChallenge.noParticipants')}</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">{t('weeklyChallenge.beFirst')}</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-[60px_1fr_80px_80px] gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm">
              <span>{t('weeklyChallenge.rank')}</span>
              <span>{t('weeklyChallenge.user')}</span>
              <span className="text-center">{t('weeklyChallenge.accuracy')}</span>
              <span className="text-center">{t('weeklyChallenge.solved')}</span>
            </div>
            {leaderboard.map((entry) => {
              const isCurrent = user && user.username === entry.username;
              return (
                <div
                  key={entry.rank}
                  className={`grid grid-cols-[60px_1fr_80px_80px] gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-700 ${isCurrent ? 'bg-purple-50 dark:bg-purple-900/20' : ''}`}
                >
                  <span className="font-bold text-gray-700 dark:text-gray-300">#{entry.rank}</span>
                  <span className={`font-medium ${isCurrent ? 'text-purple-700 dark:text-purple-400 font-bold' : 'text-gray-900 dark:text-gray-200'}`}>
                    {entry.username}
                    {isCurrent && <span className="ml-2 px-1.5 py-0.5 bg-purple-500 text-white text-xs rounded-full">{t('common.me')}</span>}
                  </span>
                  <span className="text-center font-semibold text-gray-800 dark:text-gray-200">{entry.bestAccuracy}%</span>
                  <span className="text-center text-gray-600 dark:text-gray-400">{entry.totalSolved}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
