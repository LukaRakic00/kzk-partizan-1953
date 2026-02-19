import { Metadata } from 'next';

export const defaultMetadata: Metadata = {
  title: 'KŽK Partizan - Ženski Košarkaški Klub',
  description: 'Zvanični sajt Ženskog Košarkaškog Kluba Partizan. Pratite naš tim, rezultate, vesti i više.',
  keywords: 'KŽK Partizan, ženska košarka, Partizan, košarka, Beograd, ženski košarkaški klub',
  authors: [{ name: 'KŽK Partizan' }],
  openGraph: {
    title: 'KŽK Partizan - Ženski Košarkaški Klub',
    description: 'Zvanični sajt Ženskog Košarkaškog Kluba Partizan',
    type: 'website',
    locale: 'sr_RS',
    siteName: 'KŽK Partizan',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KŽK Partizan - Ženski Košarkaški Klub',
    description: 'Zvanični sajt Ženskog Košarkaškog Kluba Partizan',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  alternates: {
    canonical: 'https://kzkpartizan1953.rs',
  },
};

