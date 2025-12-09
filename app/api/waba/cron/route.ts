import { NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Označi route kao dinamički jer koristi headers()
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Cron job endpoint koji se poziva jednom dnevno (u 12:00)
// Zahteva secret token za bezbednost
export async function GET(request: Request) {
  try {
    const headersList = headers();
    const authHeader = headersList.get('authorization');
    
    // Proveri da li je token validan
    const cronSecret = process.env.CRON_SECRET || 'your-secret-token';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Pozovi scraping endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const scrapeResponse = await fetch(`${baseUrl}/api/waba/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok) {
      throw new Error(scrapeData.error || 'Greška pri scrapanju');
    }

    return NextResponse.json({
      success: true,
      message: 'WABA tabela uspešno ažurirana',
      data: scrapeData,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in WABA cron job:', error);
    return NextResponse.json(
      { error: `Greška: ${error.message}` },
      { status: 500 }
    );
  }
}

