// src/lib/localStorage.ts
// 로컬스토리지 관리 유틸리티 (SSR 안전)

const KEYS = {
  USERNAME: 'cs-quiz-username',
  LAST_LOGIN_DATE: 'cs-quiz-last-login',
  USER_ID: 'cs-quiz-user-id',
} as const;

// 브라우저 환경 체크
const isBrowser = typeof window !== 'undefined';

/**
 * 저장된 사용자 이름 가져오기
 */
export function getStoredUsername(): string | null {
  if (!isBrowser) return null;
  
  try {
    return localStorage.getItem(KEYS.USERNAME);
  } catch (error) {
    console.error('Failed to get username from localStorage:', error);
    return null;
  }
}

/**
 * 사용자 이름 저장
 */
export function setStoredUsername(username: string): void {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(KEYS.USERNAME, username);
  } catch (error) {
    console.error('Failed to set username in localStorage:', error);
  }
}

/**
 * 저장된 사용자 이름 삭제
 */
export function clearStoredUsername(): void {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(KEYS.USERNAME);
  } catch (error) {
    console.error('Failed to clear username from localStorage:', error);
  }
}

/**
 * 저장된 사용자 ID 가져오기
 */
export function getStoredUserId(): string | null {
  if (!isBrowser) return null;
  
  try {
    return localStorage.getItem(KEYS.USER_ID);
  } catch (error) {
    console.error('Failed to get user ID from localStorage:', error);
    return null;
  }
}

/**
 * 사용자 ID 저장
 */
export function setStoredUserId(userId: string): void {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(KEYS.USER_ID, userId);
  } catch (error) {
    console.error('Failed to set user ID in localStorage:', error);
  }
}

/**
 * 저장된 사용자 ID 삭제
 */
export function clearStoredUserId(): void {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(KEYS.USER_ID);
  } catch (error) {
    console.error('Failed to clear user ID from localStorage:', error);
  }
}

/**
 * 마지막 로그인 날짜 가져오기
 */
export function getLastLoginDate(): string | null {
  if (!isBrowser) return null;
  
  try {
    return localStorage.getItem(KEYS.LAST_LOGIN_DATE);
  } catch (error) {
    console.error('Failed to get last login date from localStorage:', error);
    return null;
  }
}

/**
 * 마지막 로그인 날짜 저장
 */
export function setLastLoginDate(date: string): void {
  if (!isBrowser) return;
  
  try {
    localStorage.setItem(KEYS.LAST_LOGIN_DATE, date);
  } catch (error) {
    console.error('Failed to set last login date in localStorage:', error);
  }
}

/**
 * 모든 사용자 데이터 삭제 (로그아웃 시)
 */
export function clearAllUserData(): void {
  if (!isBrowser) return;
  
  try {
    localStorage.removeItem(KEYS.USERNAME);
    localStorage.removeItem(KEYS.USER_ID);
    localStorage.removeItem(KEYS.LAST_LOGIN_DATE);
  } catch (error) {
    console.error('Failed to clear all user data from localStorage:', error);
  }
}

/**
 * 오늘 날짜 확인 (연속 방문 체크용)
 */
export function isLoginToday(): boolean {
  const lastLogin = getLastLoginDate();
  if (!lastLogin) return false;
  
  const today = new Date().toISOString().split('T')[0];
  return lastLogin === today;
}

/**
 * 오늘 날짜로 로그인 날짜 업데이트
 */
export function updateLoginDate(): void {
  const today = new Date().toISOString().split('T')[0];
  setLastLoginDate(today);
}
