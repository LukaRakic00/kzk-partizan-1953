import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import History from '@/models/History';
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
    const history = await History.findByIdAndUpdate(params.id, data, { new: true });

    if (!history) {
      return NextResponse.json({ error: 'Istorija nije pronađena' }, { status: 404 });
    }

    return NextResponse.json(history);
  } catch (error) {
    console.error('Update history error:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju istorije' }, { status: 500 });
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

    const history = await History.findByIdAndDelete(params.id);

    if (!history) {
      return NextResponse.json({ error: 'Istorija nije pronađena' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Istorija je obrisana' });
  } catch (error) {
    console.error('Delete history error:', error);
    return NextResponse.json({ error: 'Greška pri brisanju istorije' }, { status: 500 });
  }
}

