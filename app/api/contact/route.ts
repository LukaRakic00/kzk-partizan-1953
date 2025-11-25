import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();
    
    // Validacija
    if (!data.name || !data.email || !data.title) {
      return NextResponse.json(
        { error: 'Ime, email i naslov poruke su obavezni' },
        { status: 400 }
      );
    }

    const contact = await Contact.create({
      name: data.name,
      email: data.email,
      title: data.title,
      message: data.message || '',
      read: false,
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'Poruka je uspešno poslata',
        contact 
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      { error: 'Greška pri slanju poruke' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const query: any = {};
    if (unreadOnly) {
      query.read = false;
    }

    const contacts = await Contact.find(query)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      contacts,
      total: contacts.length,
      unread: contacts.filter((c: any) => !c.read).length,
    });
  } catch (error: any) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju poruka' },
      { status: 500 }
    );
  }
}

