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
import { getTranslations } from '@/lib/translations';
import type { Language } from '@/lib/translations';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, language?: Language) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          setStoredUsername(data.user.username);
          setStoredUserId(data.user.id);
          updateLoginDate();
          return;
        }
      }

      const storedUsername = getStoredUsername();
      if (storedUsername) {
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

      setUser(null);
    } catch (error) {
      console.error('Failed to check auth:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, language: Language = 'ko'): Promise<{ success: boolean; error?: string }> => {
    const t = getTranslations(language);
    try {
      const trimmedUsername = username.trim();

      if (!trimmedUsername) {
        return { success: false, error: t.auth.enterNickname };
      }
      if (trimmedUsername.length > 15) {
        return { success: false, error: t.auth.maxLength };
      }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        return { success: false, error: errorData.error || t.auth.loginFailed };
      }

      const data = await res.json();
      setUser(data.user);

      setStoredUsername(data.user.username);
      setStoredUserId(data.user.id);
      updateLoginDate();

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const t = getTranslations(language);
      return { success: false, error: t.daily.networkError };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearAllUserData();
    }
  }, []);

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
