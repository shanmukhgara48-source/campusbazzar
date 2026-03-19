import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'CampusBazaar — Campus-Only Student Marketplace',
  description: 'Buy, sell, and connect with verified students on your campus. Safe transactions, real-time chat, campus-only access.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} bg-[#0a0a0a] text-white antialiased`}>{children}</body>
    </html>
  );
}
