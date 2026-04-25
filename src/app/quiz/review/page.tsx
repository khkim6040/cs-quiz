'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QuestionData } from '@/types/quizTypes';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import QuestionComponent from '@/components/QuestionComponent';

interface ReviewResult {
  questionId: string;
  correct: boolean;
}

function ReviewQuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topicId');
  const { user } = useAuth();
  const { t } = useLanguage();

  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [solvedCount, setSolvedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const startTimeRef = useRef(Date.now());
  const reviewResultsRef = useRef<ReviewResult[]>([]);
  const [showStatTooltip, setShowStatTooltip] = useState(false);

  const fetchWrongNotes = useCallback(async () => {
    try {
      const topicParam = topicId ? `&topicId=${topicId}` : '';
      const res = await fetch(`/api/wrong-notes?status=ACTIVE${topicParam}`);
      if (!res.ok) throw new Error('Failed to load wrong notes');
      const notes = await res.json();
      const questionList: QuestionData[] = notes.map((note: { question: QuestionData }) => note.question);
      // Shuffle
      for (let i = questionList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [questionList[i], questionList[j]] = [questionList[j], questionList[i]];
      }
      setQuestions(questionList);
      if (questionList.length === 0) {
        setError('wrongNotes.reviewEmpty');
      }
    } catch {
      setError('common.error');
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    fetchWrongNotes();
  }, [fetchWrongNotes]);

  const isTransitioning = useRef(false);
  const handleNextQuestion = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;

    if (currentIndex + 1 >= questions.length) {
      handleQuit();
      return;
    }

    setCurrentIndex((prev) => prev + 1);
    requestAnimationFrame(() => { isTransitioning.current = false; });
  };

  const handleAnswer = (isCorrect: boolean, questionId: string) => {
    setSolvedCount((prev) => prev + 1);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    reviewResultsRef.current.push({ questionId, correct: isCorrect });
  };

  const handleQuit = async () => {
    if (user && solvedCount > 0) {
      const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
      const wrongQuestionIds = reviewResultsRef.current
        .filter((r) => !r.correct)
        .map((r) => r.questionId);

      try {
        await Promise.all([
          fetch('/api/quiz-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quizType: 'review',
              topicId: topicId || null,
              solvedCount,
              correctCount,
              timeSpent,
              wrongQuestionIds,
            }),
          }),
          fetch('/api/wrong-notes/review-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: reviewResultsRef.current }),
          }),
        ]);
      } catch {
        // 저장 실패해도 이동
      }
    }
    router.push('/wrong-notes');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 animate-pulse">{t('common.loading')}</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">{t(error || 'wrongNotes.reviewEmpty')}</p>
          <button onClick={() => router.push('/wrong-notes')} className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-semibold shadow-md">
            {t('wrongNotes.title')}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex] ?? null;

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
      <span className={`${pillClass} text-gray-400 pointer-events-none`}>
        {currentIndex + 1} / {questions.length}
      </span>
      <button onClick={handleQuit} className={`${pillClass} text-gray-500`}>
        {t('quiz.quit')}
      </button>
    </div>
  );

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-4">
          <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700 border border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700">
            {t('wrongNotes.reviewMode')}
          </span>
        </div>

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

export default function ReviewQuizPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 animate-pulse">{t('common.loading')}</p>
      </div>
    }>
      <ReviewQuizContent />
    </Suspense>
  );
}
