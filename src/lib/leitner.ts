// Box intervals in days: Box 0=immediate, 1=1day, 2=3days, 3=7days, 4=14days, 5=30days
const INTERVALS_DAYS = [0, 1, 3, 7, 14, 30];
export const MAX_BOX = 5;

export function getNextReviewDate(box: number, now: Date = new Date()): Date {
  const days = INTERVALS_DAYS[Math.min(box, MAX_BOX)] ?? 0;
  const next = new Date(now);
  next.setDate(next.getDate() + days);
  return next;
}

export function onCorrect(currentBox: number): { newBox: number; graduated: boolean } {
  const newBox = Math.min(currentBox + 1, MAX_BOX + 1);
  return { newBox, graduated: newBox > MAX_BOX };
}

export function onWrong(): { newBox: number } {
  return { newBox: 0 };
}
