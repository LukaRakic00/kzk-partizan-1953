import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WabaStanding from '@/models/WabaStanding';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LEAGUE_ID = '31913';

/**
 * GET - Samo čita standings iz baze i vraća ih.
 * Nema scrapinga – build se ne oslanja na mrežu ni Puppeteer.
 * Ažuriranje podataka: cron /api/cron/waba-update (Vercel Cron) ili admin "Ažuriraj" → /api/waba/trigger-update.
 */
export async function GET() {
  try {
    await connectDB();

    const standings = await WabaStanding.find({ leagueId: LEAGUE_ID })
      .sort({ rank: 1 })
      .lean();

    const first = standings[0] as { updatedAt?: Date; createdAt?: Date } | undefined;
    const lastUpdated = first?.updatedAt || first?.createdAt;

    return NextResponse.json({
      success: true,
      standings,
      lastUpdated: lastUpdated ? new Date(lastUpdated).toISOString() : null,
      totalTeams: standings.length,
    });
  } catch (error: any) {
    console.error('Error reading WABA standings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri učitavanju podataka',
        message: error?.message,
        standings: [],
        totalTeams: 0,
      },
      { status: 500 }
    );
  }
}
