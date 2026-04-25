'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';

interface TopicStat {
  topicId: string;
  name_ko: string;
  name_en: string;
  solved: number;
  correct: number;
  accuracy: number;
}

interface DailyTrend {
  date: string;
  solved: number;
  correct: number;
}

interface StatsData {
  summary: {
    totalSolved: number;
    totalCorrect: number;
    accuracy: number;
    totalTimeSeconds: number;
  };
  topicStats: TopicStat[];
  dailyTrend: DailyTrend[];
  weakAreas: TopicStat[];
}

function formatTime(seconds: number, t: (key: string, params?: Record<string, string | number>) => string): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return t('stats.hours', { h, m });
  return t('stats.minutes', { m });
}

export default function StatsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const json = await res.json();
        setData(json);
      } catch {
        setError(t('common.error'));
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user, authLoading, t]);

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
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{t('stats.loginRequired')}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold shadow-md"
          >
            {t('common.goHome')}
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold shadow-md">
            {t('common.goHome')}
          </button>
        </div>
      </div>
    );
  }

  if (!data || data.summary.totalSolved === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">{t('stats.noData')}</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold shadow-md"
          >
            {t('stats.startQuiz')}
          </button>
        </div>
      </div>
    );
  }

  const topicChartData = data.topicStats.map((t) => ({
    name: language === 'ko' ? t.name_ko : t.name_en,
    accuracy: t.accuracy,
    solved: t.solved,
  }));

  const trendChartData = data.dailyTrend.map((d) => ({
    date: d.date.slice(5), // "MM-DD"
    solved: d.solved,
    correct: d.correct,
  }));

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 md:gap-3">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            {t('stats.title')}
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors font-medium"
          >
            {t('common.homeShort')}
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('stats.totalSolved')}</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{data.summary.totalSolved}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('stats.totalCorrect')}</p>
            <p className="text-2xl md:text-3xl font-bold text-orange-600">{data.summary.accuracy}%</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('stats.totalTime')}</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">{formatTime(data.summary.totalTimeSeconds, t)}</p>
          </div>
        </div>

        {/* Topic Accuracy Bar Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700 mb-8">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">{t('stats.topicAccuracy')}</h2>
          <div className="w-full h-64 md:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topicChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [`${value}%`, t('stats.totalCorrect')]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar dataKey="accuracy" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weak Areas */}
        {data.weakAreas.length > 0 && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-4 md:p-6 shadow-md border border-red-100 dark:border-red-800/30 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t('stats.weakAreas')}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('stats.weakAreasDesc')}</p>
            <div className="space-y-3">
              {data.weakAreas.map((topic) => (
                <div key={topic.topicId} className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {language === 'ko' ? topic.name_ko : topic.name_en}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {t('stats.solvedCount', { count: topic.solved })}
                    </span>
                    <span className="font-bold text-red-600 dark:text-red-400">{topic.accuracy}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Trend Line Chart */}
        {trendChartData.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 md:p-6 shadow-md border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">{t('stats.trend')}</h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('stats.last30Days')}</span>
            </div>
            <div className="w-full h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData} margin={{ left: 0, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px' }} />
                  <Line
                    type="monotone"
                    dataKey="solved"
                    stroke="#f97316"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={t('stats.solved')}
                  />
                  <Line
                    type="monotone"
                    dataKey="correct"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name={t('stats.correct')}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
