import { NextRequest, NextResponse } from 'next/server';
import { uploadImage } from '@/lib/cloudinary';
import { verifyToken, getAuthToken } from '@/lib/auth';

// Ensure this route runs in Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 sekundi timeout

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req);
    if (!token) {
      return NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Neispravan token' }, { status: 401 });
    }

    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary configuration missing:', {
        hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
        hasApiKey: !!process.env.CLOUDINARY_API_KEY,
        hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
      });
      return NextResponse.json(
        { error: 'Cloudinary konfiguracija nije podešena. Proverite environment varijable.' },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'ostalo';

    if (!file) {
      return NextResponse.json({ error: 'Fajl nije pronađen' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Fajl mora biti slika' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `Slika je prevelika. Maksimalna veličina je ${maxSize / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    try {
      const imageData = await uploadImage(file, folder);
      return NextResponse.json(imageData);
    } catch (uploadError: any) {
      console.error('Upload image error:', uploadError);
      console.error('Upload error details:', {
        message: uploadError?.message,
        stack: uploadError?.stack?.substring(0, 500),
        name: uploadError?.name,
      });
      
      // Return JSON error response - nikad HTML
      const errorMessage = uploadError?.message || 'Greška pri upload-u slike';
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? uploadError?.stack?.substring(0, 500) : undefined
        },
        { 
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }
  } catch (error: any) {
    console.error('Upload route error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack?.substring(0, 500),
      name: error?.name,
    });
    
    // Return JSON error response - nikad HTML
    const errorMessage = error?.message || 'Greška pri upload-u slike';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack?.substring(0, 500) : undefined
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

