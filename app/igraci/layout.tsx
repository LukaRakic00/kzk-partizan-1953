import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Igrači',
  description: 'Upoznajte igračice KŽK Partizan 1953. Seniori, juniori, kadetkinje i pionirke - naša budućnost košarke.',
  keywords: 'KŽK Partizan, igrači, košarkašice, seniori, juniori, kadetkinje, pionirke',
  url: '/igraci',
});

export default function IgraciLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
