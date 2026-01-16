import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const published = searchParams.get('published');

    const query: any = {};
    if (published === 'true') {
      query.published = true;
    }

    const news = await News.find(query).sort({ createdAt: -1 });

    return NextResponse.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju vesti' }, { status: 500 });
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

    // Uzmi korisnika da dobijemo username za author
    const AdminUser = (await import('@/models/AdminUser')).default;
    const user = await AdminUser.findById(payload.userId);
    if (!user) {
      return NextResponse.json({ error: 'Korisnik nije pronađen' }, { status: 404 });
    }

    const data = await req.json();
    
    // Generiši slug ako nije poslat
    if (!data.slug && data.title) {
      data.slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
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
  } catch (error: any) {
    console.error('Create news error:', error);
    return NextResponse.json({ 
      error: 'Greška pri kreiranju vesti',
      message: error.message 
    }, { status: 500 });
  }
}

