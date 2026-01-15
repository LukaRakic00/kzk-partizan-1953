import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import News from '@/models/News';
import { verifyToken, getAuthToken } from '@/lib/auth';
import mongoose from 'mongoose';

// Helper funkcija za proveru da li je string validan MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id) && new mongoose.Types.ObjectId(id).toString() === id;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    let news;
    
    // Proveri da li je ID validan ObjectId ili slug
    if (isValidObjectId(params.id)) {
      news = await News.findById(params.id);
    } else {
      news = await News.findOne({ slug: params.id });
    }

    if (!news) {
      return NextResponse.json({ error: 'Vest nije pronađena' }, { status: 404 });
    }

    // Povećaj broj pregleda samo ako se pristupa preko slug-a (javni pristup)
    if (!isValidObjectId(params.id)) {
      await News.findByIdAndUpdate(news._id, { $inc: { views: 1 } });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju vesti' }, { status: 500 });
  }
}

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
    
    // Formatiraj datum ako postoji (samo datum, bez vremena)
    if (data.publishedAt) {
      const date = new Date(data.publishedAt);
      date.setHours(0, 0, 0, 0);
      data.publishedAt = date;
    } else if (data.published && !data.publishedAt) {
      // Ako je published ali nema datuma, postavi današnji datum
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      data.publishedAt = today;
    }
    
    let news;
    if (isValidObjectId(params.id)) {
      news = await News.findByIdAndUpdate(params.id, data, { new: true });
    } else {
      news = await News.findOneAndUpdate({ slug: params.id }, data, { new: true });
    }

    if (!news) {
      return NextResponse.json({ error: 'Vest nije pronađena' }, { status: 404 });
    }

    return NextResponse.json(news);
  } catch (error) {
    console.error('Update news error:', error);
    return NextResponse.json({ error: 'Greška pri ažuriranju vesti' }, { status: 500 });
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

    let news;
    if (isValidObjectId(params.id)) {
      news = await News.findByIdAndDelete(params.id);
    } else {
      news = await News.findOneAndDelete({ slug: params.id });
    }

    if (!news) {
      return NextResponse.json({ error: 'Vest nije pronađena' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Vest je obrisana' });
  } catch (error) {
    console.error('Delete news error:', error);
    return NextResponse.json({ error: 'Greška pri brisanju vesti' }, { status: 500 });
  }
}

