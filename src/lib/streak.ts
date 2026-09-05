import { toKST } from './timezone';

interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

export function calculateStreak(completedAts: Date[]): StreakResult {
  if (completedAts.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // KST 기준 날짜 추출 → 중복 제거 → 내림차순 정렬
  const dateSet = new Set<string>();
  for (const d of completedAts) {
    dateSet.add(toKST(d).toISOString().slice(0, 10));
  }
  const dates = Array.from(dateSet).sort().reverse(); // 최신 날짜 먼저

  // 오늘 KST 날짜
  const now = new Date();
  const todayKST = toKST(now).toISOString().slice(0, 10);
  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayKST = toKST(yesterdayDate).toISOString().slice(0, 10);

  // currentStreak: 오늘 또는 어제부터 연속
  let currentStreak = 0;
  const startDate = dates[0] === todayKST || dates[0] === yesterdayKST ? dates[0] : null;

  if (startDate) {
    let expected = startDate;
    for (const date of dates) {
      if (date === expected) {
        currentStreak++;
        const prev = new Date(expected + 'T00:00:00Z');
        prev.setDate(prev.getDate() - 1);
        expected = prev.toISOString().slice(0, 10);
      } else if (date < expected) {
        break;
      }
    }
  }

  // longestStreak: 전체 기간 중 최장 연속
  let longestStreak = 1;
  let streak = 1;
  const sortedAsc = [...dates].reverse(); // 오름차순

  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1] + 'T00:00:00Z');
    prev.setDate(prev.getDate() + 1);
    if (prev.toISOString().slice(0, 10) === sortedAsc[i]) {
      streak++;
      longestStreak = Math.max(longestStreak, streak);
    } else {
      streak = 1;
    }
  }

  return { currentStreak, longestStreak };
}
