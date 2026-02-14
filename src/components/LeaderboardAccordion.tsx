'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LeaderboardResponse } from '@/types/quizTypes';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardAccordionProps {
  dailySetId: string;
}

export default function LeaderboardAccordion({ dailySetId }: LeaderboardAccordionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 데이터 로딩 함수
  const fetchLeaderboard = async () => {
    if (loading || data) return; // 이미 로딩 중이거나 데이터가 있으면 스킵

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ 
        dailySetId,
        limit: '10' // 상위 10명만 조회
      });
      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) {
        throw new Error('리더보드를 불러오는 데 실패했습니다.');
      }
      const responseData: LeaderboardResponse = await res.json();
      setData(responseData);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 처음 펼칠 때 데이터 로딩
  const handleToggle = () => {
    if (!isExpanded && !data) {
      fetchLeaderboard();
    }
    setIsExpanded(!isExpanded);
  };

  const handleViewAll = () => {
    router.push(`/leaderboard?dailySetId=${dailySetId}`);
  };

  return (
    <div className="w-full">
      {/* 접힌 상태 헤더 - 다음 단계에서 구현 */}
      <button
        onClick={handleToggle}
        className="w-full p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-2 border-gray-100 hover:border-orange-300"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-gray-800">오늘의 리더보드</h3>
              {data && (
                <p className="text-sm text-gray-500">
                  {data.totalParticipants}명 참여 중
                </p>
              )}
            </div>
          </div>
          <svg
            className={`w-6 h-6 text-gray-600 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 펼쳐진 상태 - 다음 단계에서 구현 */}
      {isExpanded && (
        <div className="mt-2 bg-white rounded-xl shadow-lg border-2 border-orange-100 overflow-hidden">
          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <p className="text-gray-600 animate-pulse">로딩 중...</p>
              </div>
            )}
            {error && (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            )}
            {data && data.topUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">아직 참가자가 없습니다</p>
                <p className="text-sm text-gray-500 mt-2">첫 번째 도전자가 되어보세요!</p>
              </div>
            )}
            {data && data.topUsers.length > 0 && (
              <>
                <div className="space-y-3">
                  {data.topUsers.map((entry) => (
                    <div
                      key={entry.rank}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-600">#{entry.rank}</span>
                        <span className="font-medium text-gray-800">{entry.username}</span>
                      </div>
                      <span className="font-bold text-gray-800">{entry.score}점</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleViewAll}
                  className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-bold shadow-md hover:shadow-lg"
                >
                  전체 순위 보기 →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
