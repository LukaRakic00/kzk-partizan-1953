import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Settings from '@/models/Settings';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (key) {
      const setting = await Settings.findOne({ key });
      if (!setting) {
        return NextResponse.json(null);
      }
      return NextResponse.json(setting);
    }

    const settings = await Settings.find({});
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju settings-a' }, { status: 500 });
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
    const setting = await Settings.findOneAndUpdate(
      { key: data.key },
      { $set: data },
      { upsert: true, new: true }
    );

    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Create/Update setting error:', error);
    return NextResponse.json({ error: 'Greška pri čuvanju setting-a' }, { status: 500 });
  }
}

