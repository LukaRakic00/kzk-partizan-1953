import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WabaStanding from '@/models/WabaStanding';
import { WABAStandingsScraper } from '@/lib/waba-scraper';

export const runtime = 'nodejs'; // Puppeteer zahteva Node.js runtime
export const maxDuration = 60; // 60 sekundi timeout za scraping

const LEAGUE_ID = '31913';

// Endpoint za automatsko ažuriranje (može se pozivati iz cron job-a)
export async function GET(request: NextRequest) {
  // Proveri autorizaciju (opciono - možeš dodati API key)
  const authHeader = request.headers.get('authorization');
  const apiKey = process.env.WABA_UPDATE_API_KEY;
  
  if (apiKey && authHeader !== `Bearer ${apiKey}`) {
    return NextResponse.json(
      { error: 'Neautorizovan pristup' },
      { status: 401 }
    );
  }

  const scraper = new WABAStandingsScraper();
  
  try {
    await connectDB();

    console.log(`[${new Date().toISOString()}] Pokretanje automatskog ažuriranja WABA standings...`);
    
    await scraper.initialize();
    const scrapedData = await scraper.scrapeStandings();

    if (scrapedData.length === 0) {
      throw new Error('Nijedan tim nije pronađen');
    }

    // Obriši stare podatke
    await WabaStanding.deleteMany({ leagueId: LEAGUE_ID });

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

    console.log(`[${new Date().toISOString()}] ✓ Ažurirano ${savedStandings.length} timova`);

    return NextResponse.json({
      success: true,
      message: `Uspješno ažurirano ${savedStandings.length} timova`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error(`[${new Date().toISOString()}] ✗ Greška:`, error);
    return NextResponse.json(
      { 
        error: 'Greška pri ažuriranju',
        message: error.message,
      },
      { status: 500 }
    );
  } finally {
    await scraper.close();
  }
}

