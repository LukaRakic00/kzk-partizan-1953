import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Galerija',
  description: 'Galerija fotografija KŽK Partizan 1953. Prolazite kroz naše najlepše trenutke, mečeve, treninge i uspehe kroz godine.',
  keywords: 'KŽK Partizan, galerija, fotografije, slike, mečevi, treningi',
  url: '/galerija',
});

export default function GalerijaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
