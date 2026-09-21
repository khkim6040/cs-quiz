import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import UserMenu from "@/components/UserMenu";
import LanguageToggle from "@/components/LanguageToggle";
import FeedbackButton from "@/components/FeedbackButton";
import DarkModeToggle from "@/components/DarkModeToggle";
import { ToastProvider } from "@/contexts/ToastContext";
import ToastContainer from "@/components/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "CS 퀴즈",
    "컴퓨터 과학",
    "코딩 테스트",
    "기술 면접",
    "자료구조",
    "알고리즘",
    "운영체제",
    "네트워크",
    "데이터베이스",
    "컴퓨터 구조",
    "소프트웨어 공학",
    "Spring Boot",
    "CS quiz",
    "computer science",
  ],
  authors: [{ name: "khkim6040", url: "https://github.com/khkim6040" }],
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  alternates: {
    canonical: SITE_URL,
  },
  verification: {
    google: "GDwmygJGORbNaZT72apCcEKi9XSH0wcvvJ7XKpYy70A",
    other: {
      "naver-site-verification": "6d0b1a926c2b1477c0af04141bce53a8429b1266",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('darkMode');var dark=s==='true'||(s===null&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(dark)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        <script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2ezmFnkrysYjmMbgGHpJiPlXBl/PKmwOMSWN+x54oEXmG"
          crossOrigin="anonymous"
          async
        />
      </head>
      <body className={`${inter.className} antialiased`}>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
            {/* 헤더 */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40 shadow-sm">
              <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <Link href="/" aria-label="CS Quiz 홈" className="flex items-center gap-3 group focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 transition-colors">
                    CS Quiz
                  </span>
                </Link>
                <div className="flex items-center gap-3">
                  <DarkModeToggle />
                  <LanguageToggle />
                  <UserMenu />
                </div>
              </div>
            </header>

            {/* 메인 컨텐츠 */}
            <main>
              {children}
            </main>

            {/* 푸터 */}
            <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
              <div className="container mx-auto px-4 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                <p>&copy; {new Date().getFullYear()} CS Quiz</p>
                <p className="mt-1">
                  Made by{' '}
                  <a
                    href="https://github.com/khkim6040"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 hover:text-orange-700 font-medium transition-colors focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-1 rounded"
                  >
                    khkim6040
                  </a>
                </p>
              </div>
            </footer>
            <FeedbackButton />
            <ToastContainer />
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
          </>
        )}
        <Analytics />
      </body>
    </html>
  );
}
