import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ClubStatus from '@/models/ClubStatus';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    let status = await ClubStatus.findOne();

    if (!status) {
      status = await ClubStatus.create({
        title: 'Statut Kluba',
        content: 'Dodajte informacije o statutu kluba...',
        sections: [],
      });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Get club status error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju statuta kluba' }, { status: 500 });
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

    let status = await ClubStatus.findOne();

    if (!status) {
      status = await ClubStatus.create(data);
    } else {
      status = await ClubStatus.findOneAndUpdate({}, data, { new: true });
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Update club status error:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju statuta kluba' }, { status: 500 });
  }
}

