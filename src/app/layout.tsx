import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GATE CS 2027 Preparation — Under 100 Rank',
  description: 'Personal GATE CS 2027 preparation tracker. Following my journey to achieve an under 100 rank in GATE CS.',
  keywords: ['GATE preparation', 'GATE CS 2027', 'study tracker', 'under 100 rank'],
  openGraph: {
    title: 'GATE CS 2027 Preparation — Under 100 Rank',
    description: 'Follow my GATE CS 2027 preparation journey. 72 tasks, 12 subjects, one goal.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
