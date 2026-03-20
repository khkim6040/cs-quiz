'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import remarkGfm from 'remark-gfm';
import { QuestionData, AnswerOption as AnswerOptionType } from '@/types/quizTypes';
import { useLanguage } from '@/contexts/LanguageContext';
import QuestionReportButton from './QuestionReportButton';
import type { Components } from 'react-markdown';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <span className="animate-pulse bg-gray-200 dark:bg-gray-700 rounded h-4 w-32 inline-block" />,
});

interface QuestionComponentProps {
  questionData: QuestionData;
  onNextQuestion: () => void;
  onAnswer?: (isCorrect: boolean) => void;
  footerRight?: React.ReactNode;
}

// 마크다운 컴포넌트 커스터마이징
const markdownComponents: Components = {
  pre({ children }: any) {
    // 코드 블럭: code 자식의 인라인 스타일을 블럭 스타일로 교체
    const child = React.Children.toArray(children)[0];
    const codeContent = child && React.isValidElement(child) ? (child.props as any).children : children;
    return (
      <pre className="bg-slate-800 text-slate-100 rounded-lg p-4 overflow-x-auto my-3">
        <code>{codeContent}</code>
      </pre>
    );
  },
  code({ children, ...props }: any) {
    // 인라인 코드 (코드 블럭의 code는 pre가 재구성)
    return (
      <code className="px-1.5 py-0.5 bg-gray-900/10 dark:bg-gray-100/10 text-[0.9em] rounded font-mono" {...props}>
        {children}
      </code>
    );
  },
  p({ children }) {
    return <p className="mb-3 last:mb-0">{children}</p>;
  },
  ul({ children }) {
    return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
  },
  li({ children }) {
    return <li className="ml-2">{children}</li>;
  },
  strong({ children }) {
    return <strong className="font-bold">{children}</strong>;
  },
  em({ children }) {
    return <em className="italic">{children}</em>;
  },
  h1({ children }) {
    return <h1 className="text-2xl font-bold mb-3 mt-4">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-xl font-bold mb-2 mt-3">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-lg font-bold mb-2 mt-3">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-3">
        {children}
      </blockquote>
    );
  },
};

