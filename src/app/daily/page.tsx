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

  // 로그인 후 자동으로 점수 제출
  useEffect(() => {
    if (user && pendingScoreSubmit && isCompleted) {
      submitScore();
    }
  }, [user, pendingScoreSubmit, isCompleted]);

  const handleAnswer = useCallback((isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
    }
  }, []);

  const submitScore = async () => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    setScoreSubmitError(null);

    try {
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
        // 로그인 필요
        setScoreSubmitError('로그인이 필요합니다');
        setPendingScoreSubmit(true);
      } else {
        setScoreSubmitError('점수 제출에 실패했습니다');
      }
    } catch (error) {
      console.error('Failed to submit score:', error);
      setScoreSubmitError('네트워크 오류가 발생했습니다');
    }
  };

  const handleNextQuestion = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 퀴즈 완료
      setIsCompleted(true);
      
      // 로그인된 경우에만 점수 제출
      if (user) {
        await submitScore();
      }
    }
  }, [currentIndex, questions.length, user]);

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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 py-8">
          <div className="text-center bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4">
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              🎉 퀴즈 완료!
            </h2>
            
            <div className="space-y-4 mb-6">
              {/* 정답률 */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-gray-600">정답률</p>
                <p className="text-3xl font-bold text-blue-600">
                  {correctAnswers} / {questions.length}
                </p>
              </div>

              {/* 점수 */}
              {score !== null ? (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-gray-600">점수</p>
                  <p className="text-3xl font-bold text-purple-600">{score}</p>
                </div>
              ) : null}

              {/* 순위 */}
              {rank !== null ? (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600">순위</p>
                  <p className="text-3xl font-bold text-green-600">#{rank}</p>
                </div>
              ) : null}

              {/* 비로그인 사용자 안내 */}
              {!user && (
                <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                  <p className="text-yellow-800 font-semibold mb-2">🏆 좋은 결과네요!</p>
                  <p className="text-sm text-yellow-700 mb-3">
                    리더보드에 등록하시겠어요?
                  </p>
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="w-full py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors"
                  >
                    등록하기
                  </button>
                </div>
              )}

              {/* 에러 메시지 */}
              {scoreSubmitError && user && (
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
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all font-semibold"
                >
                  리더보드 보기
                </button>
              ) : null}
              <button
                onClick={() => router.push('/')}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
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
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              📅 오늘의 퀴즈
            </h1>
            <p className="text-gray-600 mt-2">
              {currentIndex + 1} / {questions.length}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            종료하기
          </button>
        </div>

        {/* 진행률 바 */}
        <div className="mb-6 bg-gray-200 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {currentQuestion && (
          <div>
            <div className="mb-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full inline-block text-sm">
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
