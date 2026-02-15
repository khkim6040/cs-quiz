'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionData } from '@/types/quizTypes';
import { useAuth } from '@/contexts/AuthContext';
import QuestionComponent from '@/components/QuestionComponent';

const BATCH_SIZE = 10;
const PREFETCH_THRESHOLD = 3; // 남은 문제가 이 수 이하이면 다음 배치 프리페치

interface QuizPageProps {
  params: {
    topicId: string;
  };
}

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [questionQueue, setQuestionQueue] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage] = useState('ko');
  const isFetchingRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  // 풀이 추적
  const [solvedCount, setSolvedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const fetchBatch = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch(
        `/api/questions/${params.topicId}?lang=${currentLanguage}&count=${BATCH_SIZE}`
      );
      if (!res.ok) {
        throw new Error('문제를 불러오는 데 실패했습니다.');
      }
      const data: QuestionData[] = await res.json();
      setQuestionQueue((prev) => [...prev, ...data]);
    } catch (err: any) {
      // 큐에 문제가 아직 있으면 에러를 무시 (백그라운드 프리페치 실패)
      setError((prevError) => {
        if (questionQueue.length > currentIndex) return prevError;
        return err.message;
      });
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [params.topicId, currentLanguage, questionQueue.length, currentIndex]);

  // 초기 로딩
  useEffect(() => {
    fetchBatch();
  }, [params.topicId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 남은 문제 수가 적으면 백그라운드 프리페치
  useEffect(() => {
    const remaining = questionQueue.length - currentIndex;
    if (remaining > 0 && remaining <= PREFETCH_THRESHOLD && !isFetchingRef.current) {
      fetchBatch();
    }
  }, [currentIndex, questionQueue.length, fetchBatch]);

  const handleNextQuestion = () => {
    setCurrentIndex((prev) => prev + 1);
  };

  const handleAnswer = (isCorrect: boolean) => {
    setSolvedCount((prev) => prev + 1);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleQuit = async () => {
    // 로그인 상태이고 문제를 1개 이상 풀었으면 세션 저장
    if (user && solvedCount > 0) {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      try {
        await fetch('/api/quiz-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizType: params.topicId === 'random' ? 'random' : 'topic',
            topicId: params.topicId === 'random' ? null : params.topicId,
            solvedCount,
            correctCount,
            timeSpent,
          }),
        });
      } catch {
        // 저장 실패해도 홈으로 이동
      }
    }
    router.push('/');
  };

  const currentQuestion = questionQueue[currentIndex] ?? null;

  if (loading && !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 animate-pulse">문제를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error && !currentQuestion) {
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

  const quizFooter = (
    <div className="flex items-center gap-3">
      {solvedCount > 0 && (
        <span className="text-sm text-gray-500 font-medium">
          {correctCount}/{solvedCount}
        </span>
      )}
      <button
        onClick={handleQuit}
        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
      >
        종료하기
      </button>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {currentQuestion && (
          <QuestionComponent
            questionData={currentQuestion}
            onNextQuestion={handleNextQuestion}
            onAnswer={handleAnswer}
            footerRight={quizFooter}
          />
        )}
      </div>
    </main>
  );
}
