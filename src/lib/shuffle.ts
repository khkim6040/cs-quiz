/**
 * Fisher-Yates 셔플 (날짜 기반 시드)
 * 같은 시드 값이면 항상 동일한 순서를 반환합니다.
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let state = (seed | 0) & 0x7fffffff;

  // 31비트 정수 상태로 고정된 선형 합동 생성기 (LCG)
  const lcg = () => {
    state = (Math.imul(state, 1103515245) + 12345) | 0;
    state &= 0x7fffffff;
    return state / 2147483648;
  };

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * 날짜를 YYYYMMDD 형식의 시드 숫자로 변환합니다.
 */
export function dateToSeed(date: Date): number {
  return (
    date.getUTCFullYear() * 10000 +
    (date.getUTCMonth() + 1) * 100 +
    date.getUTCDate()
  );
}
