/**
 * app/layout.tsx
 *
 * ルートレイアウト（ミニマルスターター版）
 */

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FDC Modular Starter',
  description: 'Founders Direct Cockpit - Modular Starter',
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
