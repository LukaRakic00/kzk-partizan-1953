import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils';

export const metadata: Metadata = generateSEOMetadata({
  title: 'Kontakt',
  description: 'Kontaktirajte KŽK Partizan 1953. Adresa, telefon, email i lokacija kluba. Slobodno nas kontaktirajte za sve dodatne informacije.',
  keywords: 'KŽK Partizan, kontakt, adresa, telefon, email, lokacija, Beograd',
  url: '/kontakt',
});

export default function KontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
