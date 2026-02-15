export interface AnswerOption {
  id: string;
  text_ko: string;
  text_en: string;
  rationale_ko: string;
  rationale_en: string;
  isCorrect: boolean;
}

export type TopicId =
  | "computerSecurity"
  | "database"
  | "algorithm"
  | "dataStructure"
  | "computerNetworking"
  | "operatingSystem"
  | "computerArchitecture"
  | "softwareEngineering";

export interface QuestionData {
  id: string;
  topicId: TopicId;
  question_ko: string;
  question_en: string;
  hint_ko: string;
  hint_en: string;
  answerOptions: AnswerOption[];
}

export interface Topic {
  id: TopicId;
  name: string;
  questionCount?: number;
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
