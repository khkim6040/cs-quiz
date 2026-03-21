import { describe, it, expect, vi, afterEach } from 'vitest';
import { getTodayInKST, toKST } from '../timezone';

describe('toKST', () => {
  it('UTC 자정을 KST 오전 9시로 변환한다', () => {
    const utcMidnight = new Date('2024-01-15T00:00:00.000Z');
    const kst = toKST(utcMidnight);
    expect(kst.getUTCHours()).toBe(9);
    expect(kst.getUTCDate()).toBe(15);
  });

  it('UTC 오후 3시(KST 자정)를 다음 날로 변환한다', () => {
    const utc3pm = new Date('2024-01-15T15:00:00.000Z');
    const kst = toKST(utc3pm);
    expect(kst.getUTCDate()).toBe(16);
    expect(kst.getUTCHours()).toBe(0);
  });

  it('연말 경계를 올바르게 처리한다', () => {
    const utcDec31 = new Date('2024-12-31T20:00:00.000Z');
    const kst = toKST(utcDec31);
    // KST로 2025-01-01 05:00
    expect(kst.getUTCFullYear()).toBe(2025);
    expect(kst.getUTCMonth()).toBe(0); // January
    expect(kst.getUTCDate()).toBe(1);
  });
});

describe('getTodayInKST', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('KST 기준 날짜의 UTC 자정을 반환한다', () => {
    // UTC 2024-01-15 20:00 = KST 2024-01-16 05:00
    vi.setSystemTime(new Date('2024-01-15T20:00:00.000Z'));
    const result = getTodayInKST();
    expect(result.toISOString()).toBe('2024-01-16T00:00:00.000Z');
  });

  it('UTC 자정 직후 (KST 오전 9시)에는 같은 날짜를 반환한다', () => {
    // UTC 2024-01-15 00:00 = KST 2024-01-15 09:00
    vi.setSystemTime(new Date('2024-01-15T00:00:00.000Z'));
    const result = getTodayInKST();
    expect(result.toISOString()).toBe('2024-01-15T00:00:00.000Z');
  });

  it('UTC 오후 2:59 (KST 23:59)에는 같은 KST 날짜를 반환한다', () => {
    vi.setSystemTime(new Date('2024-01-15T14:59:00.000Z'));
    const result = getTodayInKST();
    expect(result.toISOString()).toBe('2024-01-15T00:00:00.000Z');
  });

  it('UTC 오후 3:00 (KST 자정)에는 다음 날을 반환한다', () => {
    vi.setSystemTime(new Date('2024-01-15T15:00:00.000Z'));
    const result = getTodayInKST();
    expect(result.toISOString()).toBe('2024-01-16T00:00:00.000Z');
  });

  it('시간 부분은 항상 00:00:00.000이다', () => {
    vi.setSystemTime(new Date('2024-06-15T12:34:56.789Z'));
    const result = getTodayInKST();
    expect(result.getUTCHours()).toBe(0);
    expect(result.getUTCMinutes()).toBe(0);
    expect(result.getUTCSeconds()).toBe(0);
    expect(result.getUTCMilliseconds()).toBe(0);
  });
});
