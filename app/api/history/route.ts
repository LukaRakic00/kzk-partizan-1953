import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import History from '@/models/History';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const history = await History.find().sort({ year: -1 });

    return NextResponse.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju istorije' }, { status: 500 });
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
    const history = await History.create(data);

    return NextResponse.json(history, { status: 201 });
  } catch (error) {
    console.error('Create history error:', error);
    return NextResponse.json({ error: 'Greška pri kreiranju istorije' }, { status: 500 });
  }
}

