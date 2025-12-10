import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Image from '@/models/Image';
import { uploadImage, deleteImageFromCloudinary } from '@/lib/cloudinary';
import { verifyToken, getAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Dohvati sliku
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const image = await Image.findById(params.id);
    
    if (!image) {
      return NextResponse.json({ error: 'Slika nije pronađena' }, { status: 404 });
    }
    
    return NextResponse.json(image);
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json({ error: 'Greška pri dohvatanju slike' }, { status: 500 });
  }
}

// PUT - Ažuriraj sliku (upload nove slike)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Neispravan token' }, { status: 401 });
    }

    await connectDB();
    
    // Pronađi postojeću sliku
    const existingImage = await Image.findById(params.id);
    if (!existingImage) {
      return NextResponse.json({ error: 'Slika nije pronađena' }, { status: 404 });
    }

    // Proveri da li ima fajl za upload
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      // Ako nema fajla, samo ažuriraj metapodatke
      const folder = formData.get('folder') as string;
      const order = formData.get('order') as string;
      const category = formData.get('category') as string;

      const updateData: any = {};
      if (folder) updateData.folder = folder;
      if (order) updateData.order = parseInt(order);
      if (category !== null) updateData.category = category || undefined;

      const updatedImage = await Image.findByIdAndUpdate(
        params.id,
        updateData,
        { new: true }
      );

      return NextResponse.json(updatedImage);
    }

    // Uploaduj novu sliku
    const folder = (formData.get('folder') as string) || existingImage.folder;
    const imageData = await uploadImage(file, folder);

    // Obriši staru sliku sa Cloudinary ako postoji publicId
    if (existingImage.publicId) {
      try {
        await deleteImageFromCloudinary(existingImage.publicId);
      } catch (error) {
        console.error('Error deleting old image from Cloudinary:', error);
        // Nastavi sa ažuriranjem čak i ako brisanje ne uspe
      }
    }

    // Ažuriraj sliku u bazi
    const updateData: any = {
      url: imageData.url,
      publicId: imageData.publicId,
      width: imageData.width,
      height: imageData.height,
      format: imageData.format,
    };

    const folderFromForm = formData.get('folder') as string;
    const order = formData.get('order') as string;
    const category = formData.get('category') as string;

    if (folderFromForm) updateData.folder = folderFromForm;
    if (order) updateData.order = parseInt(order);
    if (category !== null) updateData.category = category || undefined;

    const updatedImage = await Image.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    );

    return NextResponse.json(updatedImage);
  } catch (error: any) {
    console.error('Error updating image:', error);
    return NextResponse.json(
      { error: `Greška pri ažuriranju slike: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE - Obriši sliku
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Neispravan token' }, { status: 401 });
    }

    await connectDB();
    
    const image = await Image.findById(params.id);
    if (!image) {
      return NextResponse.json({ error: 'Slika nije pronađena' }, { status: 404 });
    }

    // Obriši sa Cloudinary ako postoji publicId
    if (image.publicId) {
      try {
        await deleteImageFromCloudinary(image.publicId);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        // Nastavi sa brisanjem iz baze čak i ako brisanje sa Cloudinary ne uspe
      }
    }

    // Obriši iz baze
    await Image.findByIdAndDelete(params.id);

    return NextResponse.json({ message: 'Slika je uspešno obrisana' });
  } catch (error: any) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: `Greška pri brisanju slike: ${error.message}` },
      { status: 500 }
    );
  }
}
