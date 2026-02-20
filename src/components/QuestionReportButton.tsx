'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';

const REPORT_CATEGORIES = [
  'wrongAnswer',
  'questionError',
  'optionError',
  'rationaleError',
  'translationError',
  'other',
] as const;

type ReportCategory = typeof REPORT_CATEGORIES[number];

interface QuestionReportButtonProps {
  questionId: string;
}

export default function QuestionReportButton({ questionId }: QuestionReportButtonProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [showCategoryError, setShowCategoryError] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setCategory(null);
    setContent('');
    setStatus('idle');
    setShowCategoryError(false);
  };

  const handleSubmit = async () => {
    if (!category) {
      setShowCategoryError(true);
      return;
    }
    if (status === 'submitting') return;

    setStatus('submitting');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim() || `[${category}]`,
          questionId,
          category,
          userId: user?.id || null,
        }),
      });

      if (!res.ok) throw new Error();

      setStatus('success');
      setTimeout(() => {
        setIsOpen(false);
        setStatus('idle');
      }, 1500);
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
        onClick={handleOpen}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        title={t('report.button')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
        </svg>
        {t('report.button')}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackgroundClick}
        >
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-[slideIn_0.2s_ease-out]">
            {status === 'success' ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">🙏</div>
                <p className="text-xl font-bold text-gray-800">{t('report.thanks')}</p>
                <p className="text-gray-600 mt-1 text-sm">{t('report.sent')}</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="text-4xl mb-2">🚩</div>
                  <h2 className="text-xl font-bold text-gray-800">{t('report.title')}</h2>
                  <p className="text-gray-500 mt-1 text-sm">{t('report.description')}</p>
                </div>

                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">{t('report.categoryLabel')}</p>
                  <div className="flex flex-wrap gap-2">
                    {REPORT_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { setCategory(cat); setShowCategoryError(false); }}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          category === cat
                            ? 'bg-red-50 border-red-400 text-red-700 font-medium'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-400'
                        }`}
                      >
                        {t(`report.${cat}`)}
                      </button>
                    ))}
                  </div>
                  {showCategoryError && (
                    <p className="text-xs text-red-500 mt-1.5">{t('report.selectCategory')}</p>
                  )}
                </div>

                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t('report.placeholder')}
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-red-400 focus:outline-none transition-colors resize-none text-sm"
                  disabled={status === 'submitting'}
                />

                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mt-2">
                    {t('feedback.sendFailed')}
                  </div>
                )}

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleSubmit}
                    disabled={status === 'submitting'}
                    className="flex-1 bg-gradient-to-r from-red-500 to-rose-500 text-white py-2.5 rounded-lg font-semibold hover:from-red-600 hover:to-rose-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {status === 'submitting' ? t('feedback.submitting') : t('feedback.send')}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    disabled={status === 'submitting'}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 text-sm"
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
