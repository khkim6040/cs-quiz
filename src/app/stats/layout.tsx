import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '내 통계',
  description: '내 퀴즈 기록, 정답률, 연속 출석 통계',
  robots: { index: false },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
