import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientBoot from '@/components/ClientBoot';
import { I18nProvider } from '@/providers/I18nProvider';
import RootProvider from '@/providers/RootProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '700', '900'],
});

export const metadata: Metadata = {
  title: 'Liefdesliedje Studio',
  description:
    'Maak binnen een paar minuten een persoonlijk liefdesliedje met AI-lyrics en muziekcompositie.',
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isVisualRefresh = process.env.NEXT_PUBLIC_VISUAL_REFRESH !== 'false';
  return (
    <html
      lang="nl"
      suppressHydrationWarning
      data-visual-refresh={isVisualRefresh ? 'true' : 'false'}
    >
      <body className={`${inter.variable} antialiased`}>
        <RootProvider>
          <I18nProvider>
            <ClientBoot />
            {children}
          </I18nProvider>
        </RootProvider>
      </body>
    </html>
  );
}
