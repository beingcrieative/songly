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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
  },
  themeColor: '#FF1744',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Studio',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-touch-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-touch-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-touch-icon-167x167.png', sizes: '167x167', type: 'image/png' },
      { url: '/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
