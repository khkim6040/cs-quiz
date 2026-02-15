'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionData } from '@/types/quizTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import QuestionComponent from '@/components/QuestionComponent';

const BATCH_SIZE = 10;
const PREFETCH_THRESHOLD = 3;

interface QuizPageProps {
  params: {
    topicId: string;
  };
}

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [questionQueue, setQuestionQueue] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);
  const startTimeRef = useRef(Date.now());

  const [solvedCount, setSolvedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [showStatTooltip, setShowStatTooltip] = useState(false);

  const fetchBatch = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch(
        `/api/questions/${params.topicId}?lang=${language}&count=${BATCH_SIZE}`
      );
      if (!res.ok) {
        throw new Error(t('quiz.errorLoad'));
      }
      const data: QuestionData[] = await res.json();
      setQuestionQueue((prev) => [...prev, ...data]);
    } catch (err: any) {
      setError((prevError) => {
        if (questionQueue.length > currentIndex) return prevError;
        return err.message;
      });
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [params.topicId, language, questionQueue.length, currentIndex, t]);

  useEffect(() => {
    // 언어 변경 시 기존 문제 캐시를 비우고 새로 fetch
    setQuestionQueue([]);
    setCurrentIndex(0);
    setLoading(true);
    setError(null);
    isFetchingRef.current = false;
    fetchBatch();
  }, [params.topicId, language]); // eslint-disable-line react-hooks/exhaustive-deps

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
        <p className="text-xl text-gray-600 animate-pulse">{t('quiz.loading')}</p>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-600 mb-4">{t('common.error')}: {error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            {t('common.goHome')}
          </button>
        </div>
      </div>
    );
  }

  const handleStatTap = () => {
    setShowStatTooltip(true);
    setTimeout(() => setShowStatTooltip(false), 2000);
  };

  const pillClass = "px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-sm font-medium";

  const quizFooter = (
    <div className="flex items-center gap-2">
      {solvedCount > 0 && (
        <div className="relative">
          <button onClick={handleStatTap} className={pillClass}>
            <span className="text-green-600 font-bold">{correctCount}</span>
            <span className="text-gray-400"> / </span>
            <span className="text-gray-600">{solvedCount}</span>
          </button>
          {showStatTooltip && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap shadow-lg animate-in fade-in duration-200">
              {t('quiz.correctSlashSolved')}
              <div className="absolute top-full right-4 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800" />
            </div>
          )}
        </div>
      )}
      <button onClick={handleQuit} className={`${pillClass} text-gray-500`}>
        {t('quiz.quit')}
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
