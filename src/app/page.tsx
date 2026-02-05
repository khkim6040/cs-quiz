'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topic } from '@/types/quizTypes';

export default function HomePage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/topics');
        if (!res.ok) {
          throw new Error('주제 목록을 불러오는 데 실패했습니다.');
        }
        const data: Topic[] = await res.json();
        setTopics(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchTopics();
  }, []);

  if (loading) {
    return <p className="text-center mt-20 text-xl text-gray-600 animate-pulse">주제 목록을 불러오는 중입니다...</p>;
  }

  if (error) {
    return <p className="text-center mt-20 text-xl text-red-600">오류: {error}</p>;
  }

  return (
    <main className="container mx-auto px-4 py-8 min-h-screen flex flex-col items-center justify-center">
      <header className="mb-12 text-center">
        <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600">
          CS 지식 퀴즈 🧠
        </h1>
        <p className="text-xl text-gray-600">다양한 컴퓨터 과학 주제에 대한 지식을 테스트해보세요!</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link
          href={`/daily`}
          className="block p-6 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out sm:col-span-2 lg:col-span-3"
        >
          <h2 className="text-3xl font-bold mb-2">📅 오늘의 퀴즈</h2>
          <p className="text-yellow-100 text-sm">매일 새로운 문제 세트! 순위를 겨뤄보세요</p>
        </Link>

        {topics.map((topic) => (
          <Link
            href={`/quiz/${topic.id}`}
            key={topic.id}
            className="block p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out border border-gray-200 hover:border-blue-500"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{topic.name}</h2>
            <p className="text-gray-600 text-sm">도전해보세요!</p>
          </Link>
        ))}
        <Link
          href={`/quiz/random`}
          className="block p-6 bg-purple-600 text-white rounded-xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out sm:col-span-1 lg:col-span-1 hover:bg-purple-700"
        >
          <h2 className="text-2xl font-bold mb-2">🎲 랜덤 퀴즈</h2>
          <p className="text-purple-200 text-sm">모든 주제에서 무작위로!</p>
        </Link>
      </div>
      <footer className="mt-16 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} CS Quiz. 학습용으로 제작되었습니다.</p>
      </footer>
    </main>
  );
} 