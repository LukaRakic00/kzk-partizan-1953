import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Management } from '@/models/Team';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const query = type ? { type } : {};
    const management = await Management.find(query).sort({ order: 1 });
    return NextResponse.json(management);
  } catch (error) {
    console.error('Get management error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju rukovodstva' }, { status: 500 });
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
    const management = await Management.create(data);
    return NextResponse.json(management, { status: 201 });
  } catch (error) {
    console.error('Create management error:', error);
    return NextResponse.json({ error: 'Greška pri kreiranju rukovodstva' }, { status: 500 });
  }
}

