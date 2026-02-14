'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Topic } from '@/types/quizTypes';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
  const { user, isLoading: authLoading } = useAuth();
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
        {!authLoading && user ? (
          <div className="mb-4">
            <p className="text-xl text-gray-600 mb-2">환영합니다,</p>
            <h1 className="text-5xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
              <span>{user.username}님!</span>
              <div className="inline-flex w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl items-center justify-center shadow-lg">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"/>
                </svg>
              </div>
            </h1>
          </div>
        ) : (
          <h1 className="text-5xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
            <span>CS 지식 퀴즈</span>
            <div className="inline-flex w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-2xl items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
          </h1>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl">
        <Link
          href={`/daily`}
          className="block p-8 bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out sm:col-span-2 lg:col-span-3 group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
            <h2 className="text-3xl font-bold">오늘의 퀴즈</h2>
          </div>
        </Link>

        {topics.map((topic) => (
          <Link
            href={`/quiz/${topic.id}`}
            key={topic.id}
            className="block p-6 bg-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out border-2 border-gray-100 hover:border-orange-300 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg flex items-center justify-center group-hover:from-orange-200 group-hover:to-amber-200 transition-colors">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 group-hover:text-orange-600 transition-colors">{topic.name}</h2>
            </div>
          </Link>
        ))}
        <Link
          href={`/quiz/random`}
          className="block p-6 bg-gray-800 text-white rounded-xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 ease-in-out sm:col-span-1 lg:col-span-1 hover:bg-gray-900 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold">랜덤 퀴즈</h2>
          </div>
        </Link>
      </div>
    </main>
  );
} 