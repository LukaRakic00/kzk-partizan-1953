import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const secret = new TextEncoder().encode(JWT_SECRET);

// Verifikuj token koristeći jose (kompatibilno sa Edge Runtime)
async function verifyTokenEdge(token: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Dozvoli pristup login stranici
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }

  // Za sve ostale admin rute, proveri autentifikaciju
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      const url = new URL('/admin/login', request.url);
      return NextResponse.redirect(url);
    }

    // Verifikuj token koristeći jose (Edge Runtime kompatibilno)
    const payload = await verifyTokenEdge(token);
    if (!payload) {
      const url = new URL('/admin/login', request.url);
      const response = NextResponse.redirect(url);
      // Obriši nevažeći cookie
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};

