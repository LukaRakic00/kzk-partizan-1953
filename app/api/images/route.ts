import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Image from '@/models/Image';
import { verifyToken, getAuthToken } from '@/lib/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get('folder');
    const category = searchParams.get('category');

    const query: any = {};
    if (folder) {
      query.folder = folder;
    }
    if (category) {
      // Proveri da li je category valid ObjectId
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = new mongoose.Types.ObjectId(category);
      }
      // Ako nije ObjectId, ignorišemo category jer schema očekuje ObjectId ili Mixed
      // Za string kategorije, koristimo folder umesto category
    }

    const images = await Image.find(query).sort({ order: 1 });
    
    console.log(`Found ${images.length} images for folder: ${folder || 'all'}`); // Debug
    console.log('Images:', images.map(img => ({ id: img._id, folder: img.folder, url: img.url?.substring(0, 50) }))); // Debug

    return NextResponse.json(images);
  } catch (error: any) {
    console.error('Get images error:', error);
    return NextResponse.json({ error: `Greška pri učitavanju slika: ${error.message}` }, { status: 500 });
  }
}

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

    const data = await req.json();
    const image = await Image.create(data);

    return NextResponse.json(image, { status: 201 });
  } catch (error) {
    console.error('Create image error:', error);
    return NextResponse.json({ error: 'Greška pri kreiranju slike' }, { status: 500 });
  }
}
