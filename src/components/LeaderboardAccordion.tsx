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
      {/* 접힌 상태 헤더 */}
      <button
        onClick={handleToggle}
        className="w-full p-5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-2 border-gray-100 hover:border-orange-300 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* 트로피 아이콘 */}
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>

            {/* 타이틀 및 정보 */}
            <div className="flex-1 text-left">
              <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">
                오늘의 리더보드
              </h3>
              
              {/* 데이터 로딩 전 */}
              {!data && !loading && (
                <p className="text-sm text-gray-500">클릭하여 순위 확인하기</p>
              )}

              {/* 로딩 중 */}
              {loading && (
                <p className="text-sm text-gray-500 animate-pulse">로딩 중...</p>
              )}

              {/* 데이터 있을 때: 1위 + 내 순위 미리보기 */}
              {data && data.topUsers.length > 0 && (
                <div className="flex items-center gap-4 mt-1">
                  {/* 1위 정보 */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-600 font-bold">🥇</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {data.topUsers[0].username}
                    </span>
                    <span className="text-sm font-bold text-amber-600">
                      {data.topUsers[0].score}점
                    </span>
                  </div>

                  {/* 구분선 */}
                  {user && data.currentUserRank && (
                    <span className="text-gray-300">|</span>
                  )}

                  {/* 내 순위 */}
                  {user && data.currentUserRank && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-orange-600 font-bold">나:</span>
                      <span className="text-sm font-semibold text-orange-700">
                        {data.currentUserRank.rank}위
                      </span>
                      <span className="text-sm font-bold text-orange-600">
                        {data.currentUserRank.score}점
                      </span>
                    </div>
                  )}

                  {/* 비로그인 사용자 */}
                  {!user && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">
                        로그인하고 순위 확인하기
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* 참가자 수 */}
              {data && data.totalParticipants > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  총 {data.totalParticipants}명 참여 중
                </p>
              )}

              {/* 빈 상태 */}
              {data && data.topUsers.length === 0 && (
                <p className="text-sm text-gray-500">
                  아직 참가자가 없습니다 · 첫 번째가 되어보세요!
                </p>
              )}
            </div>
          </div>

          {/* 펼치기/접기 화살표 */}
          <svg
            className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 펼쳐진 상태 */}
      {isExpanded && (
        <div className="mt-2 bg-white rounded-xl shadow-lg border-2 border-orange-100 overflow-hidden">
          <div className="p-6">
            {/* 로딩 상태 */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3"></div>
                <p className="text-gray-600 animate-pulse">순위를 불러오는 중...</p>
              </div>
            )}

            {/* 에러 상태 */}
            {error && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium">{error}</p>
                <button
                  onClick={fetchLeaderboard}
                  className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  다시 시도
                </button>
              </div>
            )}

            {/* 빈 상태 */}
            {data && data.topUsers.length === 0 && (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-gray-800 mb-2">첫 번째 도전자가 되어보세요!</p>
                <p className="text-sm text-gray-500">아직 아무도 오늘의 퀴즈를 완료하지 않았습니다</p>
              </div>
            )}

            {/* 상위 10명 리스트 */}
            {data && data.topUsers.length > 0 && (
              <>
                <div className="space-y-2">
                  {data.topUsers.map((entry) => {
                    const isCurrentUser = user && data.currentUserRank && entry.rank === data.currentUserRank.rank;
                    const isTopThree = entry.rank <= 3;

                    return (
                      <div
                        key={entry.rank}
                        className={`
                          flex items-center justify-between p-4 rounded-xl transition-all duration-200
                          ${isCurrentUser
                            ? 'bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-400 shadow-md'
                            : entry.rank === 1
                              ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300'
                              : entry.rank === 2
                                ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300'
                                : entry.rank === 3
                                  ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200'
                                  : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {/* 순위 + 메달 */}
                          <div className="flex items-center gap-2 min-w-[60px]">
                            {entry.rank === 1 && (
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                              </div>
                            )}
                            {entry.rank === 2 && (
                              <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                              </div>
                            )}
                            {entry.rank === 3 && (
                              <div className="w-10 h-10 bg-gradient-to-br from-orange-300 to-amber-400 rounded-xl flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                              </div>
                            )}
                            {entry.rank > 3 && (
                              <span className={`font-bold text-lg ${isCurrentUser ? 'text-orange-700' : 'text-gray-600'}`}>
                                #{entry.rank}
                              </span>
                            )}
                          </div>

                          {/* 사용자명 */}
                          <div className="flex items-center gap-2 flex-1">
                            <span className={`font-semibold ${isCurrentUser ? 'text-orange-900' : isTopThree ? 'text-gray-800' : 'text-gray-700'}`}>
                              {entry.username}
                            </span>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs rounded-full font-bold shadow-sm">
                                나
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 점수 및 정답률 */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`font-bold text-lg ${isCurrentUser ? 'text-orange-600' : isTopThree ? 'text-gray-800' : 'text-gray-700'}`}>
                              {entry.score}점
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.correctAnswers}/{entry.totalQuestions}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 전체 순위 보기 버튼 */}
                <button
                  onClick={handleViewAll}
                  className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
