import type { Metadata, Viewport } from 'next';
import { Montserrat, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import BreadcrumbsSchema from '@/components/BreadcrumbsSchema';

const montserrat = Montserrat({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'KŽK Partizan - Ženski Košarkaški Klub',
  description: 'Zvanični sajt Ženskog Košarkaškog Kluba Partizan. Pratite naš tim, rezultate, vesti i više.',
  keywords: 'KŽK Partizan, ženska košarka, Partizan, košarka, Beograd',
  authors: [{ name: 'KŽK Partizan' }],
  icons: {
    icon: [
      // Base64 inline favicon za Google i druge servise (brže učitavanje)
      { 
        url: 'data:image/png;base64,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',
        type: 'image/png',
        sizes: '32x32',
      },
      // Standardni favicon fajlovi za browser kompatibilnost
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon_io/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_io/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon_io/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/favicon_io/site.webmanifest',
  verification: {
    google: 'sV45RR4i84uVJcdGMhNtvXPXs3NCnOquoKXatpf5Fhs',
  },
  openGraph: {
    title: 'KŽK Partizan - Ženski Košarkaški Klub',
    description: 'Zvanični sajt Ženskog Košarkaškog Kluba Partizan',
    type: 'website',
    locale: 'sr_RS',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 0.85,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className={`${montserrat.variable} ${playfair.variable}`}>
      <body>
        <BreadcrumbsSchema />
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              color: '#000000',
              border: '1px solid #000000',
            },
          }}
        />
      </body>
    </html>
  );
}

