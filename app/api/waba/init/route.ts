import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WabaStanding from '@/models/WabaStanding';
import { WABAStandingsScraper } from '@/lib/waba-scraper';

export const runtime = 'nodejs';
export const maxDuration = 60;

const LEAGUE_ID = '31913';

// GET - Pokreni inicijalno učitavanje podataka
export async function GET() {
  const scraper = new WABAStandingsScraper();
  
  try {
    await connectDB();

    console.log('Pokretanje inicijalnog WABA scraping-a...');
    
    // Pokušaj da inicijalizujemo Puppeteer, ali ne bacaj grešku ako ne uspe
    try {
      await scraper.initialize();
    } catch (initError: any) {
      console.warn('Puppeteer inicijalizacija neuspešna, koristiće se fetch metoda:', initError.message);
    }
    
    const scrapedData = await scraper.scrapeStandings();

    if (scrapedData.length === 0) {
      throw new Error('Nijedan tim nije pronađen');
    }

    // Obriši stare podatke
    await WabaStanding.deleteMany({ leagueId: LEAGUE_ID });

    // Sačuvaj nove podatke sa validacijom
    const standingsToSave = scrapedData
      .filter((team) => {
        // Filtriraj samo validne podatke
        return (
          team.team &&
          team.team.trim() !== '' &&
          typeof team.gp === 'number' && !isNaN(team.gp) &&
          typeof team.w === 'number' && !isNaN(team.w) &&
          typeof team.l === 'number' && !isNaN(team.l)
        );
      })
      .map((team) => ({
        rank: team.rank || 0,
        team: team.team.trim(),
        gp: team.gp || 0,
        w: team.w || 0,
        l: team.l || 0,
        points: team.points || 0, // P (bodovi)
        pts: team.pts || 0,       // PTS (iz PTS/OPTS)
        opts: team.opts || 0,     // OPTS (iz PTS/OPTS)
        diff: team.diff || 0,
        leagueId: LEAGUE_ID,
      }));

    const savedStandings = await WabaStanding.insertMany(standingsToSave);

    return NextResponse.json({
      success: true,
      message: `Uspešno učitano ${savedStandings.length} timova u bazu`,
      standings: savedStandings,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error initializing WABA data:', error);
    return NextResponse.json(
      { 
        error: 'Greška pri učitavanju podataka',
        message: error.message || 'Nepoznata greška',
      },
      { status: 500 }
    );
  } finally {
    await scraper.close();
  }
}

