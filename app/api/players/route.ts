import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Player from '@/models/Player';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');

    const query = year ? { year: parseInt(year) } : {};
    const players = await Player.find(query).sort({ number: 1 });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Get players error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju igrača' }, { status: 500 });
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
    const player = await Player.create(data);

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Create player error:', error);
    return NextResponse.json({ error: 'Greška pri kreiranju igrača' }, { status: 500 });
  }
}

