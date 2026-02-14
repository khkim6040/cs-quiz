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

  useEffect(() => {
    setShowHint(false);
    setUserAnswer(null);
    setIsAnswered(false);
  }, [questionData.id]);

  const handleAnswerSelect = (selectedOption: AnswerOptionType) => {
    if (!isAnswered) {
      setUserAnswer(selectedOption);
      setIsAnswered(true);
      if (onAnswer) {
        onAnswer(selectedOption.isCorrect);
      }
    }
  };

  const getButtonClass = (option: AnswerOptionType): string => {
    let baseClasses = "w-full text-left font-medium py-3 px-5 rounded-lg border-2 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-opacity-50 ";
    if (!isAnswered) {
      return baseClasses + "bg-white hover:bg-gray-50 border-gray-300 text-gray-700 hover:border-blue-500 focus:ring-blue-500";
    }
    if (option.isCorrect) {
      return baseClasses + "bg-green-100 border-green-500 text-green-700 ring-green-500 cursor-default";
    }
    if (option.text === userAnswer?.text && !option.isCorrect) {
      return baseClasses + "bg-red-100 border-red-500 text-red-700 ring-red-500 cursor-default";
    }
    return baseClasses + "bg-gray-50 border-gray-200 text-gray-400 cursor-default opacity-70";
  };

  return (
    <div className="my-6 md:my-8">
      <h3 className="text-xl md:text-2xl font-semibold mb-6 text-gray-800 leading-relaxed">
        {questionData.question}
      </h3>
      <div className="space-y-3">
        {questionData.answerOptions.map((opt) => (
          <button
            key={opt.text}
            onClick={() => handleAnswerSelect(opt)}
            disabled={isAnswered}
            className={getButtonClass(opt)}
          >
            {opt.text}
          </button>
        ))}
      </div>

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

      {isAnswered && userAnswer && (
        <div className={`mt-6 p-4 rounded-md border-l-4 ${userAnswer.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
          <h4 className={`font-bold text-lg mb-2 ${userAnswer.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
            {userAnswer.isCorrect ? "정답입니다! ✅" : "오답입니다. ❌"}
          </h4>
          <p className="text-gray-700 leading-relaxed">{userAnswer.rationale}</p>
          <button
            onClick={onNextQuestion}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            다음 문제
          </button>
        </div>
      )}
    </div>
  );
};

export default QuestionComponent; 