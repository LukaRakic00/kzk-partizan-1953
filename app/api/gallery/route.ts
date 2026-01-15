import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Gallery from '@/models/Gallery';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    
    const query: any = {};
    if (category) {
      query.category = category;
    }

    const galleries = await Gallery.find(query).sort({ createdAt: -1 });

    return NextResponse.json(galleries);
  } catch (error) {
    console.error('Get gallery error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju galerije' }, { status: 500 });
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
    const gallery = await Gallery.create(data);

    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    console.error('Create gallery error:', error);
    return NextResponse.json({ error: 'Greška pri kreiranju galerije' }, { status: 500 });
  }
}

