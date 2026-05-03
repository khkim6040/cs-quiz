'use client';

import { useToasts, ToastType } from '@/contexts/ToastContext';
import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

const iconMap: Record<ToastType, string> = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-600 dark:bg-green-700',
  error: 'bg-red-600 dark:bg-red-700',
  info: 'bg-gray-700 dark:bg-gray-600',
};

export default function ToastContainer() {
  const toasts = useToasts();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || toasts.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${colorMap[t.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 min-w-[200px] max-w-[360px] animate-in slide-in-from-right duration-200`}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconMap[t.type]} />
          </svg>
          <span className="text-sm font-medium">{t.message}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
