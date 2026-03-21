import { describe, it, expect } from 'vitest';
import { isTrueFalseQuestion, clampBatchSize } from '../question';

const makeOption = (text_en: string, isCorrect = false) => ({
  id: '1',
  text_ko: text_en,
  text_en,
  rationale_ko: '',
  rationale_en: '',
  isCorrect,
});

describe('isTrueFalseQuestion', () => {
  it('True/False 보기 2개면 true를 반환한다', () => {
    const options = [makeOption('True'), makeOption('False')];
    expect(isTrueFalseQuestion(options)).toBe(true);
  });

  it('대소문자를 구분하지 않는다', () => {
    const options = [makeOption('TRUE'), makeOption('false')];
    expect(isTrueFalseQuestion(options)).toBe(true);
  });

  it('앞뒤 공백을 무시한다', () => {
    const options = [makeOption('  True  '), makeOption('  False  ')];
    expect(isTrueFalseQuestion(options)).toBe(true);
  });

  it('보기가 3개 이상이면 false를 반환한다', () => {
    const options = [
      makeOption('True'),
      makeOption('False'),
      makeOption('Maybe'),
    ];
    expect(isTrueFalseQuestion(options)).toBe(false);
  });

  it('보기가 1개면 false를 반환한다', () => {
    const options = [makeOption('True')];
    expect(isTrueFalseQuestion(options)).toBe(false);
  });

  it('True/False가 아닌 2개 보기면 false를 반환한다', () => {
    const options = [makeOption('Yes'), makeOption('No')];
    expect(isTrueFalseQuestion(options)).toBe(false);
  });

  it('빈 배열이면 false를 반환한다', () => {
    expect(isTrueFalseQuestion([])).toBe(false);
  });

  it('True만 2개면 false를 반환한다', () => {
    const options = [makeOption('True'), makeOption('True')];
    expect(isTrueFalseQuestion(options)).toBe(false);
  });
});

describe('clampBatchSize', () => {
  it('null이면 기본값 1을 반환한다', () => {
    expect(clampBatchSize(null)).toBe(1);
  });

  it('정상 범위의 숫자를 그대로 반환한다', () => {
    expect(clampBatchSize('5')).toBe(5);
    expect(clampBatchSize('10')).toBe(10);
  });

  it('최대값을 초과하면 최대값으로 클램핑한다', () => {
    expect(clampBatchSize('100')).toBe(20);
    expect(clampBatchSize('21')).toBe(20);
  });

  it('0 이하면 1로 클램핑한다', () => {
    expect(clampBatchSize('0')).toBe(1);
    expect(clampBatchSize('-5')).toBe(1);
  });

  it('숫자가 아닌 문자열이면 1을 반환한다', () => {
    expect(clampBatchSize('abc')).toBe(1);
  });

  it('빈 문자열이면 1을 반환한다', () => {
    expect(clampBatchSize('')).toBe(1);
  });

  it('커스텀 maxBatchSize를 적용한다', () => {
    expect(clampBatchSize('15', 10)).toBe(10);
    expect(clampBatchSize('5', 10)).toBe(5);
  });
});
