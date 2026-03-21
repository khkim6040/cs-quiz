import { describe, it, expect } from 'vitest';
import { seededShuffle, dateToSeed } from '../shuffle';

describe('seededShuffle', () => {
  it('같은 시드는 항상 같은 결과를 반환한다', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result1 = seededShuffle(arr, 12345);
    const result2 = seededShuffle(arr, 12345);
    expect(result1).toEqual(result2);
  });

  it('다른 시드는 다른 결과를 반환한다', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result1 = seededShuffle(arr, 12345);
    const result2 = seededShuffle(arr, 54321);
    expect(result1).not.toEqual(result2);
  });

  it('원본 배열을 변경하지 않는다', () => {
    const arr = [1, 2, 3, 4, 5];
    const original = [...arr];
    seededShuffle(arr, 42);
    expect(arr).toEqual(original);
  });

  it('같은 요소를 모두 포함한다', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = seededShuffle(arr, 42);
    expect(result.sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('빈 배열은 빈 배열을 반환한다', () => {
    expect(seededShuffle([], 42)).toEqual([]);
  });

  it('단일 요소 배열은 그대로 반환한다', () => {
    expect(seededShuffle([1], 42)).toEqual([1]);
  });

  it('특정 시드에 대해 결정적 순열을 반환한다', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = seededShuffle(arr, 42);
    // 같은 시드로 다시 돌리면 동일한 결과
    const result2 = seededShuffle(arr, 42);
    expect(result).toEqual(result2);
    // 원본과 다른 순서여야 함 (이 시드에서 검증됨)
    expect(result).not.toEqual([1, 2, 3, 4, 5]);
  });
});

describe('dateToSeed', () => {
  it('UTC 날짜를 YYYYMMDD 형식의 숫자로 변환한다', () => {
    const date = new Date(Date.UTC(2024, 0, 15));
    expect(dateToSeed(date)).toBe(20240115);
  });

  it('12월 31일을 올바르게 처리한다', () => {
    const date = new Date(Date.UTC(2024, 11, 31));
    expect(dateToSeed(date)).toBe(20241231);
  });

  it('1월 1일을 올바르게 처리한다', () => {
    const date = new Date(Date.UTC(2025, 0, 1));
    expect(dateToSeed(date)).toBe(20250101);
  });

  it('같은 날짜는 항상 같은 시드를 반환한다', () => {
    const date1 = new Date(Date.UTC(2024, 5, 15));
    const date2 = new Date(Date.UTC(2024, 5, 15));
    expect(dateToSeed(date1)).toBe(dateToSeed(date2));
  });

  it('로컬 타임존에 영향받지 않고 UTC 기준으로 변환한다', () => {
    // UTC 2024-01-15T23:00 → UTC 기준 1월 15일
    const date = new Date('2024-01-15T23:00:00.000Z');
    expect(dateToSeed(date)).toBe(20240115);
  });
});
