import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Contact from '@/models/Contact';
import { validateContactForm, sanitizeString } from '@/lib/validation';
import { handleError, ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();
    
    // Validacija sa sanitizacijom
    const validation = validateContactForm(data);
    if (!validation.isValid) {
      throw new ValidationError(validation.errors.join(', '), validation.errors);
    }

    const contact = await Contact.create({
      name: sanitizeString(data.name, 100),
      email: sanitizeString(data.email, 255).toLowerCase(),
      title: sanitizeString(data.title, 200),
      message: data.message ? sanitizeString(data.message, 5000) : '',
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
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Zaštiti endpoint - samo autentifikovani korisnici
    const { getAuthToken, verifyToken } = await import('@/lib/auth');
    const { AuthorizationError } = await import('@/lib/errors');
    
    const token = getAuthToken(req);
    if (!token) {
      throw new AuthorizationError('Niste autentifikovani');
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== 'admin') {
      throw new AuthorizationError('Nemate dozvolu za pristup ovom resursu');
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const { validatePagination } = await import('@/lib/validation');
    const { page, limit } = validatePagination(
      searchParams.get('page'),
      searchParams.get('limit')
    );

    const query: { read?: boolean } = {};
    if (unreadOnly) {
      query.read = false;
    }

    const skip = (page - 1) * limit;
    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Contact.countDocuments(query),
    ]);

    const unreadCount = await Contact.countDocuments({ read: false });

    return NextResponse.json({
      success: true,
      contacts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unread: unreadCount,
    });
  } catch (error) {
    return handleError(error);
  }
}

