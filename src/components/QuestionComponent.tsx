'use client';

import React, { useState, useEffect } from 'react';
import { QuestionData, AnswerOption as AnswerOptionType } from '@/types/quizTypes';

interface QuestionComponentProps {
  questionData: QuestionData;
  onNextQuestion: () => void;
  onAnswer?: (isCorrect: boolean) => void;
}

const QuestionComponent: React.FC<QuestionComponentProps> = ({ questionData, onNextQuestion, onAnswer }) => {
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
    let baseClasses = "w-full rounded-lg border-2 transition-all duration-200 ease-in-out overflow-hidden ";
    if (!isAnswered) {
      return baseClasses + "bg-white hover:bg-gray-50 border-gray-300 hover:border-blue-500";
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
    let baseClasses = "w-full text-left font-medium py-3 px-5 transition-all duration-200 ease-in-out focus:outline-none ";
    if (!isAnswered) {
      return baseClasses + "text-gray-700 hover:text-blue-600 cursor-pointer";
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
      <h3 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800 leading-relaxed">
        {questionData.question}
      </h3>
      
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
                <span className="flex-1">{opt.text}</span>
                {isAnswered && (
                  <span className="ml-2 flex items-center gap-2">
                    <span>{getStatusIcon(opt)}</span>
                    <svg
                      className={`w-5 h-5 transition-transform duration-200 ${
                        expandedOptions.has(opt.text) ? 'rotate-180' : ''
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
                <div className={`text-sm ${
                  opt.isCorrect ? 'text-green-800' : 
                  opt.text === userAnswer?.text ? 'text-red-800' : 'text-gray-700'
                }`}>
                  <p className="font-semibold mb-1">
                    {opt.isCorrect ? '💡 정답 해설:' : 
                     opt.text === userAnswer?.text ? '❗ 오답 이유:' : '📖 해설:'}
                  </p>
                  <p className="leading-relaxed">{opt.rationale}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 힌트 섹션 */}
      {!isAnswered && !showHint && (
        <button
          onClick={() => setShowHint(true)}
          className="mt-5 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          💡 힌트 보기
        </button>
      )}
      {showHint && (
        <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md text-yellow-700">
          <strong className="font-bold">힌트:</strong> {questionData.hint}
        </div>
      )}

      {/* 다음 문제 버튼 */}
      {isAnswered && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className={`text-center font-semibold text-lg ${
            userAnswer?.isCorrect ? 'text-green-700' : 'text-red-700'
          }`}>
            {userAnswer?.isCorrect ? "정답입니다! 🎉" : "아쉽습니다. 다시 도전해보세요! 💪"}
          </div>
          <button
            onClick={onNextQuestion}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            다음 문제
          </button>
          <p className="text-sm text-gray-500">
            💡 다른 보기를 클릭하여 해설을 확인해보세요
          </p>
        </div>
      )}
    </div>
  );
};

export default QuestionComponent; 