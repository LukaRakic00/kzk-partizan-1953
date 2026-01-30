import { Metadata } from 'next';
import { defaultMetadata } from '@/app/metadata';

const baseUrl = 'https://kzkpartizan.rs';

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  category?: string;
  noindex?: boolean;
}

export function generateMetadata(config: SEOConfig): Metadata {
  const title = config.title 
    ? `${config.title} | KŽK Partizan`
    : defaultMetadata.title as string;
  
  const description = config.description || defaultMetadata.description as string;
  const url = config.url ? `${baseUrl}${config.url}` : baseUrl;
  const image = config.image || `${baseUrl}/kzk_partizan.png`;

  return {
    title,
    description,
    keywords: config.keywords || defaultMetadata.keywords as string,
    authors: defaultMetadata.authors,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'KŽK Partizan',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'sr_RS',
      type: config.type || 'website',
      ...(config.type === 'article' && {
        publishedTime: config.publishedTime,
        modifiedTime: config.modifiedTime,
        authors: config.author ? [config.author] : undefined,
        section: config.category,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    robots: {
      index: !config.noindex,
      follow: !config.noindex,
      googleBot: {
        index: !config.noindex,
        follow: !config.noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function generateArticleSchema(article: {
  title: string;
  description: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  url: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    image: article.image ? [article.image] : undefined,
    datePublished: article.publishedTime,
    dateModified: article.modifiedTime || article.publishedTime,
    author: article.author
      ? {
          '@type': 'Person',
          name: article.author,
        }
      : {
          '@type': 'Organization',
          name: 'KŽK Partizan',
        },
    publisher: {
      '@type': 'Organization',
      name: 'KŽK Partizan',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/kzk_partizan.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
  };
}

export function generateImageObjectSchema(image: {
  url: string;
  caption?: string;
  description?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    contentUrl: image.url,
    description: image.description || image.caption,
    caption: image.caption,
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
