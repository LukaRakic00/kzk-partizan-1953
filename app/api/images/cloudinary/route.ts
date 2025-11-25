import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getAuthToken } from '@/lib/auth';
import { listImagesFromCloudinary } from '@/lib/cloudinary';

export async function GET(req: NextRequest) {
  try {
    // Proveri autentifikaciju
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Neispravan token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder');

    if (!folder) {
      return NextResponse.json({ error: 'Folder je obavezan' }, { status: 400 });
    }

    // Učitaj slike direktno iz Cloudinary
    const images = await listImagesFromCloudinary(folder);
    
    console.log(`Found ${images.length} images from Cloudinary folder: ${folder}`);
    
    return NextResponse.json(images);
  } catch (error: any) {
    console.error('Get Cloudinary images error:', error);
    return NextResponse.json({ error: `Greška pri učitavanju slika: ${error.message}` }, { status: 500 });
  }
}

