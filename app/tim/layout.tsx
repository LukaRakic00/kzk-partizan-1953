import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Tim',
  description: 'Tim KŽK Partizan 1953. Upoznajte našu ekipu, stručni štab i sve koji čine naš klub uspešnim.',
  keywords: 'KŽK Partizan, tim, ekipa, stručni štab, treneri, košarkašice',
  url: '/tim',
});

export default function TimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
