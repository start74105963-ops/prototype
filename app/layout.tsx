import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "パチンコ台判別ツール",
  description: "グラフ画像から投資額・持ち玉・回転率を算出する台判別ツール",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-full bg-[#0f1115] text-[#e8eaed] antialiased">
        {children}
      </body>
    </html>
  );
}
