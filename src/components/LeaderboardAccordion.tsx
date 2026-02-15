'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LeaderboardResponse } from '@/types/quizTypes';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardAccordionProps {
  dailySetId: string;
}

interface TodayLeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  solvedCount: number;
  correctCount: number;
}

interface TodayLeaderboardResponse {
  topUsers: TodayLeaderboardEntry[];
  currentUserRank: {
    rank: number;
    username: string;
    solvedCount: number;
    correctCount: number;
  } | null;
  totalParticipants: number;
}

type TabType = 'daily' | 'today';

export default function LeaderboardAccordion({ dailySetId }: LeaderboardAccordionProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('daily');

  // 일일 퀴즈 리더보드
  const [dailyData, setDailyData] = useState<LeaderboardResponse | null>(null);
  const [dailyLoading, setDailyLoading] = useState(false);
  const [dailyError, setDailyError] = useState<string | null>(null);

  // 오늘의 다풀기 리더보드
  const [todayData, setTodayData] = useState<TodayLeaderboardResponse | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);

  const fetchDailyLeaderboard = async () => {
    if (dailyLoading || dailyData) return;
    setDailyLoading(true);
    setDailyError(null);
    try {
      const params = new URLSearchParams({ dailySetId, limit: '10' });
      const res = await fetch(`/api/leaderboard?${params}`);
      if (!res.ok) throw new Error('리더보드를 불러오는 데 실패했습니다.');
      setDailyData(await res.json());
    } catch (err: any) {
      setDailyError(err.message);
    } finally {
      setDailyLoading(false);
    }
  };

  const fetchTodayLeaderboard = async () => {
    if (todayLoading || todayData) return;
    setTodayLoading(true);
    setTodayError(null);
    try {
      const res = await fetch('/api/leaderboard/today?limit=10');
      if (!res.ok) throw new Error('리더보드를 불러오는 데 실패했습니다.');
      setTodayData(await res.json());
    } catch (err: any) {
      setTodayError(err.message);
    } finally {
      setTodayLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isExpanded) {
      if (activeTab === 'daily' && !dailyData) fetchDailyLeaderboard();
      if (activeTab === 'today' && !todayData) fetchTodayLeaderboard();
    }
    setIsExpanded(!isExpanded);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === 'daily' && !dailyData && !dailyLoading) fetchDailyLeaderboard();
    if (tab === 'today' && !todayData && !todayLoading) fetchTodayLeaderboard();
  };

  const handleViewAll = () => {
    router.push(`/leaderboard?dailySetId=${dailySetId}`);
  };

  // 접힌 상태에서 보여줄 미리보기 데이터
  const previewData = activeTab === 'daily' ? dailyData : todayData;
  const isLoading = activeTab === 'daily' ? dailyLoading : todayLoading;

  return (
    <div className="w-full">
      {/* 접힌 상태 헤더 */}
      <button
        onClick={handleToggle}
        className="w-full p-5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-2 border-gray-100 hover:border-orange-300 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>

            <div className="flex-1 text-left">
              <h3 className="text-xl font-bold text-gray-800 mb-1 group-hover:text-orange-600 transition-colors">
                오늘의 리더보드
              </h3>

              {!previewData && !isLoading && (
                <p className="text-sm text-gray-500">클릭하여 순위 확인하기</p>
              )}
              {isLoading && (
                <p className="text-sm text-gray-500 animate-pulse">로딩 중...</p>
              )}

              {/* 일일 퀴즈 미리보기 */}
              {activeTab === 'daily' && dailyData && dailyData.topUsers.length > 0 && (
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-600 font-bold">🥇</span>
                    <span className="text-sm font-semibold text-gray-700">{dailyData.topUsers[0].username}</span>
                    <span className="text-sm font-bold text-amber-600">{dailyData.topUsers[0].score}점</span>
                  </div>
                  {user && dailyData.currentUserRank && (
                    <>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-orange-600 font-bold">나:</span>
                        <span className="text-sm font-semibold text-orange-700">{dailyData.currentUserRank.rank}위</span>
                      </div>
                    </>
                  )}
                  {!user && (
                    <>
                      <span className="text-gray-300">|</span>
                      <span className="text-sm text-gray-500">로그인하고 순위 확인하기</span>
                    </>
                  )}
                </div>
              )}

              {/* 오늘의 다풀기 미리보기 */}
              {activeTab === 'today' && todayData && todayData.topUsers.length > 0 && (
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-amber-600 font-bold">🥇</span>
                    <span className="text-sm font-semibold text-gray-700">{todayData.topUsers[0].username}</span>
                    <span className="text-sm font-bold text-amber-600">{todayData.topUsers[0].correctCount}개 정답</span>
                  </div>
                  {user && todayData.currentUserRank && (
                    <>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-orange-600 font-bold">나:</span>
                        <span className="text-sm font-semibold text-orange-700">{todayData.currentUserRank.rank}위</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 참가자 수 */}
              {previewData && previewData.totalParticipants > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  총 {previewData.totalParticipants}명 참여 중
                </p>
              )}

              {/* 빈 상태 */}
              {previewData && previewData.topUsers.length === 0 && (
                <p className="text-sm text-gray-500">
                  아직 참가자가 없습니다 · 첫 번째가 되어보세요!
                </p>
              )}
            </div>
          </div>

          <svg
            className={`w-6 h-6 text-gray-400 transition-transform duration-300 flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 펼쳐진 상태 */}
      {isExpanded && (
        <div className="mt-2 bg-white rounded-xl shadow-lg border-2 border-orange-100 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-300">
          {/* 탭 */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('daily')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                activeTab === 'daily'
                  ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              오늘의 퀴즈
            </button>
            <button
              onClick={() => handleTabChange('today')}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                activeTab === 'today'
                  ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              정답 개수
            </button>
          </div>

          <div className="p-6">
            {/* 일일 퀴즈 탭 */}
            {activeTab === 'daily' && (
              <>
                {dailyLoading && <LoadingState />}
                {dailyError && <ErrorState message={dailyError} onRetry={fetchDailyLeaderboard} />}
                {dailyData && dailyData.topUsers.length === 0 && <EmptyState />}
                {dailyData && dailyData.topUsers.length > 0 && (
                  <>
                    <div className="space-y-2">
                      {dailyData.topUsers.map((entry, index) => {
                        const isCurrentUser = user && dailyData.currentUserRank && entry.rank === dailyData.currentUserRank.rank;
                        return (
                          <RankRow
                            key={entry.rank}
                            rank={entry.rank}
                            username={entry.username}
                            value={`${entry.score}점`}
                            subValue={`${entry.correctAnswers}/${entry.totalQuestions}`}
                            isCurrentUser={!!isCurrentUser}
                            index={index}
                          />
                        );
                      })}
                    </div>
                    <button
                      onClick={handleViewAll}
                      className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-bold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                      전체 순위 보기 →
                    </button>
                  </>
                )}
              </>
            )}

            {/* 오늘의 다풀기 탭 */}
            {activeTab === 'today' && (
              <>
                {todayLoading && <LoadingState />}
                {todayError && <ErrorState message={todayError} onRetry={fetchTodayLeaderboard} />}
                {todayData && todayData.topUsers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-gray-800 mb-2">오늘 첫 도전자가 되어보세요!</p>
                    <p className="text-sm text-gray-500">퀴즈를 풀고 종료하면 자동으로 기록됩니다</p>
                  </div>
                )}
                {todayData && todayData.topUsers.length > 0 && (
                  <div className="space-y-2">
                    {todayData.topUsers.map((entry, index) => {
                      const isCurrentUser = user && todayData.currentUserRank && entry.rank === todayData.currentUserRank.rank;
                      return (
                        <RankRow
                          key={entry.rank}
                          rank={entry.rank}
                          username={entry.username}
                          value={`${entry.correctCount}개`}
                          subValue=""
                          isCurrentUser={!!isCurrentUser}
                          index={index}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// 공통 컴포넌트들

function RankRow({ rank, username, value, subValue, isCurrentUser, index }: {
  rank: number;
  username: string;
  value: string;
  subValue: string;
  isCurrentUser: boolean;
  index: number;
}) {
  const isTopThree = rank <= 3;

  return (
    <div
      style={{ animationDelay: `${index * 50}ms` }}
      className={`
        flex items-center justify-between p-4 rounded-xl transition-all duration-200
        animate-in slide-in-from-left-4 fade-in
        ${isCurrentUser
          ? 'bg-gradient-to-r from-orange-100 to-amber-100 border-2 border-orange-400 shadow-md'
          : rank === 1
            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300'
            : rank === 2
              ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300'
              : rank === 3
                ? 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200'
                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
        }
      `}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2 min-w-[60px]">
          {rank <= 3 ? (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
              rank === 1 ? 'bg-gradient-to-br from-amber-400 to-yellow-500'
                : rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-400'
                  : 'bg-gradient-to-br from-orange-300 to-amber-400'
            }`}>
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          ) : (
            <span className={`font-bold text-lg ${isCurrentUser ? 'text-orange-700' : 'text-gray-600'}`}>
              #{rank}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className={`font-semibold ${isCurrentUser ? 'text-orange-900' : isTopThree ? 'text-gray-800' : 'text-gray-700'}`}>
            {username}
          </span>
          {isCurrentUser && (
            <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs rounded-full font-bold shadow-sm">
              나
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className={`font-bold text-lg ${isCurrentUser ? 'text-orange-600' : isTopThree ? 'text-gray-800' : 'text-gray-700'}`}>
            {value}
          </div>
          <div className="text-xs text-gray-500">{subValue}</div>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="text-center py-12 animate-in fade-in duration-500">
      <div className="inline-block w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mb-3"></div>
      <p className="text-gray-600 animate-pulse">순위를 불러오는 중...</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <p className="text-red-600 font-medium">{message}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold shadow-md hover:shadow-lg"
      >
        다시 시도
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      <p className="text-xl font-bold text-gray-800 mb-2">첫 번째 도전자가 되어보세요!</p>
      <p className="text-sm text-gray-500">아직 아무도 오늘의 퀴즈를 완료하지 않았습니다</p>
    </div>
  );
}
