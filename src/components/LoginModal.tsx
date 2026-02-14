'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requireLogin?: boolean; // true면 "나중에" 버튼 숨김
  message?: string; // 커스텀 안내 메시지
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  requireLogin = false,
  message,
}: LoginModalProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때 입력 필드에 포커스
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !requireLogin) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, requireLogin, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await login(username);

    if (result.success) {
      setUsername('');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } else {
      setError(result.error || '로그인에 실패했습니다');
    }

    setIsLoading(false);
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !requireLogin) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackgroundClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-[slideIn_0.2s_ease-out]">
        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">👋</div>
          <h2 className="text-2xl font-bold text-gray-800">
            {requireLogin ? '로그인이 필요해요' : '어떻게 불러드릴까요?'}
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            {message || '리더보드에 기록을 남기려면 닉네임이 필요해요'}
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={15}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors text-center text-lg"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              최대 15자까지 입력 가능해요
            </p>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '로그인 중...' : '시작하기'}
            </button>
            {!requireLogin && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                나중에
              </button>
            )}
          </div>
        </form>

        {/* 안내 문구 */}
        {!requireLogin && (
          <p className="text-xs text-gray-500 text-center mt-4">
            💡 한번 입력하면 자동으로 저장돼요
          </p>
        )}
      </div>
    </div>
  );
}
