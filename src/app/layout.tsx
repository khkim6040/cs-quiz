import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Tailwind CSS가 포함된 전역 CSS 임포트 (Next.js가 src/app 기준으로 경로 해석)
import { AuthProvider } from "@/contexts/AuthContext";
import UserMenu from "@/components/UserMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CS 지식 퀴즈",
  description: "컴퓨터 과학 지식을 퀴즈로 쉽고 재미있게 배워보세요!",
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
              <a href="/" className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all">
                CS Quiz 💻
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
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}