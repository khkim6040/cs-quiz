'use client';

import { useLanguage } from '@/contexts/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
      className="px-3 py-1.5 text-sm font-bold rounded-full border-2 border-gray-300 hover:border-orange-500 transition-colors bg-white text-gray-700"
      aria-label="Toggle language"
    >
      {language === 'ko' ? 'EN' : 'KO'}
    </button>
  );
}
