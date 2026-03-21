import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

// window와 localStorage를 글로벌에 설정
beforeEach(() => {
  (globalThis as any).window = {};
  (globalThis as any).localStorage = localStorageMock;
  localStorageMock.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  delete (globalThis as any).window;
  delete (globalThis as any).localStorage;
  vi.resetModules();
});

describe('localStorage 유틸리티', () => {
  it('username을 저장하고 조회할 수 있다', async () => {
    const { setStoredUsername, getStoredUsername } = await import('../localStorage');
    setStoredUsername('testUser');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cs-quiz-username', 'testUser');
  });

  it('userId를 저장하고 조회할 수 있다', async () => {
    const { setStoredUserId } = await import('../localStorage');
    setStoredUserId('user-123');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cs-quiz-user-id', 'user-123');
  });

  it('로그인 날짜를 저장한다', async () => {
    const { setLastLoginDate, getLastLoginDate } = await import('../localStorage');
    setLastLoginDate('2024-01-15');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('cs-quiz-last-login', '2024-01-15');
  });

  it('clearAllUserData가 모든 키를 제거한다', async () => {
    const { clearAllUserData } = await import('../localStorage');
    clearAllUserData();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cs-quiz-username');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cs-quiz-user-id');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('cs-quiz-last-login');
  });
});
