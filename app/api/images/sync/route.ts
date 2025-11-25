import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Image from '@/models/Image';
import { verifyToken, getAuthToken } from '@/lib/auth';
import { listImagesFromCloudinary } from '@/lib/cloudinary';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Neispravan token' }, { status: 401 });
    }

    const { folder } = await req.json();

    if (!folder) {
      return NextResponse.json({ error: 'Folder je obavezan' }, { status: 400 });
    }

    // Učitaj slike iz Cloudinary
    const cloudinaryImages = await listImagesFromCloudinary(folder);
    
    let synced = 0;
    let skipped = 0;

    // Sinhronizuj sa bazom
    for (const cloudinaryImg of cloudinaryImages) {
      // Proveri da li već postoji u bazi
      const existing = await Image.findOne({ publicId: cloudinaryImg.publicId });
      
      if (!existing) {
        // Dodaj u bazu
        await Image.create({
          publicId: cloudinaryImg.publicId,
          url: cloudinaryImg.url,
          folder: cloudinaryImg.folder,
          width: cloudinaryImg.width,
          height: cloudinaryImg.height,
          format: cloudinaryImg.format,
          order: 0,
        });
        synced++;
      } else {
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      synced,
      skipped,
      total: cloudinaryImages.length,
    });
  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ error: `Greška pri sinhronizaciji: ${error.message}` }, { status: 500 });
  }
}

