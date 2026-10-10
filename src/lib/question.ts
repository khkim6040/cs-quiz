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
 * 화면에 보여줄 보기 순서를 정합니다.
 * T/F 문제는 True를 항상 먼저, 나머지는 정답 위치가 드러나지 않도록 셔플합니다.
 */
export function orderAnswerOptions<T extends AnswerOption>(options: T[]): T[] {
  const arr = [...options];
  if (isTrueFalseQuestion(arr)) {
    const isTrue = (o: T) => /^true$/i.test(o.text_en.trim());
    return arr.sort((a, b) => Number(isTrue(b)) - Number(isTrue(a)));
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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
