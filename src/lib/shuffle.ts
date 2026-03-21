/**
 * Fisher-Yates 셔플 (날짜 기반 시드)
 * 같은 시드 값이면 항상 동일한 순서를 반환합니다.
 */
export function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let random = seed;

  // 간단한 선형 합동 생성기 (LCG)
  const lcg = () => {
    random = (random * 1103515245 + 12345) % 2147483648;
    return random / 2147483648;
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
    date.getFullYear() * 10000 +
    (date.getMonth() + 1) * 100 +
    date.getDate()
  );
}
