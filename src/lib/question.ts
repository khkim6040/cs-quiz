interface AnswerOption {
  id: string;
  text_ko: string;
  text_en: string;
  rationale_ko: string;
  rationale_en: string;
  isCorrect: boolean;
}

/**
 * True/False 문제인지 판별합니다.
 * 보기가 정확히 2개이고, 각각 True와 False인 경우입니다.
 */
export function isTrueFalseQuestion(options: AnswerOption[]): boolean {
  if (options.length !== 2) return false;
  return (
    options.some((o) => /^true$/i.test(o.text_en.trim())) &&
    options.some((o) => /^false$/i.test(o.text_en.trim()))
  );
}

/**
 * 배치 사이즈를 1~maxBatchSize 범위로 클램핑합니다.
 */
export function clampBatchSize(
  input: string | null,
  maxBatchSize: number = 20
): number {
  const parsed = parseInt(input || '1', 10) || 1;
  return Math.min(Math.max(parsed, 1), maxBatchSize);
}
