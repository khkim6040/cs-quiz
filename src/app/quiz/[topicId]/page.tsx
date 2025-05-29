'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionData } from '@/types/quizTypes';
import QuestionComponent from '@/components/QuestionComponent';

interface QuizPageProps {
  params: {
    topicId: string;
  };
}

export default function QuizPage({ params }: QuizPageProps) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnd, setIsEnd] = useState(false);

  const fetchNextQuestion = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/questions/${params.topicId}`);
      if (!res.ok) {
        throw new Error('문제를 불러오는 데 실패했습니다.');
      }
      const data = await res.json();
      setCurrentQuestion(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion();
  }, [params.topicId]);

  const handleNextQuestion = () => {
    fetchNextQuestion();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600 animate-pulse">문제를 불러오는 중입니다...</p>
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

  if (isEnd) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">퀴즈가 종료되었습니다!</h2>
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