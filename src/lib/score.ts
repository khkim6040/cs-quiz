/**
 * 퀴즈 점수를 계산합니다.
 *
 * 공식: accuracy * 1000 + max(0, 1000 - timeSpent) * 0.1
 *
 * @param correctAnswers 맞은 문제 수
 * @param totalQuestions 전체 문제 수
 * @param timeSpent 소요 시간 (초)
 * @returns 반올림된 점수
 */
export function calculateScore(
  correctAnswers: number,
  totalQuestions: number,
  timeSpent: number
): number {
  if (totalQuestions <= 0) return 0;
  const accuracy = correctAnswers / totalQuestions;
  const timeBonus = Math.max(0, 1000 - timeSpent);
  return Math.round(accuracy * 1000 + timeBonus * 0.1);
}
