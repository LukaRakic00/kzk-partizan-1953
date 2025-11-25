import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AdminUser from '@/models/AdminUser';
import { verifyPassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Korisničko ime i lozinka su obavezni' }, { status: 400 });
    }

    const user = await AdminUser.findOne({ username });

    if (!user) {
      return NextResponse.json({ error: 'Neispravni podaci za prijavu' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: 'Neispravni podaci za prijavu' }, { status: 401 });
    }

    const token = generateToken({
      userId: user._id.toString(),
      username: user.username,
      role: 'admin',
    });

    const response = NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        role: 'admin',
      },
    });

    // Postavi cookie sa tokenom
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 dana
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Greška pri prijavi' }, { status: 500 });
  }
}

