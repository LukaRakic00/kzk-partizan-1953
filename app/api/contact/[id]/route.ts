import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { getAuthToken, verifyToken } from '@/lib/auth';

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
    const contact = await Contact.findByIdAndUpdate(
      params.id,
      { read: data.read !== undefined ? data.read : true },
      { new: true }
    );

    if (!contact) {
      return NextResponse.json({ error: 'Poruka nije pronađena' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error: any) {
    console.error('Update contact error:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju poruke' },
      { status: 500 }
    );
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

    const contact = await Contact.findByIdAndDelete(params.id);

    if (!contact) {
      return NextResponse.json({ error: 'Poruka nije pronađena' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Poruka je uspešno obrisana' });
  } catch (error: any) {
    console.error('Delete contact error:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju poruke' },
      { status: 500 }
    );
  }
}

