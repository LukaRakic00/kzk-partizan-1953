import type { Metadata, Viewport } from 'next';
import { Montserrat, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

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
    icon: '/favicon.ico',
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
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className={`${montserrat.variable} ${playfair.variable}`}>
      <body>
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

