#!/usr/bin/env bun

/**
 * Skripta za proveru da li je sve spremno za deployment
 * Pokreni: bun run scripts/check-deployment.ts
 */

const requiredEnvVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'NEXT_PUBLIC_API_URL',
];

const optionalEnvVars = [
  'MONGO_DB',
  'NEXTAUTH_SECRET',
  'SCRAPINGBEE_API_KEY',
];

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

const checks: CheckResult[] = [];

// Proveri environment varijable
console.log('🔍 Proveravam environment varijable...\n');

requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    checks.push({
      name: varName,
      status: 'fail',
      message: `❌ Nedostaje obavezna varijabla: ${varName}`,
    });
  } else if (varName.includes('SECRET') || varName.includes('PASSWORD')) {
    checks.push({
      name: varName,
      status: 'pass',
      message: `✅ ${varName} je postavljen (skriven)`,
    });
  } else {
    // Prikaži samo prvi i poslednji karakter za sigurnost
    const masked = value.length > 10 
      ? `${value.substring(0, 4)}...${value.substring(value.length - 4)}`
      : '***';
    checks.push({
      name: varName,
      status: 'pass',
      message: `✅ ${varName} = ${masked}`,
    });
  }
});

optionalEnvVars.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    checks.push({
      name: varName,
      status: 'warning',
      message: `⚠️  Opciona varijabla nije postavljena: ${varName}`,
    });
  } else {
    checks.push({
      name: varName,
      status: 'pass',
      message: `✅ ${varName} je postavljen`,
    });
  }
});

// Proveri MongoDB connection string format
console.log('🔍 Proveravam MongoDB connection string...\n');
const mongoUri = process.env.MONGODB_URI;
if (mongoUri) {
  if (mongoUri.startsWith('mongodb://') || mongoUri.startsWith('mongodb+srv://')) {
    checks.push({
      name: 'MongoDB URI Format',
      status: 'pass',
      message: '✅ MongoDB URI format je ispravan',
    });
  } else {
    checks.push({
      name: 'MongoDB URI Format',
      status: 'fail',
      message: '❌ MongoDB URI format nije ispravan (mora počinjati sa mongodb:// ili mongodb+srv://)',
    });
  }
  
  // Proveri da li sadrži username i password
  if (mongoUri.includes('@') && !mongoUri.includes('://:@')) {
    checks.push({
      name: 'MongoDB Credentials',
      status: 'pass',
      message: '✅ MongoDB credentials su prisutni',
    });
  } else {
    checks.push({
      name: 'MongoDB Credentials',
      status: 'fail',
      message: '❌ MongoDB URI ne sadrži username/password',
    });
  }
}

// Proveri Cloudinary credentials
console.log('🔍 Proveravam Cloudinary konfiguraciju...\n');
const cloudinaryName = process.env.CLOUDINARY_CLOUD_NAME;
const cloudinaryKey = process.env.CLOUDINARY_API_KEY;
const cloudinarySecret = process.env.CLOUDINARY_API_SECRET;

if (cloudinaryName && cloudinaryKey && cloudinarySecret) {
  checks.push({
    name: 'Cloudinary Config',
    status: 'pass',
    message: '✅ Cloudinary konfiguracija je kompletna',
  });
} else {
  checks.push({
    name: 'Cloudinary Config',
    status: 'fail',
    message: '❌ Cloudinary konfiguracija nije kompletna',
  });
}

// Proveri API URL
console.log('🔍 Proveravam API URL...\n');
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
if (apiUrl) {
  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    checks.push({
      name: 'API URL Format',
      status: 'pass',
      message: `✅ API URL format je ispravan: ${apiUrl}`,
    });
  } else {
    checks.push({
      name: 'API URL Format',
      status: 'fail',
      message: '❌ API URL mora počinjati sa http:// ili https://',
    });
  }
}

// Proveri da li postoji .env fajl
console.log('🔍 Proveravam fajlove...\n');
import { existsSync } from 'fs';
import { join } from 'path';

const envFile = join(process.cwd(), '.env');
if (existsSync(envFile)) {
  checks.push({
    name: '.env File',
    status: 'pass',
    message: '✅ .env fajl postoji',
  });
} else {
  checks.push({
    name: '.env File',
    status: 'warning',
    message: '⚠️  .env fajl ne postoji (možda koristiš environment varijable direktno)',
  });
}

// Proveri package.json
const packageJson = join(process.cwd(), 'package.json');
if (existsSync(packageJson)) {
  checks.push({
    name: 'package.json',
    status: 'pass',
    message: '✅ package.json postoji',
  });
} else {
  checks.push({
    name: 'package.json',
    status: 'fail',
    message: '❌ package.json ne postoji',
  });
}

// Proveri next.config.js
const nextConfig = join(process.cwd(), 'next.config.js');
if (existsSync(nextConfig)) {
  checks.push({
    name: 'next.config.js',
    status: 'pass',
    message: '✅ next.config.js postoji',
  });
} else {
  checks.push({
    name: 'next.config.js',
    status: 'warning',
    message: '⚠️  next.config.js ne postoji (možda nije potreban)',
  });
}

// Prikaži rezultate
console.log('\n📊 Rezultati provere:\n');
console.log('='.repeat(60));

let passCount = 0;
let failCount = 0;
let warningCount = 0;

checks.forEach((check) => {
  console.log(check.message);
  if (check.status === 'pass') passCount++;
  if (check.status === 'fail') failCount++;
  if (check.status === 'warning') warningCount++;
});

console.log('='.repeat(60));
console.log(`\n📈 Statistika:`);
console.log(`✅ Prošlo: ${passCount}`);
console.log(`❌ Neuspešno: ${failCount}`);
console.log(`⚠️  Upozorenja: ${warningCount}`);

// Finalni status
console.log('\n' + '='.repeat(60));
if (failCount === 0) {
  console.log('🎉 Sve je spremno za deployment!');
  if (warningCount > 0) {
    console.log('⚠️  Ima nekoliko upozorenja, ali nisu kritična.');
  }
  process.exit(0);
} else {
  console.log('❌ Ima grešaka koje moraju biti ispravljene pre deployment-a!');
  console.log('\n💡 Preporuke:');
  console.log('1. Proverite da li su sve obavezne environment varijable postavljene');
  console.log('2. Proverite format connection string-ova');
  console.log('3. Proverite da li su svi fajlovi prisutni');
  process.exit(1);
}


