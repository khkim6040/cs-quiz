import { describe, it, expect } from 'vitest';
import { calculateScore } from '../score';

describe('calculateScore', () => {
  it('전문 정답 + 빠른 시간이면 최고 점수를 반환한다', () => {
    // 10/10 정답, 0초 소요 → 1000 + 100 = 1100
    expect(calculateScore(10, 10, 0)).toBe(1100);
  });

  it('전문 정답 + 1000초 이상이면 타임보너스가 없다', () => {
    // 10/10 정답, 1000초 → 1000 + 0 = 1000
    expect(calculateScore(10, 10, 1000)).toBe(1000);
  });

  it('전문 정답 + 1000초 초과해도 음수 보너스가 되지 않는다', () => {
    // 10/10 정답, 2000초 → 1000 + 0 = 1000
    expect(calculateScore(10, 10, 2000)).toBe(1000);
  });

  it('절반 정답일 때 정확도 점수가 절반이다', () => {
    // 5/10 정답, 1000초 → 500 + 0 = 500
    expect(calculateScore(5, 10, 1000)).toBe(500);
  });

  it('0개 정답이면 정확도 점수가 0이다', () => {
    // 0/10 정답, 0초 → 0 + 100 = 100
    expect(calculateScore(0, 10, 0)).toBe(100);
  });

  it('반올림 처리를 한다', () => {
    // 7/10 정답, 500초 → 700 + 50 = 750
    expect(calculateScore(7, 10, 500)).toBe(750);
  });

  it('소수점 결과가 반올림된다', () => {
    // 1/3 정답, 0초 → 333.33... + 100 = 433.33... → 433
    expect(calculateScore(1, 3, 0)).toBe(433);
  });

  it('타임보너스가 소수점일 때 반올림된다', () => {
    // 10/10 정답, 999초 → 1000 + 0.1 = 1000.1 → 1000
    expect(calculateScore(10, 10, 999)).toBe(1000);
  });

  it('totalQuestions가 0이면 0을 반환한다', () => {
    expect(calculateScore(0, 0, 0)).toBe(0);
  });

  it('totalQuestions가 음수이면 0을 반환한다', () => {
    expect(calculateScore(5, -1, 100)).toBe(0);
  });

  it('correctAnswers가 totalQuestions를 초과하면 클램핑한다', () => {
    // 15/10은 10/10으로 클램핑 → 1000 + 100 = 1100
    expect(calculateScore(15, 10, 0)).toBe(1100);
  });

  it('correctAnswers가 음수이면 0으로 클램핑한다', () => {
    // -5/10은 0/10으로 클램핑 → 0 + 100 = 100
    expect(calculateScore(-5, 10, 0)).toBe(100);
  });

  it('timeSpent가 음수이면 0으로 보정한다', () => {
    // 10/10 정답, -100초 → 1000 + max(0, 1000-0)*0.1 = 1000 + 100 = 1100
    expect(calculateScore(10, 10, -100)).toBe(1100);
  });
});
