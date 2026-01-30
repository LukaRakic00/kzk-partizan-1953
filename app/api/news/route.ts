import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';
import { requireAdmin } from '@/lib/api-helpers';
import { handleError } from '@/lib/errors';
import { validatePagination } from '@/lib/validation';
import { generateSlug } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const published = searchParams.get('published');
    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    
    // Ako nema paginacije, vrati direktno niz (backward compatibility)
    const wantsPagination = pageParam !== null || limitParam !== null;
    
    const query: { published?: boolean } = {};
    if (published === 'true') {
      query.published = true;
    }

    if (wantsPagination) {
      const { page, limit } = validatePagination(pageParam, limitParam);
      const skip = (page - 1) * limit;
      const [news, total] = await Promise.all([
        News.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        News.countDocuments(query),
      ]);

      return NextResponse.json({
        news,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } else {
      // Vrati direktno niz za backward compatibility
      const news = await News.find(query)
        .sort({ createdAt: -1 })
        .lean();
      return NextResponse.json(news);
    }
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const payload = await requireAdmin(req);

    // Uzmi korisnika da dobijemo username za author
    const AdminUser = (await import('@/models/AdminUser')).default;
    const user = await AdminUser.findById(payload.userId);
    if (!user) {
      throw new (await import('@/lib/errors')).NotFoundError('Korisnik nije pronađen');
    }

    const data = await req.json();
    
    // Validacija obaveznih polja
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      throw new (await import('@/lib/errors')).ValidationError('Naslov je obavezno polje');
    }

    // Generiši slug ako nije poslat
    if (!data.slug && data.title) {
      data.slug = generateSlug(data.title);
    }

    // Postavi author iz korisnika
    data.author = user.username || 'Admin';

    // Osiguraj da se slike čuvaju pravilno (čak i ako su prazne)
    if (data.image === '') {
      data.image = undefined;
    }
    if (!data.images) {
      data.images = [];
    }

    // Ako je published, postavi publishedAt (samo datum, bez vremena)
    if (data.published && !data.publishedAt) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Postavi vreme na početak dana
      data.publishedAt = today;
    } else if (data.publishedAt) {
      // Ako je poslat datum, osiguraj da je vreme na početku dana
      const date = new Date(data.publishedAt);
      date.setHours(0, 0, 0, 0);
      data.publishedAt = date;
    }

    const news = await News.create(data);

    return NextResponse.json(news, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

