import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CampusBazaar Admin',
  description: 'Admin dashboard for CampusBazaar platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
