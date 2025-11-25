import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Team from '@/models/Team';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const team = await Team.findOne().sort({ createdAt: -1 });
    return NextResponse.json(team);
  } catch (error) {
    console.error('Get team error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju tima' }, { status: 500 });
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
    const team = await Team.create(data);
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error('Create team error:', error);
    return NextResponse.json({ error: 'Greška pri kreiranju tima' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
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
    const team = await Team.findOneAndUpdate({}, data, { new: true, upsert: true });
    return NextResponse.json(team);
  } catch (error) {
    console.error('Update team error:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju tima' }, { status: 500 });
  }
}

