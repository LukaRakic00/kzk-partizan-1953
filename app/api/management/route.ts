import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { Management } from '@/models/Team';
import { verifyToken, getAuthToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const query = type ? { type } : {};
    const management = await Management.find(query).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(management);
  } catch (error) {
    console.error('Get management error:', error);
    return NextResponse.json({ error: 'Greška pri učitavanju rukovodstva' }, { status: 500 });
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
    const data = await req.json();
    // Remove position and order if not provided
    const cleanData: any = {
      name: data.name,
      type: data.type,
      subcategory: data.subcategory,
      ...(data.image && { image: data.image }),
      ...(data.position && { position: data.position }),
      ...(data.order !== undefined && { order: data.order }),
    };
    
    // Use direct MongoDB insert to bypass Mongoose validation
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }
    
    const result = await db.collection('managements').insertOne({
      ...cleanData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Fetch the created document using findOne to bypass validation
    const management = await db.collection('managements').findOne({ _id: result.insertedId });
    // Convert _id to string for JSON response
    const response = management ? {
      ...management,
      _id: management._id.toString(),
    } : null;
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Create management error:', error);
    return NextResponse.json({ error: 'Greška pri kreiranju rukovodstva' }, { status: 500 });
  }
}

