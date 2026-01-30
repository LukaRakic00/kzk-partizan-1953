import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Klub',
  description: 'Upravni odbor i menadžment KŽK Partizan 1953. Upoznajte ljude koji vode klub ka novim uspesima.',
  keywords: 'KŽK Partizan, upravni odbor, menadžment, klub, organizacija',
  url: '/klub',
});

export default function KlubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
