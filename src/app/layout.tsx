import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Donewell · Methodist Business Hub',
  description: 'Methodist business dashboard and branch engagement tracker — Donewell Insurance Ltd.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
