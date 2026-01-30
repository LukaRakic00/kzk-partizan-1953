import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Vesti',
  description: 'Pratite najnovije vesti i dešavanja u KŽK Partizan 1953. Rezultati, intervjui, transferi i sve što se dešava u klubu.',
  keywords: 'KŽK Partizan, vesti, novosti, ženska košarka, Partizan, Beograd',
  url: '/vesti',
});

export default function VestiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
