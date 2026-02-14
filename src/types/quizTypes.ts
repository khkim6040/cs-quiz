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

export interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent?: number;
  completedAt: Date;
}

export interface CurrentUserRank {
  rank: number;
  username: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
}

export interface LeaderboardResponse {
  topUsers: LeaderboardEntry[];
  currentUserRank: CurrentUserRank | null;
  totalParticipants: number;
}
