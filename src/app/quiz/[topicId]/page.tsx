'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionData } from '@/types/quizTypes';
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
  const [questionQueue, setQuestionQueue] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage] = useState('ko');
  const isFetchingRef = useRef(false);

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

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            {params.topicId === 'random' ? '랜덤 퀴즈' : '퀴즈'}
          </h1>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            종료하기
          </button>
        </div>

        {currentQuestion && (
          <QuestionComponent
            questionData={currentQuestion}
            onNextQuestion={handleNextQuestion}
          />
        )}
      </div>
    </main>
  );
}
