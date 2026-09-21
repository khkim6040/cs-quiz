import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '오답 노트',
  description: '틀린 문제를 간격 반복으로 다시 복습하는 오답 노트',
  robots: { index: false },
};

export default function WrongNotesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
