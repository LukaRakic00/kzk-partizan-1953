import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Player from '@/models/Player';
import { requireAdmin } from '@/lib/api-helpers';
import { handleError } from '@/lib/errors';
import { validatePagination } from '@/lib/validation';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = searchParams.get('year');
    const category = searchParams.get('category');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    // Ako nema paginacije, vrati direktno niz (backward compatibility)
    const wantsPagination = pageParam !== null || limitParam !== null;

    const query: { year?: number; category?: string } = {};
    if (year) {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        query.year = yearNum;
      }
    }
    if (category) {
      query.category = category;
    }

    if (wantsPagination) {
      const { page, limit } = validatePagination(pageParam, limitParam);
      const skip = (page - 1) * limit;
      const [players, total] = await Promise.all([
        Player.find(query)
          .sort({ number: 1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Player.countDocuments(query),
      ]);

      return NextResponse.json({
        players,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      // Vrati direktno niz za backward compatibility
      const players = await Player.find(query)
        .sort({ number: 1 })
        .lean();
      return NextResponse.json(players);
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    await requireAdmin(req);

    const data = await req.json();
    
    // Validacija obaveznih polja
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new (await import('@/lib/errors')).ValidationError('Ime je obavezno polje');
    }
    if (!data.surname || typeof data.surname !== 'string' || data.surname.trim().length === 0) {
      throw new (await import('@/lib/errors')).ValidationError('Prezime je obavezno polje');
    }

    const player = await Player.create(data);

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

