import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Tailwind CSS가 포함된 전역 CSS 임포트 (Next.js가 src/app 기준으로 경로 해석)
import { AuthProvider } from "@/contexts/AuthContext";
import UserMenu from "@/components/UserMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CS 지식 퀴즈",
  description: "컴퓨터 과학 지식을 퀴즈로 쉽고 재미있게 배워보세요!",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' style='stop-color:rgb(251,146,60);stop-opacity:1'/><stop offset='100%' style='stop-color:rgb(245,158,11);stop-opacity:1'/></linearGradient></defs><rect width='100' height='100' rx='20' fill='url(%23grad)'/><path fill='none' stroke='white' stroke-width='6' stroke-linecap='round' stroke-linejoin='round' d='M40.3 71h19.5M50 12.5v4.2m26.5 6.8l-3 3M87.5 50h-4.2M16.7 50h-4.2M27.6 23.6l-3-3m11.8 41.2a20.8 20.8 0 1129.5 0l-2.3 2.3a14 14 0 00-4.1 9.9v2.2a8.3 8.3 0 11-16.7 0V77a14 14 0 00-4.1-9.9l-2.3-2.3z'/></svg>",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          {/* 헤더 */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <a href="/" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-gray-900 group-hover:text-orange-600 transition-colors">
                  CS Quiz
                </span>
              </a>
              <UserMenu />
            </div>
          </header>

          {/* 메인 컨텐츠 */}
          <main>
            {children}
          </main>

          {/* 푸터 */}
          <footer className="bg-white border-t border-gray-200 mt-auto">
            <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
              <p>&copy; {new Date().getFullYear()} CS Quiz</p>
              <p className="mt-1">
                Made by{' '}
                <a
                  href="https://github.com/khkim6040"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  khkim6040
                </a>
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}