'use client';

import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (params: Record<string, unknown>) => void;
      };
    };
  }
}

interface ShareButtonsProps {
  type: 'daily' | 'topic' | 'review';
  score: number;
  correct: number;
  total: number;
  streak?: number;
}

export default function ShareButtons({ type, score, correct, total, streak }: ShareButtonsProps) {
  const toast = useToast();
  const { t } = useLanguage();

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const params = new URLSearchParams({
    type,
    score: String(score),
    correct: String(correct),
    total: String(total),
  });
  if (streak && streak > 0) params.set('streak', String(streak));
  const shareUrl = `${baseUrl}/share/result?${params.toString()}`;

  const typeLabel: Record<string, string> = { daily: '일일 퀴즈', topic: '주제별 퀴즈', review: '복습 퀴즈' };
  const shareTitle = `CS Quiz ${typeLabel[type]} ${score}점! (${correct}/${total})`;

  const handleKakao = () => {
    if (!window.Kakao) {
      toast.error(t('share.kakaoNotLoaded'));
      return;
    }
    if (!window.Kakao.isInitialized()) {
      const kakaoKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (!kakaoKey) {
        toast.error(t('share.kakaoNotLoaded'));
        return;
      }
      window.Kakao.init(kakaoKey);
    }
    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: shareTitle,
        description: '나도 CS 퀴즈 풀어보기!',
        imageUrl: `${baseUrl}/api/og/quiz-result?${params.toString()}`,
        link: { mobileWebUrl: shareUrl, webUrl: shareUrl },
      },
      buttons: [
        { title: '나도 풀어보기', link: { mobileWebUrl: baseUrl, webUrl: baseUrl } },
      ],
    });
  };

  const handleTwitter = () => {
    const text = encodeURIComponent(shareTitle);
    const url = encodeURIComponent(shareUrl);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('share.linkCopied'));
    } catch {
      toast.error(t('share.copyFailed'));
    }
  };

  const btnBase = 'flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all';

  return (
    <div className="flex gap-2">
      <button onClick={handleKakao} className={`${btnBase} bg-[#FEE500] text-[#191919] hover:bg-[#FDD835]`}>
        카카오톡
      </button>
      <button onClick={handleTwitter} className={`${btnBase} bg-black text-white hover:bg-gray-800`}>
        X
      </button>
      <button onClick={handleCopyLink} className={`${btnBase} bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600`}>
        {t('share.copyLink')}
      </button>
    </div>
  );
}
