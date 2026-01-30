import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';
import { generateMetadata as generateSEOMetadata, generateArticleSchema } from '@/lib/seo-utils';
import VestiDetailClient from './VestiDetailClient';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connectDB();
  const news = await News.findOne({ slug: params.slug, published: true });

  if (!news) {
    return {
      title: 'Vest nije pronađena | KŽK Partizan',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const image = news.image || 'https://kzkpartizan.rs/kzk_partizan.png';
  const url = `https://kzkpartizan.rs/vesti/${news.slug}`;
  const publishedTime = news.publishedAt ? new Date(news.publishedAt).toISOString() : undefined;
  const modifiedTime = news.updatedAt ? new Date(news.updatedAt).toISOString() : publishedTime;

  return generateSEOMetadata({
    title: news.title,
    description: news.excerpt || news.content.substring(0, 160),
    keywords: `KŽK Partizan, ${news.category}, ženska košarka, vesti`,
    image,
    url: `/vesti/${news.slug}`,
    type: 'article',
    publishedTime,
    modifiedTime,
    author: news.author,
    category: news.category,
  });
}

export default async function VestiDetailPage({ params }: PageProps) {
  await connectDB();
  const news = await News.findOne({ slug: params.slug, published: true });

  if (!news) {
    notFound();
  }

  const articleSchema = generateArticleSchema({
    title: news.title,
    description: news.excerpt || news.content.substring(0, 160),
    image: news.image || 'https://kzkpartizan.rs/kzk_partizan.png',
    publishedTime: news.publishedAt ? new Date(news.publishedAt).toISOString() : undefined,
    modifiedTime: news.updatedAt ? new Date(news.updatedAt).toISOString() : undefined,
    author: news.author,
    url: `https://kzkpartizan.rs/vesti/${news.slug}`,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <VestiDetailClient news={JSON.parse(JSON.stringify(news))} />
    </>
  );
}

