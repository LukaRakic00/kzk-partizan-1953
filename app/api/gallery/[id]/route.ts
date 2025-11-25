import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Gallery from '@/models/Gallery';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const gallery = await Gallery.findByIdAndUpdate(params.id, data, { new: true });

    if (!gallery) {
      return NextResponse.json({ error: 'Galerija nije pronađena' }, { status: 404 });
    }

    return NextResponse.json(gallery);
  } catch (error) {
    console.error('Update gallery error:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju galerije' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const gallery = await Gallery.findByIdAndDelete(params.id);

    if (!gallery) {
      return NextResponse.json({ error: 'Galerija nije pronađena' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Galerija je obrisana' });
  } catch (error) {
    console.error('Delete gallery error:', error);
    return NextResponse.json({ error: 'Greška pri brisanju galerije' }, { status: 500 });
  }
}

