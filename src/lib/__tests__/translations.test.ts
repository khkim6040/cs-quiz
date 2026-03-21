import { describe, it, expect } from 'vitest';
import { t, getTranslations } from '../translations';
import type { Translations } from '../translations';

const mockTranslations: Translations = {
  common: {
    hello: 'Hello',
    points: '{score}pts',
    greeting: 'Hello, {name}! You have {count} points.',
  },
  nested: {
    deep: 'Deep value',
  },
};

describe('t', () => {
  it('dot 표기법으로 중첩 키를 조회한다', () => {
    expect(t(mockTranslations, 'common.hello')).toBe('Hello');
    expect(t(mockTranslations, 'nested.deep')).toBe('Deep value');
  });

  it('존재하지 않는 키는 키 문자열을 반환한다', () => {
    expect(t(mockTranslations, 'common.nonexistent')).toBe('common.nonexistent');
    expect(t(mockTranslations, 'missing.key')).toBe('missing.key');
  });

  it('매개변수를 치환한다', () => {
    expect(t(mockTranslations, 'common.points', { score: 100 })).toBe('100pts');
  });

  it('여러 매개변수를 치환한다', () => {
    const result = t(mockTranslations, 'common.greeting', {
      name: 'Alice',
      count: 42,
    });
    expect(result).toBe('Hello, Alice! You have 42 points.');
  });

  it('없는 매개변수는 플레이스홀더를 유지한다', () => {
    expect(t(mockTranslations, 'common.points', {})).toBe('{score}pts');
  });

  it('매개변수 없이 호출해도 문자열을 반환한다', () => {
    expect(t(mockTranslations, 'common.hello')).toBe('Hello');
  });

  it('빈 키는 키 문자열을 반환한다', () => {
    expect(t(mockTranslations, '')).toBe('');
  });

  it('숫자 매개변수를 문자열로 변환한다', () => {
    expect(t(mockTranslations, 'common.points', { score: 0 })).toBe('0pts');
  });
});

describe('getTranslations', () => {
  it('한국어 번역을 반환한다', () => {
    const ko = getTranslations('ko');
    expect(ko.common.home).toBe('홈으로');
  });

  it('영어 번역을 반환한다', () => {
    const en = getTranslations('en');
    expect(en.common.home).toBe('Home');
  });

  it('한국어와 영어가 같은 키 구조를 가진다', () => {
    const ko = getTranslations('ko');
    const en = getTranslations('en');
    const koKeys = Object.keys(ko).sort();
    const enKeys = Object.keys(en).sort();
    expect(koKeys).toEqual(enKeys);
  });

  it('모든 네임스페이스의 키가 양쪽 언어에 존재한다', () => {
    const ko = getTranslations('ko');
    const en = getTranslations('en');
    for (const ns of Object.keys(ko)) {
      const koNsKeys = Object.keys(ko[ns]).sort();
      const enNsKeys = Object.keys(en[ns]).sort();
      expect(koNsKeys).toEqual(enNsKeys);
    }
  });
});
