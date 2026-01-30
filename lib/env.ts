/**
 * Environment variable validation and configuration
 * Ensures all required environment variables are set
 */

function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(
      `Missing required environment variable: ${key}. ` +
      `Please add it to your .env file or environment configuration.`
    );
  }
  
  return value;
}

function getOptionalEnvVar(key: string, defaultValue?: string): string | undefined {
  return process.env[key] || defaultValue;
}

// Validate and export environment variables
export const env = {
  // Database
  MONGODB_URI: getEnvVar('MONGODB_URI'),
  MONGO_DB: getOptionalEnvVar('MONGO_DB', 'KZKPartizanDB'),
  
  // JWT - CRITICAL: No default value for security
  JWT_SECRET: getEnvVar('JWT_SECRET'),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: getEnvVar('CLOUDINARY_CLOUD_NAME'),
  CLOUDINARY_API_KEY: getEnvVar('CLOUDINARY_API_KEY'),
  CLOUDINARY_API_SECRET: getEnvVar('CLOUDINARY_API_SECRET'),
  
  // API
  NEXT_PUBLIC_API_URL: getOptionalEnvVar('NEXT_PUBLIC_API_URL', 'http://localhost:3000'),
  
  // Optional
  NODE_ENV: getOptionalEnvVar('NODE_ENV', 'development'),
  VERCEL: getOptionalEnvVar('VERCEL'),
  VERCEL_ENV: getOptionalEnvVar('VERCEL_ENV'),
  
  // Cron secrets
  CRON_SECRET: getOptionalEnvVar('CRON_SECRET'),
  WABA_UPDATE_API_KEY: getOptionalEnvVar('WABA_UPDATE_API_KEY'),
} as const;

// Validate environment on module load (only in production)
if (env.NODE_ENV === 'production') {
  // Additional production checks
  if (env.JWT_SECRET.length < 32) {
    console.warn(
      'WARNING: JWT_SECRET should be at least 32 characters long for production security.'
    );
  }
}
