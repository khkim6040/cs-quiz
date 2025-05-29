import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Tailwind CSS가 포함된 전역 CSS 임포트 (Next.js가 src/app 기준으로 경로 해석)

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
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}