'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getStoredUsername,
  setStoredUsername,
  getStoredUserId,
  setStoredUserId,
  clearAllUserData,
  updateLoginDate,
} from '@/lib/localStorage';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * 인증 상태 확인 (쿠키 → 로컬스토리지)
   */
  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. 서버에 쿠키 기반 인증 확인
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          // 로컬스토리지도 동기화
          setStoredUsername(data.user.username);
          setStoredUserId(data.user.id);
          updateLoginDate();
          return;
        }
      }

      // 2. 쿠키 없으면 로컬스토리지 확인
      const storedUsername = getStoredUsername();
      if (storedUsername) {
        // 로컬스토리지에 username이 있으면 자동 로그인 시도
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: storedUsername }),
        });

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          setUser(loginData.user);
          setStoredUserId(loginData.user.id);
          updateLoginDate();
          return;
        }
      }

      // 3. 둘 다 없으면 비로그인 상태
      setUser(null);
    } catch (error) {
      console.error('Failed to check auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 로그인
   */
  const login = useCallback(async (username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const trimmedUsername = username.trim();
      
      // 유효성 검사
      if (!trimmedUsername) {
        return { success: false, error: '닉네임을 입력해주세요' };
      }
      if (trimmedUsername.length > 15) {
        return { success: false, error: '닉네임은 15자 이하로 입력해주세요' };
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return { success: false, error: errorData.error || '로그인에 실패했습니다' };
      }

      const data = await res.json();
      setUser(data.user);
      
      // 로컬스토리지에 저장
      setStoredUsername(data.user.username);
      setStoredUserId(data.user.id);
      updateLoginDate();

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: '네트워크 오류가 발생했습니다' };
    }
  }, []);

  /**
   * 로그아웃
   */
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 상태 초기화
      setUser(null);
      clearAllUserData();
    }
  }, []);

  // 마운트 시 인증 확인
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Auth Context Hook
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
