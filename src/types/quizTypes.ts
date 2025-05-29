export interface AnswerOption {
  text: string;
  rationale: string;
  isCorrect: boolean;
}

export interface QuestionData {
  id: string;
  topicId: string;
  question: string;
  answerOptions: AnswerOption[];
  hint: string;
}

export interface Topic {
  id: string;
  name: string;
}
