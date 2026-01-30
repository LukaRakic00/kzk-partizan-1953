import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'O nama',
  description: 'KŽK Partizan 1953 - Tradicija, ponos i uspeh od 1953. godine. Saznajte više o našoj istoriji, uspesima i vrednostima kluba.',
  keywords: 'KŽK Partizan, istorija, tradicija, uspesi, trofeji, Partizan 1953',
  url: '/o-nama',
});

export default function ONamaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
