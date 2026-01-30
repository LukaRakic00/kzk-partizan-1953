import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
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
    // Remove position and order if not provided
    const cleanData: any = {
      name: data.name,
      type: data.type,
      subcategory: data.subcategory,
      updatedAt: new Date(),
      ...(data.image && { image: data.image }),
      ...(data.position && { position: data.position }),
      ...(data.order !== undefined && { order: data.order }),
    };
    
    // Use direct MongoDB update to bypass Mongoose validation
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const objectId = new mongoose.Types.ObjectId(params.id);
    const updateResult = await db.collection('managements').updateOne(
      { _id: objectId },
      { $set: cleanData }
    );
    
    if (updateResult.matchedCount === 0) {
      return NextResponse.json({ error: 'Rukovodstvo nije pronađeno' }, { status: 404 });
    }
    
    // Fetch the updated document
    const management = await db.collection('managements').findOne({ _id: objectId });
    
    if (!management) {
      return NextResponse.json({ error: 'Rukovodstvo nije pronađeno' }, { status: 404 });
    }
    
    // Convert _id to string for JSON response
    const response = {
      ...management,
      _id: management._id.toString(),
    };
    
    return NextResponse.json(response);
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

