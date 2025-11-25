import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    const user = await AdminUser.findById(payload.userId).select('-password');

    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Greška pri proveri autentifikacije' }, { status: 500 });
  }
}

