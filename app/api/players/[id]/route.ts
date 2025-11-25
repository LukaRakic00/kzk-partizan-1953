import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Player from '@/models/Player';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const player = await Player.findById(params.id);

    if (!player) {
      return NextResponse.json({ error: 'Igrač nije pronađen' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Get player error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju igrača' }, { status: 500 });
  }
}

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
    const player = await Player.findByIdAndUpdate(params.id, data, { new: true });

    if (!player) {
      return NextResponse.json({ error: 'Igrač nije pronađen' }, { status: 404 });
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Update player error:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju igrača' }, { status: 500 });
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

    const player = await Player.findByIdAndDelete(params.id);

    if (!player) {
      return NextResponse.json({ error: 'Igrač nije pronađen' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Igrač je obrisan' });
  } catch (error) {
    console.error('Delete player error:', error);
    return NextResponse.json({ error: 'Greška pri brisanju igrača' }, { status: 500 });
  }
}

