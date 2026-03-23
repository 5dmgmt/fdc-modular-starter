/**
 * app/layout.tsx
 *
 * ルートレイアウト（ミニマルスターター版）
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ANCC Workshop スターター',
  description: 'ANCC Workshop - スターター',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
