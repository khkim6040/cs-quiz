'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QuestionComponent from '@/components/QuestionComponent';
import LoginModal from '@/components/LoginModal';
import { useAuth } from '@/contexts/AuthContext';

interface Question {
  id: string;
  topicId: string;
  topicName: string;
  question: string;
  hint: string;
  answerOptions: Array<{
    text: string;
    rationale: string;
    isCorrect: boolean;
  }>;
}

export default function DailyQuizPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dailySetId, setDailySetId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime] = useState(Date.now());
  const [isCompleted, setIsCompleted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [scoreSubmitError, setScoreSubmitError] = useState<string | null>(null);
  const [pendingScoreSubmit, setPendingScoreSubmit] = useState(false);
  const [isSubmittingScore, setIsSubmittingScore] = useState(false);

  useEffect(() => {
    async function fetchDailyQuestions() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/daily-questions');
        if (!res.ok) {
          throw new Error('오늘의 퀴즈를 불러오는 데 실패했습니다.');
        }
        const data = await res.json();
        setQuestions(data.questions);
        setDailySetId(data.dailySetId);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchDailyQuestions();
  }, []);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  }, []);

  const submitScore = useCallback(async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setScoreSubmitError(null);
    setIsSubmittingScore(true);

    try {
      // QuizSession도 함께 저장 (오늘의 다풀기 리더보드용)
      fetch('/api/quiz-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizType: 'daily',
          dailySetId,
          solvedCount: questions.length,
          correctCount: correctAnswers,
          timeSpent,
        }),
      }).catch(() => {}); // 실패해도 무시

      const res = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dailySetId,
          topicId: null,
          correctAnswers,
          totalQuestions: questions.length,
          timeSpent,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        setScore(result.score);
        setRank(result.rank);
        setPendingScoreSubmit(false);
      } else if (res.status === 401) {
        // 로그인 필요 또는 User not found
        const errorData = await res.json();
        const errorMsg = errorData.error || '로그인이 필요합니다';
        setScoreSubmitError(errorMsg);
        setPendingScoreSubmit(true);

        // User not found인 경우 로그아웃 처리
        if (errorMsg.includes('User not found')) {
          // 로그아웃하여 사용자가 다시 로그인하도록 유도
          await fetch('/api/auth/logout', { method: 'POST' });
          setShowLoginModal(true);
        }
      } else {
        setScoreSubmitError('점수 제출에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      setScoreSubmitError('네트워크 오류가 발생했습니다');
    } finally {
      setIsSubmittingScore(false);
    }
  }, [startTime, dailySetId, correctAnswers, questions.length]);

  // 로그인 후 자동으로 점수 제출
  useEffect(() => {
    if (user && pendingScoreSubmit && isCompleted) {
      submitScore();
    }
  }, [user, pendingScoreSubmit, isCompleted, submitScore]);

  const handleNextQuestion = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 퀴즈 완료
      setIsCompleted(true);

      // 로그인된 경우에만 점수 제출
      if (user) {
        await submitScore();
      } else {
        // 비로그인 상태에서는 pendingScoreSubmit을 true로 설정
        // 나중에 로그인하면 useEffect에서 자동으로 점수 제출
        setPendingScoreSubmit(true);
      }
    }
  }, [currentIndex, questions.length, user, submitScore]);

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // 로그인 성공 후 자동으로 점수 제출 (useEffect에서 처리)
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 animate-pulse">오늘의 퀴즈를 불러오는 중...</p>
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
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-gray-50 py-8">
          <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border-2 border-orange-100">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">
              퀴즈 완료!
            </h2>

            <div className="space-y-4 mb-6">
              {/* 정답률 */}
              <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl">
                <p className="text-orange-700 text-sm font-semibold">정답률</p>
                <p className="text-4xl font-bold text-orange-600">
                  {correctAnswers} / {questions.length}
                </p>
              </div>

              {/* 점수 제출 중 로딩 */}
              {isSubmittingScore && (
                <div className="p-5 bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 rounded-xl">
                  <div className="flex items-center justify-center gap-3">
                    <div className="w-6 h-6 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-orange-700 font-semibold">점수를 제출하는 중...</p>
                  </div>
                  <p className="text-xs text-orange-600 mt-2 text-center">잠시만 기다려주세요</p>
                </div>
              )}

              {/* 점수 */}
              {score !== null ? (
                <div className="p-5 bg-gradient-to-br from-gray-50 to-slate-50 border border-gray-200 rounded-xl">
                  <p className="text-gray-700 text-sm font-semibold">점수</p>
                  <p className="text-4xl font-bold text-gray-800">{score}</p>
                </div>
              ) : null}

              {/* 순위 */}
              {rank !== null ? (
                <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-700 text-sm font-semibold">순위</p>
                      <p className="text-4xl font-bold text-green-600">#{rank}</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* 비로그인 사용자 안내 */}
              {!user && !isSubmittingScore && (
                <div className="p-5 bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-xl">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-amber-900 font-bold mb-1">좋은 결과네요!</p>
                      <p className="text-sm text-amber-800">
                        리더보드에 등록하시겠어요?
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
                  >
                    등록하기
                  </button>
                </div>
              )}

              {/* 에러 메시지 */}
              {scoreSubmitError && user && !isSubmittingScore && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{scoreSubmitError}</p>
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div className="flex gap-3">
              {user && score !== null ? (
                <button
                  onClick={() => router.push('/leaderboard?dailySetId=' + dailySetId)}
                  disabled={isSubmittingScore}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  리더보드 보기
                </button>
              ) : null}
              <button
                onClick={() => router.push('/')}
                disabled={isSubmittingScore}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                홈으로
              </button>
            </div>
          </div>
        </div>

        {/* 로그인 모달 */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={handleLoginSuccess}
          message="리더보드에 기록하려면 로그인이 필요해요"
        />
      </>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              오늘의 퀴즈
            </h1>
            <p className="text-gray-600 mt-2">
              {currentIndex + 1} / {questions.length}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
          >
            종료하기
          </button>
        </div>

        {/* 진행률 바 */}
        <div className="mb-6 bg-gray-100 rounded-full h-2.5 shadow-inner">
          <div
            className="bg-gradient-to-r from-orange-500 to-amber-500 h-2.5 rounded-full transition-all duration-500 shadow-sm"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {currentQuestion && (
          <div>
            <div className="mb-4 px-4 py-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 rounded-full inline-flex items-center gap-2 text-sm font-semibold border border-orange-200">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {currentQuestion.topicName}
            </div>
            <QuestionComponent
              questionData={{
                id: currentQuestion.id,
                topicId: currentQuestion.topicId,
                question: currentQuestion.question,
                hint: currentQuestion.hint,
                answerOptions: currentQuestion.answerOptions,
              }}
              onNextQuestion={handleNextQuestion}
              onAnswer={handleAnswer}
            />
          </div>
        )}
      </div>
    </main>
  );
}
