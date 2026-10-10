import { describe, it, expect } from 'vitest';
import { parseSearchParams, buildSearchWhere, keywordPattern } from '../search';

describe('parseSearchParams', () => {
  it('빈 입력은 기본값을 반환한다', () => {
    expect(parseSearchParams({})).toEqual({ q: '', topic: '', difficulty: '', page: 1 });
  });

  it('키워드 앞뒤 공백을 제거하고 100자로 자른다', () => {
    expect(parseSearchParams({ q: '  교착상태  ' }).q).toBe('교착상태');
    expect(parseSearchParams({ q: 'a'.repeat(150) }).q).toHaveLength(100);
  });

  it('배열 파라미터는 첫 값만 사용한다', () => {
    expect(parseSearchParams({ q: ['TCP', 'UDP'] }).q).toBe('TCP');
  });

  it('유효하지 않은 난이도는 무시한다', () => {
    expect(parseSearchParams({ difficulty: 'HARD' }).difficulty).toBe('HARD');
    expect(parseSearchParams({ difficulty: 'hard' }).difficulty).toBe('');
    expect(parseSearchParams({ difficulty: 'INSANE' }).difficulty).toBe('');
  });

  it('페이지는 1 이상의 정수로 보정한다', () => {
    expect(parseSearchParams({ page: '3' }).page).toBe(3);
    expect(parseSearchParams({ page: '0' }).page).toBe(1);
    expect(parseSearchParams({ page: '-2' }).page).toBe(1);
    expect(parseSearchParams({ page: 'abc' }).page).toBe(1);
  });
});

describe('buildSearchWhere', () => {
  const base = { q: '', topic: '', difficulty: '' as const, page: 1 };

  it('조건이 없으면 null을 반환한다', () => {
    expect(buildSearchWhere(base)).toBeNull();
  });

  it('주제와 난이도만으로도 조건을 만든다', () => {
    expect(buildSearchWhere({ ...base, topic: 'database', difficulty: 'EASY' })).toEqual({
      topicId: 'database',
      difficulty: 'EASY',
    });
  });

  it('키워드만 있으면 빈 조건을 반환한다 (키워드는 호출부에서 id로 거름)', () => {
    expect(buildSearchWhere({ ...base, q: 'tcp' })).toEqual({});
  });
});

describe('keywordPattern', () => {
  it('공백을 모두 제거해 띄어쓰기 차이를 흡수한다', () => {
    expect(keywordPattern('교착 상태')).toBe('%교착상태%');
    expect(keywordPattern('dead\tlock')).toBe('%deadlock%');
  });

  it('LIKE 와일드카드와 백슬래시를 이스케이프한다', () => {
    expect(keywordPattern('100%_a\\b')).toBe('%100\\%\\_a\\\\b%');
  });
});
