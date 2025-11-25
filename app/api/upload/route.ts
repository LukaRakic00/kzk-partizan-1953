import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Neispravan token' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'ostalo';

    if (!file) {
      return NextResponse.json({ error: 'Fajl nije pronađen' }, { status: 400 });
    }

    const imageData = await uploadImage(file, folder);

    return NextResponse.json(imageData);
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Greška pri upload-u slike' }, { status: 500 });
  }
}

