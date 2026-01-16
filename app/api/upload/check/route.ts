import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthToken } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Neispravan token' }, { status: 401 });
    }

    // Proveri Cloudinary konfiguraciju
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Proveri sve environment varijable koje počinju sa CLOUDINARY
    const allCloudinaryVars = Object.keys(process.env)
      .filter(key => key.startsWith('CLOUDINARY'))
      .map(key => ({ 
        key, 
        exists: true, 
        length: process.env[key]?.length || 0,
        isEmpty: !process.env[key] || process.env[key]?.trim() === '',
      }));

    const config = {
      hasCloudName: !!cloudName,
      cloudNameLength: cloudName?.length || 0,
      cloudNameEmpty: !cloudName || cloudName.trim() === '',
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyEmpty: !apiKey || apiKey.trim() === '',
      hasApiSecret: !!apiSecret,
      apiSecretLength: apiSecret?.length || 0,
      apiSecretEmpty: !apiSecret || apiSecret.trim() === '',
      allConfigured: !!(cloudName && apiKey && apiSecret),
      allNonEmpty: !!(cloudName?.trim() && apiKey?.trim() && apiSecret?.trim()),
      environment: process.env.NODE_ENV,
      isVercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      allCloudinaryVars,
    };

    return NextResponse.json({
      success: config.allConfigured && config.allNonEmpty,
      config,
      message: config.allConfigured && config.allNonEmpty
        ? 'Cloudinary konfiguracija je ispravna'
        : 'Cloudinary konfiguracija nije kompletna. Proverite environment varijable u Vercel Settings.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Greška pri proveri konfiguracije'
      },
      { status: 500 }
    );
  }
}
