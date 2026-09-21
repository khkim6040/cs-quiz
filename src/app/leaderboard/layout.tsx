import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '리더보드',
  description: '오늘의 퀴즈 점수 순위. 다른 사용자와 CS 실력을 겨뤄 보세요.',
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
