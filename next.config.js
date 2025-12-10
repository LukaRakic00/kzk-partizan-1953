/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Optimizovane dimenzije za brže učitavanje
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Omogućava format optimizaciju
    formats: ['image/avif', 'image/webp'],
    // Cache optimizacija
    minimumCacheTTL: 60,
    // Optimizacija za Cloudinary
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  env: {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
  webpack: (config, { isServer }) => {
    // Exclude Puppeteer and related packages from bundling
    // They should be loaded at runtime
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'puppeteer-core': 'commonjs puppeteer-core',
        'puppeteer': 'commonjs puppeteer',
        '@sparticuz/chromium': 'commonjs @sparticuz/chromium',
        'playwright': 'commonjs playwright',
      });
    }
    return config;
  },
}

module.exports = nextConfig

