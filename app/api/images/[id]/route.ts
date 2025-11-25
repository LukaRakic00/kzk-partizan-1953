import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Image from '@/models/Image';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    const data = await req.json();
    const image = await Image.findByIdAndUpdate(id, data, { new: true });

    if (!image) {
      return NextResponse.json({ error: 'Slika nije pronađena' }, { status: 404 });
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error('Update image error:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju slike' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { id } = params;
    await Image.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Slika je uspešno obrisana' });
  } catch (error) {
    console.error('Delete image error:', error);
    return NextResponse.json({ error: 'Greška pri brisanju slike' }, { status: 500 });
  }
}
