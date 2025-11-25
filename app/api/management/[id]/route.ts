import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Management } from '@/models/Team';
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
    const management = await Management.findByIdAndUpdate(params.id, data, { new: true });
    if (!management) {
      return NextResponse.json({ error: 'Rukovodstvo nije pronađeno' }, { status: 404 });
    }
    return NextResponse.json(management);
  } catch (error) {
    console.error('Update management error:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju rukovodstva' }, { status: 500 });
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
    const management = await Management.findByIdAndDelete(params.id);
    if (!management) {
      return NextResponse.json({ error: 'Rukovodstvo nije pronađeno' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Rukovodstvo je uspešno obrisano' });
  } catch (error) {
    console.error('Delete management error:', error);
    return NextResponse.json({ error: 'Greška pri brisanju rukovodstva' }, { status: 500 });
  }
}

