import { Metadata } from 'next';
import { redirect } from 'next/navigation';

interface ShareResultPageProps {
  searchParams: {
    type?: string;
    score?: string;
    correct?: string;
    total?: string;
    streak?: string;
    date?: string;
  };
}

export function generateMetadata({ searchParams }: ShareResultPageProps): Metadata {
  const { type = 'daily', score = '0', correct = '0', total = '0', streak } = searchParams;
  const typeLabel: Record<string, string> = { daily: '일일 퀴즈', topic: '주제별 퀴즈', review: '복습 퀴즈' };

  const ogParams = new URLSearchParams({ type, score, correct, total });
  if (streak) ogParams.set('streak', streak);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://cs-quiz-ten.vercel.app';

  return {
    title: `CS Quiz ${typeLabel[type] || '퀴즈'} ${score}점!`,
    description: `${correct}/${total} 정답 — 나도 풀어보기!`,
    openGraph: {
      title: `CS Quiz ${typeLabel[type] || '퀴즈'} ${score}점!`,
      description: `${correct}/${total} 정답 — 나도 풀어보기!`,
      images: [`${baseUrl}/api/og/quiz-result?${ogParams.toString()}`],
    },
  };
}

export default function ShareResultPage() {
  redirect('/');
}
