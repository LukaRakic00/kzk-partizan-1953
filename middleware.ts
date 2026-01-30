import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { env } from './lib/env';

const secret = new TextEncoder().encode(env.JWT_SECRET);

// Verifikuj token koristeći jose (kompatibilno sa Edge Runtime)
interface TokenPayload {
  userId: string;
  username?: string;
  email?: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Type guard za validaciju payload-a
function isValidTokenPayload(payload: unknown): payload is TokenPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  
  const p = payload as Record<string, unknown>;
  return (
    typeof p.userId === 'string' &&
    typeof p.role === 'string'
  );
}

async function verifyTokenEdge(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    
    // Validiraj da payload ima potrebna polja
    if (isValidTokenPayload(payload)) {
      return payload;
    }
    
    return null;
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

