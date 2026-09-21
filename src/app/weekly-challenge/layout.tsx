import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '주간 챌린지',
  description: '이번 주 주제로 실력을 겨루는 주간 챌린지. 정답률과 순위를 다른 사용자와 비교해 보세요.',
};

export default function WeeklyChallengeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
