'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QuestionData, AnswerOption as AnswerOptionType } from '@/types/quizTypes';
import type { Components } from 'react-markdown';

interface QuestionComponentProps {
  questionData: QuestionData;
  onNextQuestion: () => void;
  onAnswer?: (isCorrect: boolean) => void;
  footerRight?: React.ReactNode;
}

// 마크다운 컴포넌트 커스터마이징
const markdownComponents: Components = {
  code({ node, inline, className, children, ...props }: any) {
    if (inline) {
      return (
        <code className="px-1.5 py-0.5 bg-gray-900/10 text-[0.9em] rounded font-mono" {...props}>
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-slate-800 text-slate-100 rounded-lg p-4 overflow-x-auto my-3">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
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
      <blockquote className="border-l-4 border-gray-300 pl-4 italic my-3">
        {children}
      </blockquote>
    );
  },
};

const QuestionComponent: React.FC<QuestionComponentProps> = ({ questionData, onNextQuestion, onAnswer, footerRight }) => {
  const [showHint, setShowHint] = useState(false);
  const [userAnswer, setUserAnswer] = useState<AnswerOptionType | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [expandedOptions, setExpandedOptions] = useState<Set<string>>(new Set());

  useEffect(() => {
    setShowHint(false);
    setUserAnswer(null);
    setIsAnswered(false);
    setExpandedOptions(new Set());
  }, [questionData.id]);

  const handleAnswerSelect = (selectedOption: AnswerOptionType) => {
    if (!isAnswered) {
      setUserAnswer(selectedOption);
      setIsAnswered(true);
      // 정답은 자동으로 펼침
      const correctOption = questionData.answerOptions.find(opt => opt.isCorrect);
      if (correctOption) {
        setExpandedOptions(new Set([correctOption.text]));
      }
      if (onAnswer) {
        onAnswer(selectedOption.isCorrect);
      }
    }
  };

  const toggleExpand = (optionText: string) => {
    const newExpanded = new Set(expandedOptions);
    if (newExpanded.has(optionText)) {
      newExpanded.delete(optionText);
    } else {
      newExpanded.add(optionText);
    }
    setExpandedOptions(newExpanded);
  };

  const getCardClass = (option: AnswerOptionType): string => {
    const baseClasses = "w-full rounded-lg border-2 transition-all duration-200 ease-in-out overflow-hidden ";
    if (!isAnswered) {
      return baseClasses + "bg-white hover:bg-gray-50 border-gray-300 hover:border-orange-500";
    }
    if (option.isCorrect) {
      return baseClasses + "bg-green-50 border-green-500";
    }
    if (option.text === userAnswer?.text && !option.isCorrect) {
      return baseClasses + "bg-red-50 border-red-500";
    }
    return baseClasses + "bg-gray-50 border-gray-300";
  };

  const getHeaderClass = (option: AnswerOptionType): string => {
    const baseClasses = "w-full text-left font-medium py-3 px-5 transition-all duration-200 ease-in-out focus:outline-none ";
    if (!isAnswered) {
      return baseClasses + "text-gray-700 hover:text-orange-600 cursor-pointer";
    }
    if (option.isCorrect) {
      return baseClasses + "text-green-700 cursor-pointer";
    }
    if (option.text === userAnswer?.text && !option.isCorrect) {
      return baseClasses + "text-red-700 cursor-pointer";
    }
    return baseClasses + "text-gray-600 cursor-pointer";
  };

  const getStatusIcon = (option: AnswerOptionType): string => {
    if (!isAnswered) return "";
    if (option.isCorrect) return "✅";
    if (option.text === userAnswer?.text && !option.isCorrect) return "❌";
    return "";
  };

  return (
    <div className="my-6 md:my-8">
      <div className="text-xl md:text-2xl font-semibold mb-6 text-gray-800 leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {questionData.question}
        </ReactMarkdown>
      </div>

      <div className="space-y-3">
        {questionData.answerOptions.map((opt) => (
          <div key={opt.text} className={getCardClass(opt)}>
            {/* 보기 헤더 (답변 선택 또는 펼치기/접기) */}
            <button
              onClick={() => isAnswered ? toggleExpand(opt.text) : handleAnswerSelect(opt)}
              disabled={!isAnswered && isAnswered}
              className={getHeaderClass(opt)}
            >
              <div className="flex items-start justify-between">
                <span className="flex-1">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {opt.text}
                  </ReactMarkdown>
                </span>
                {isAnswered && (
                  <span className="ml-2 flex items-center gap-2">
                    <span>{getStatusIcon(opt)}</span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${expandedOptions.has(opt.text) ? 'rotate-180' : ''
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

            {/* 해설 (아코디언 컨텐츠) */}
            {isAnswered && expandedOptions.has(opt.text) && (
              <div className="px-5 pb-4 pt-2 border-t border-gray-200">
                <div className={`text-sm leading-relaxed ${opt.isCorrect ? 'text-green-800' :
                  opt.text === userAnswer?.text ? 'text-red-800' :
                    'text-gray-700'
                  }`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={markdownComponents}
                  >
                    {opt.rationale}
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
              className="px-4 py-2 text-sm bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors font-medium"
            >
              💡 힌트 보기
            </button>
          )}
        </div>
        {footerRight && <div>{footerRight}</div>}
      </div>
      {showHint && (
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md text-yellow-700">
          <div className="text-sm">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {questionData.hint}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* 다음 문제 버튼 */}
      {isAnswered && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onNextQuestion}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all font-semibold shadow-md hover:shadow-lg"
          >
            다음 문제
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionComponent; 