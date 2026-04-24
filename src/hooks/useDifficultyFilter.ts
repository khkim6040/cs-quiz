'use client';

import { useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';

const STORAGE_KEY = 'cs-quiz-difficulty-filter';
const ALL_DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const;

function readFromStorage(): Set<string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = stored
      .split(',')
      .map((d) => d.trim())
      .filter((d) => (ALL_DIFFICULTIES as readonly string[]).includes(d));
    return parsed.length > 0 ? new Set(parsed) : null;
  } catch {
    return null;
  }
}

function saveToStorage(difficulties: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, Array.from(difficulties).sort().join(','));
  } catch {
    // storage full or blocked — ignore
  }
}

function syncToUrl(difficulties: Set<string>) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (difficulties.size === ALL_DIFFICULTIES.length) {
    url.searchParams.delete('difficulty');
  } else {
    url.searchParams.set('difficulty', Array.from(difficulties).sort().join(','));
  }
  window.history.replaceState(null, '', url.toString());
}

function resolveInitial(searchParams: URLSearchParams): Set<string> {
  // 1. URL param
  const urlParam = searchParams.get('difficulty');
  if (urlParam) {
    const fromUrl = urlParam
      .split(',')
      .map((d) => d.trim())
      .filter((d) => (ALL_DIFFICULTIES as readonly string[]).includes(d));
    if (fromUrl.length > 0) return new Set(fromUrl);
  }

  // 2. localStorage
  const fromStorage = readFromStorage();
  if (fromStorage) return fromStorage;

  // 3. default
  return new Set(ALL_DIFFICULTIES);
}

export function useDifficultyFilter() {
  const searchParams = useSearchParams();
  const [selectedDifficulties, setSelectedDifficulties] = useState<Set<string>>(
    () => resolveInitial(searchParams)
  );

  const difficultyParam =
    selectedDifficulties.size === ALL_DIFFICULTIES.length
      ? ''
      : Array.from(selectedDifficulties).sort().join(',');

  const handleDifficultyToggle = useCallback((difficulty: string) => {
    setSelectedDifficulties((prev) => {
      let next: Set<string>;
      if (prev.size === ALL_DIFFICULTIES.length) {
        // 전체 선택 상태에서 클릭 → 해당 필터만 켜기
        next = new Set([difficulty]);
      } else if (prev.has(difficulty)) {
        if (prev.size === 1) return prev; // 최소 1개 유지
        next = new Set(prev);
        next.delete(difficulty);
      } else {
        next = new Set(prev);
        next.add(difficulty);
      }
      saveToStorage(next);
      syncToUrl(next);
      return next;
    });
  }, []);

  return { selectedDifficulties, difficultyParam, handleDifficultyToggle };
}
