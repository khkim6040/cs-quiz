'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function FeedbackButton() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [cooldown, setCooldown] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!content.trim() || status === 'submitting') return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) throw new Error();

      setStatus('success');
      setContent('');
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
      }, 1500);

      setCooldown(true);
      setTimeout(() => setCooldown(false), 30000);
    } catch {
      setStatus('error');
    }
  };

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setIsOpen(false);
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setStatus('idle'); }}
        disabled={cooldown}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-lg hover:shadow-xl hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('feedback.buttonTitle')}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackgroundClick}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-[slideIn_0.2s_ease-out]">
            {status === 'success' ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🙏</div>
                <p className="text-xl font-bold text-gray-800">{t('feedback.thanks')}</p>
                <p className="text-gray-600 mt-1 text-sm">{t('feedback.sent')}</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="text-5xl mb-3">💬</div>
                  <h2 className="text-2xl font-bold text-gray-800">{t('feedback.title')}</h2>
                  <p className="text-gray-600 mt-2 text-sm">
                    {t('feedback.description')}
                  </p>
                </div>

                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('feedback.placeholder')}
                  maxLength={1000}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition-colors resize-none text-base"
                  disabled={status === 'submitting'}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">{content.length}/1000</p>

                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-2">
                    {t('feedback.sendFailed')}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={status === 'submitting' || !content.trim()}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'submitting' ? t('feedback.submitting') : t('feedback.send')}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={status === 'submitting'}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    {t('feedback.close')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
