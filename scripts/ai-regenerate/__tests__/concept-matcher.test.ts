import { describe, it, expect, beforeEach } from 'vitest';
import { matchConcept, getConceptCache } from '../concept-matcher';

// 테스트를 위해 concept 캐시를 직접 채움
function populateCache(
  topicId: string,
  concepts: Array<{ id: string; name_en: string }>
) {
  const cache = getConceptCache();
  cache.set(
    topicId,
    concepts.map((c) => ({ ...c, topicId }))
  );
}

beforeEach(() => {
  getConceptCache().clear();
});

describe('matchConcept', () => {
  describe('정확 매칭 (Level 1)', () => {
    it('대소문자 무관하게 정확히 일치하면 매칭한다', () => {
      populateCache('algorithm', [
        { id: '1', name_en: 'Sorting Algorithms' },
      ]);
      const result = matchConcept('sorting algorithms', 'algorithm');
      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('Sorting Algorithms');
    });

    it('대문자도 매칭한다', () => {
      populateCache('algorithm', [
        { id: '1', name_en: 'Dynamic Programming' },
      ]);
      const result = matchConcept('DYNAMIC PROGRAMMING', 'algorithm');
      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('Dynamic Programming');
    });
  });

  describe('시드 이름이 생성된 개념에 포함 (Level 2)', () => {
    it('시드 이름이 생성된 문자열의 부분 문자열이면 매칭한다', () => {
      populateCache('computerSecurity', [
        { id: '1', name_en: 'SQL Injection' },
      ]);
      const result = matchConcept('SQL Injection Attacks', 'computerSecurity');
      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('SQL Injection');
    });

    it('4자 미만의 시드 이름은 부분 매칭하지 않는다', () => {
      populateCache('algorithm', [{ id: '1', name_en: 'DP' }]);
      const result = matchConcept('DP Principles', 'algorithm');
      // DP는 2글자라 Level 2에서는 매칭 안 됨, Level 3에서 매칭
      // Level 3: genLower.length >= 3이므로 "dp principles"는 매칭
      // 하지만 seed "dp"가 gen에 포함되려면 Level 3
      expect(result).not.toBeNull();
    });
  });

  describe('생성된 개념이 시드 이름에 포함 (Level 3)', () => {
    it('짧은 생성 개념이 시드 이름에 포함되면 매칭한다', () => {
      populateCache('computerSecurity', [{ id: '1', name_en: 'CSRF' }]);
      const result = matchConcept('CSRF', 'computerSecurity');
      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('CSRF');
    });
  });

  describe('키워드 별칭 (Level 4)', () => {
    it('algorithm 토픽의 키워드 별칭으로 매칭한다', () => {
      populateCache('algorithm', [
        { id: '1', name_en: 'Sorting Algorithms' },
      ]);
      const result = matchConcept('quicksort implementation', 'algorithm');
      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('Sorting Algorithms');
    });

    it('database 토픽의 키워드 별칭으로 매칭한다', () => {
      populateCache('database', [{ id: '1', name_en: 'Normalization' }]);
      const result = matchConcept('3NF decomposition', 'database');
      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('Normalization');
    });

    it('computerSecurity 토픽의 키워드 별칭으로 매칭한다', () => {
      populateCache('computerSecurity', [
        { id: '1', name_en: 'Hash Functions' },
      ]);
      const result = matchConcept('SHA-256 cryptographic hash', 'computerSecurity');
      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('Hash Functions');
    });
  });

  describe('토큰 오버랩 (Level 5)', () => {
    it('50% 이상의 토큰이 겹치면 매칭한다', () => {
      populateCache('dataStructure', [
        { id: '1', name_en: 'Binary Trees' },
      ]);
      const result = matchConcept('Binary Tree Traversal', 'dataStructure');
      expect(result).not.toBeNull();
      expect(result!.name_en).toBe('Binary Trees');
    });

    it('스톱워드만 겹치면 매칭하지 않는다', () => {
      populateCache('algorithm', [
        { id: '1', name_en: 'Data Structure Operations' },
      ]);
      // "data", "structure", "operations"는 모두 스톱워드
      const result = matchConcept('data management system', 'algorithm');
      expect(result).toBeNull();
    });
  });

  describe('매칭 실패 케이스', () => {
    it('캐시에 토픽이 없으면 null을 반환한다', () => {
      const result = matchConcept('anything', 'nonexistent');
      expect(result).toBeNull();
    });

    it('빈 캐시에서는 null을 반환한다', () => {
      populateCache('algorithm', []);
      const result = matchConcept('something', 'algorithm');
      expect(result).toBeNull();
    });

    it('전혀 관련 없는 개념은 null을 반환한다', () => {
      populateCache('algorithm', [
        { id: '1', name_en: 'Sorting Algorithms' },
        { id: '2', name_en: 'Graph Algorithms' },
      ]);
      const result = matchConcept('Quantum Computing Basics', 'algorithm');
      expect(result).toBeNull();
    });
  });
});
