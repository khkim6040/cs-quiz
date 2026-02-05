'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent: number;
  completedAt: string;
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dailySetId = searchParams.get('dailySetId');
  const topicId = searchParams.get('topicId');

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!dailySetId) {
        setError('dailySetId가 필요합니다');
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
          throw new Error('리더보드를 불러오는 데 실패했습니다.');
        }
        const data = await res.json();
        setLeaderboard(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [dailySetId, topicId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 animate-pulse">리더보드를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">오류: {error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500">
            🏆 리더보드
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            홈으로
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-xl text-gray-600">아직 참가자가 없습니다</p>
            <p className="text-gray-500 mt-2">첫 번째 참가자가 되어보세요!</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left">순위</th>
                    <th className="px-6 py-4 text-left">사용자</th>
                    <th className="px-6 py-4 text-center">점수</th>
                    <th className="px-6 py-4 text-center">정답률</th>
                    <th className="px-6 py-4 text-center">소요 시간</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <tr
                      key={index}
                      className={`
                        hover:bg-gray-50 transition-colors
                        ${entry.rank === 1 ? 'bg-yellow-50' : ''}
                        ${entry.rank === 2 ? 'bg-gray-50' : ''}
                        ${entry.rank === 3 ? 'bg-orange-50' : ''}
                      `}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {entry.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                          {entry.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                          {entry.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                          <span className="font-semibold text-lg">#{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900">{entry.username}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-purple-600 text-lg">
                          {entry.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-700">
                          {entry.correctAnswers} / {entry.totalQuestions}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-gray-600">
                          {Math.floor(entry.timeSpent / 60)}분 {entry.timeSpent % 60}초
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/daily')}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-semibold shadow-lg"
          >
            오늘의 퀴즈 도전하기
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
        <p className="text-xl text-gray-600 animate-pulse">로딩 중...</p>
      </div>
    }>
      <LeaderboardContent />
    </Suspense>
  );
}
