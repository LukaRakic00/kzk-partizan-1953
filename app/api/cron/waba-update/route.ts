import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WabaStanding from '@/models/WabaStanding';
import { WABAStandingsScraper } from '@/lib/waba-scraper';

export const runtime = 'nodejs';
export const maxDuration = 60;

const LEAGUE_ID = '31913';

// Cron job endpoint - poziva se automatski svakih 3 sata
// Može se pozvati i ručno: GET /api/cron/waba-update
export async function GET(request: NextRequest) {
  // Proveri autorizaciju (Vercel Cron Jobs automatski dodaje header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Ako je postavljen CRON_SECRET, proveri ga
  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Neautorizovan pristup' },
        { status: 401 }
      );
    }
  }

  const scraper = new WABAStandingsScraper();
  
  try {
    await connectDB();

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Pokretanje automatskog ažuriranja WABA standings...`);
    
    await scraper.initialize();
    const scrapedData = await scraper.scrapeStandings();

    if (scrapedData.length === 0) {
      throw new Error('Nijedan tim nije pronađen');
    }

    // Obriši stare podatke
    const deleteResult = await WabaStanding.deleteMany({ leagueId: LEAGUE_ID });
    console.log(`[${timestamp}] Obrisano ${deleteResult.deletedCount} starih zapisa`);

    // Sačuvaj nove podatke
    const standingsToSave = scrapedData.map((team) => ({
      rank: team.rank,
      team: team.team,
      gp: team.gp,
      w: team.w,
      l: team.l,
      pts: team.pts,
      opts: team.opts,
      diff: team.diff,
      leagueId: LEAGUE_ID,
      lastUpdated: new Date(),
    }));

    const savedStandings = await WabaStanding.insertMany(standingsToSave);

    console.log(`[${timestamp}] ✓ Ažurirano ${savedStandings.length} timova`);

    return NextResponse.json({
      success: true,
      message: `Uspješno ažurirano ${savedStandings.length} timova`,
      timestamp,
      deletedCount: deleteResult.deletedCount,
      insertedCount: savedStandings.length,
    });
  } catch (error: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ✗ Greška:`, error);
    return NextResponse.json(
      { 
        error: 'Greška pri ažuriranju',
        message: error.message,
        timestamp,
      },
      { status: 500 }
    );
  } finally {
    await scraper.close();
  }
}

