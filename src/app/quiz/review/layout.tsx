import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '복습 퀴즈',
  description: '오답 노트의 문제를 다시 푸는 복습 퀴즈',
  robots: { index: false },
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
