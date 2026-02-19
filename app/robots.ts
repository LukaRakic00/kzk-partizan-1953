import { MetadataRoute } from 'next';

const allowAndDisallow = {
  allow: '/',
  disallow: ['/admin/', '/api/'],
};

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: 'Googlebot', ...allowAndDisallow },
      { userAgent: 'Bingbot', ...allowAndDisallow },
      { userAgent: 'Twitterbot', ...allowAndDisallow },
      { userAgent: 'facebookexternalhit', ...allowAndDisallow },
      { userAgent: '*', ...allowAndDisallow },
    ],
    sitemap: 'https://kzkpartizan1953.rs/sitemap.xml',
  };
}
