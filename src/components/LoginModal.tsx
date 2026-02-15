'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  requireLogin?: boolean;
  message?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  onSuccess,
  requireLogin = false,
  message,
}: LoginModalProps) {
  const { login } = useAuth();
  const { t, language } = useLanguage();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

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

    const result = await login(username, language);

    if (result.success) {
      setUsername('');
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } else {
      setError(result.error || t('auth.loginFailed'));
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
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">👋</div>
          <h2 className="text-2xl font-bold text-gray-800">
            {requireLogin ? t('auth.loginRequired') : t('auth.whatToCall')}
          </h2>
          <p className="text-gray-600 mt-2 text-sm">
            {message || t('auth.leaderboardNeedLogin')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('auth.nicknamePlaceholder')}
              maxLength={15}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition-colors text-center text-lg"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              {t('auth.maxChars')}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.loggingIn') : t('auth.start')}
            </button>
            {!requireLogin && (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                {t('auth.later')}
              </button>
            )}
          </div>
        </form>

        {!requireLogin && (
          <p className="text-xs text-gray-500 text-center mt-4">
            {t('auth.autoSave')}
          </p>
        )}
      </div>
    </div>
  );
}
