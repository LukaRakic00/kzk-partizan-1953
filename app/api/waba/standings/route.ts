import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WabaStanding from '@/models/WabaStanding';
import { WABAStandingsScraper } from '@/lib/waba-scraper';

export const runtime = 'nodejs'; // Puppeteer zahteva Node.js runtime
export const maxDuration = 60; // 60 sekundi timeout za scraping

const LEAGUE_ID = '31913';
const UPDATE_INTERVAL = 3 * 60 * 60 * 1000; // 3 sata

// GET - Vrati trenutne standings iz baze
export async function GET() {
  try {
    await connectDB();

    const standings = await WabaStanding.find({ leagueId: LEAGUE_ID })
      .sort({ rank: 1 })
      .lean();

    // Proveri da li su podaci stari (stariji od 3 sata)
    const firstStanding = standings[0] as { updatedAt?: Date } | undefined;
    const lastUpdated = firstStanding?.updatedAt;
    const isStale = lastUpdated && (Date.now() - new Date(lastUpdated).getTime()) > UPDATE_INTERVAL;

    return NextResponse.json({
      success: true,
      standings: standings || [],
      lastUpdated: lastUpdated || null,
      isStale: isStale || false,
      totalTeams: standings.length || 0,
    });
  } catch (error: any) {
    console.error('Error fetching WABA standings:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju podataka' },
      { status: 500 }
    );
  }
}

// POST - Ažuriraj standings (scraping + čuvanje u bazu)
export async function POST(request: NextRequest) {
  const scraper = new WABAStandingsScraper();
  
  try {
    await connectDB();

    console.log('Pokretanje WABA scraping-a...');
    
    // Inicijalizuj scraper
    await scraper.initialize();
    
    // Scrapuj podatke
    const scrapedData = await scraper.scrapeStandings();

    if (scrapedData.length === 0) {
      throw new Error('Nijedan tim nije pronađen');
    }

    // Obriši stare podatke za ovu ligu
    await WabaStanding.deleteMany({ leagueId: LEAGUE_ID });

    // Sačuvaj nove podatke
    const standingsToSave = scrapedData.map((team) => ({
      rank: team.rank,
      team: team.team,
      gp: team.gp,
      w: team.w,
      l: team.l,
      points: team.points, // P (bodovi)
      pts: team.pts,       // PTS (iz PTS/OPTS)
      opts: team.opts,     // OPTS (iz PTS/OPTS)
      diff: team.diff,
      leagueId: LEAGUE_ID,
    }));

    const savedStandings = await WabaStanding.insertMany(standingsToSave);

    console.log(`✓ Ažurirano ${savedStandings.length} timova u bazi`);

    return NextResponse.json({
      success: true,
      message: `Uspješno ažurirano ${savedStandings.length} timova`,
      standings: savedStandings,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error updating WABA standings:', error);
    return NextResponse.json(
      { 
        error: 'Greška pri ažuriranju podataka',
        message: error.message || 'Nepoznata greška',
      },
      { status: 500 }
    );
  } finally {
    await scraper.close();
  }
}
