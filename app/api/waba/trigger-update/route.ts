import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WabaStanding from '@/models/WabaStanding';
import { requireAdmin } from '@/lib/api-helpers';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const LEAGUE_ID = '31913';

/**
 * GET - Pokreće WABA scraping (runtime). Zahteva admin auth.
 * Interno poziva /api/cron/waba-update sa CRON_SECRET.
 * Scraping se dešava samo na zahtev, ne pri build-u.
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });
  }

  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: 'CRON_SECRET nije postavljen. Postavite ga u env.' },
      { status: 500 }
    );
  }

  const baseUrl =
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  try {
    const cronResponse = await fetch(`${baseUrl}/api/cron/waba-update`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    const cronData = await cronResponse.json();

    if (!cronResponse.ok) {
      return NextResponse.json(
        {
          error: cronData.error || 'Greška pri ažuriranju WABA lige',
          message: cronData.message,
        },
        { status: cronResponse.status }
      );
    }

    await connectDB();
    const standings = await WabaStanding.find({ leagueId: LEAGUE_ID })
      .sort({ rank: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      message: cronData.message || `Ažurirano ${standings.length} timova`,
      standings,
      timestamp: cronData.timestamp || new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error triggering WABA update:', error);
    return NextResponse.json(
      {
        error: 'Greška pri ažuriranju WABA lige',
        message: error?.message,
      },
      { status: 500 }
    );
  }
}