const QuestionComponent: React.FC<QuestionComponentProps> = ({ questionData, onNextQuestion, onAnswer, footerRight }) => {
  const { t, language } = useLanguage();

  const l = (ko: string, en: string) => language === 'en' ? en : ko;
  const [showHint, setShowHint] = useState(false);
  const [userAnswerId, setUserAnswerId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());
  const [swipeHint, setSwipeHint] = useState(false);

  // Swipe gesture handling
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !isAnswered) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Swipe left: dx < -60px, horizontal movement dominates vertical
    if (dx < -60 && Math.abs(dy) < Math.abs(dx)) {
      onNextQuestion();
    }
  }, [isAnswered, onNextQuestion]);

  // Show swipe hint briefly after answering
  useEffect(() => {
    if (isAnswered) {
      setSwipeHint(true);
      const timer = setTimeout(() => setSwipeHint(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isAnswered]);

  useEffect(() => {
    setShowHint(false);
    setUserAnswerId(null);
    setIsAnswered(false);
    setExpandedOptions(new Set());
  }, [questionData.id]);

  const handleAnswerSelect = (selectedOption: AnswerOptionType) => {
    if (!isAnswered) {
      setUserAnswerId(selectedOption.id);
      setIsAnswered(true);
      const correctOption = questionData.answerOptions.find(opt => opt.isCorrect);
      if (correctOption) {
        setExpandedOptions(new Set([correctOption.id]));
      }
      if (onAnswer) {
        onAnswer(selectedOption.isCorrect);
      }
    }
  };

  const toggleExpand = (optionId: string) => {
    const newExpanded = new Set(expandedOptions);
    if (newExpanded.has(optionId)) {
      newExpanded.delete(optionId);
    } else {
      newExpanded.add(optionId);
    }
    setExpandedOptions(newExpanded);
  };

  const getCardClass = (option: AnswerOptionType): string => {
    const baseClasses = "w-full rounded-lg border-2 transition-all duration-200 ease-in-out overflow-hidden ";
    if (!isAnswered) {
      return baseClasses + "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-orange-500";
    }
    if (option.isCorrect) {
      return baseClasses + "bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600";
    }
    if (option.id === userAnswerId && !option.isCorrect) {
      return baseClasses + "bg-red-50 dark:bg-red-900/20 border-red-500 dark:border-red-600";
    }
    return baseClasses + "bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600";
  };

  const getHeaderClass = (option: AnswerOptionType): string => {
    const baseClasses = "w-full text-left font-medium py-3 px-5 transition-all duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 ";
    if (!isAnswered) {
      return baseClasses + "text-gray-700 dark:text-gray-300 hover:text-orange-600 cursor-pointer";
    }
    if (option.isCorrect) {
      return baseClasses + "text-green-700 dark:text-green-400 cursor-pointer";
    }
    if (option.id === userAnswerId && !option.isCorrect) {
      return baseClasses + "text-red-700 dark:text-red-400 cursor-pointer";
    }
    return baseClasses + "text-gray-600 dark:text-gray-400 cursor-pointer";
  };

  return (
    <div
      ref={containerRef}
      className="my-6 md:my-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="text-xl md:text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-100 leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
          components={markdownComponents}
        >
          {l(questionData.question_ko, questionData.question_en)}
        </ReactMarkdown>
      </div>

      <div className="space-y-3">
        {questionData.answerOptions.map((opt) => (
          <div key={opt.id} className={getCardClass(opt)}>
            <button
              onClick={() => isAnswered ? toggleExpand(opt.id) : handleAnswerSelect(opt)}
              className={getHeaderClass(opt)}
              aria-label={l(opt.text_ko, opt.text_en)}
            >
              <div className="flex items-start justify-between">
                <span className="flex-1">
                  <ReactMarkdown
                    remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                    components={markdownComponents}
                  >
                    {l(opt.text_ko, opt.text_en)}
                  </ReactMarkdown>
                </span>
                {isAnswered && (
                  <span className="ml-2">
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${expandedOptions.has(opt.id) ? 'rotate-180' : ''
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                )}
              </div>
            </button>

            {isAnswered && expandedOptions.has(opt.id) && (
              <div className="px-5 pb-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className={`text-sm leading-relaxed ${opt.isCorrect ? 'text-green-800 dark:text-green-400' :
                  opt.id === userAnswerId ? 'text-red-800 dark:text-red-400' :
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                  <ReactMarkdown
                    remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
                    components={markdownComponents}
                  >
                    {l(opt.rationale_ko, opt.rationale_en)}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 힌트 + 푸터 영역 */}
      <div className="mt-5 flex items-center justify-between">
        <div>
          {!isAnswered && !showHint && (
            <button
              onClick={() => setShowHint(true)}
              className="px-4 py-2 text-sm bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg transition-colors font-medium focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              {t('quiz.hint')}
            </button>
          )}
        </div>
        {footerRight && <div>{footerRight}</div>}
      </div>
      {showHint && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-700 rounded-md text-yellow-700 dark:text-yellow-400">
          <div className="text-sm">
            <ReactMarkdown
              remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
              components={markdownComponents}
            >
              {l(questionData.hint_ko, questionData.hint_en)}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 다음 문제 버튼 + 오류 신고 */}
      {isAnswered && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={onNextQuestion}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold shadow-md hover:shadow-lg focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
          >
            {t('quiz.next')}
          </button>
          {swipeHint && (
            <p className="text-xs text-gray-400 animate-pulse md:hidden">
              {t('quiz.swipeHint')}
            </p>
          )}
          <QuestionReportButton questionId={questionData.id} />
        </div>
      )}
    </div>
  );
};

export default QuestionComponent;
