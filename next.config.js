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

