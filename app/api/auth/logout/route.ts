import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: 'Uspešno ste se odjavili' });
  
  // Obriši cookie
  response.cookies.delete('auth-token');
  
  return response;
}

