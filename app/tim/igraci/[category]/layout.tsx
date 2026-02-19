import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo-utils';

const CATEGORY_META: Record<
  string,
  { title: string; description: string; keywords: string }
> = {
  seniori: {
    title: 'Seniori',
    description:
      'Igračice seniorske selekcije KŽK Partizan 1953. Upoznajte naš A tim i košarkašice koje predstavljaju klub u najvišem rangu.',
    keywords:
      'KŽK Partizan, seniori, ženska košarka, košarkašice, prva liga, Beograd',
  },
  juniori: {
    title: 'Juniori',
    description:
      'Juniorska selekcija KŽK Partizan 1953. Buduće zvezde ženske košarke - upoznajte igračice koje nastupaju u juniorskim takmičenjima.',
    keywords:
      'KŽK Partizan, juniori, ženska košarka, juniorska selekcija, košarkašice',
  },
  kadetkinje: {
    title: 'Kadetkinje',
    description:
      'Kadetska selekcija KŽK Partizan 1953. Mlade košarkašice na putu ka vrhunskom košarkaškom obrazovanju i takmičenjima.',
    keywords:
      'KŽK Partizan, kadetkinje, ženska košarka, kadetska selekcija, mladi tim',
  },
  pionirke: {
    title: 'Pionirke',
    description:
      'Pionirska selekcija KŽK Partizan 1953. Najmlađi članovi kluba - upoznajte buduće košarkašice koje stiču osnove u Školi košarke.',
    keywords:
      'KŽK Partizan, pionirke, ženska košarka, škola košarke, najmlađi igrači',
  },
};

const VALID_CATEGORIES = Object.keys(CATEGORY_META);

type Props = {
  children: React.ReactNode;
  params: { category: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = params;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return {
      title: 'Kategorija nije pronađena | KŽK Partizan',
      robots: { index: false, follow: false },
    };
  }

  const meta = CATEGORY_META[category];
  return generateSEOMetadata({
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    url: `/tim/igraci/${category}`,
  });
}

export default function IgraciCategoryLayout({ children }: Props) {
  return children;
}
