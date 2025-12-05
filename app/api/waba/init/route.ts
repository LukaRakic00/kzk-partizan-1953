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
    
    // Pokušaj da inicijalizujemo browser automation (Playwright ili Puppeteer)
    // Ovo je važno jer fetch metoda ne može da vidi JavaScript-renderovane tabele
    let browserInitialized = false;
    try {
      browserInitialized = await scraper.initialize();
      if (browserInitialized) {
        console.log('Browser automation uspešno inicijalizovan - koristiće se za scraping');
      } else {
        console.warn('Browser automation nije uspeo da se inicijalizuje, koristiće se fetch metoda (može biti problematično)');
        console.warn('NAPOMENA: U produkciji, proverite da li su instalirani puppeteer-core, @sparticuz/chromium ili playwright paketi.');
      }
    } catch (initError: any) {
      console.warn('Browser automation inicijalizacija neuspešna, koristiće se fetch metoda:', initError.message);
      console.warn('NAPOMENA: Fetch metoda možda neće moći da pronađe tabelu ako stranica koristi JavaScript za renderovanje.');
      console.warn('U produkciji (Vercel), proverite da li su instalirani puppeteer-core, @sparticuz/chromium ili playwright paketi.');
    }
    
    let scrapedData: any[] = [];
    
    try {
      scrapedData = await scraper.scrapeStandings();
    } catch (scrapeError: any) {
      console.error('Scraping error:', scrapeError);
      // Ako je greška vezana za tabelu, probaj ponovo sa browser automation-om
      if (scrapeError.message && scrapeError.message.includes('Tabela nije pronađena')) {
        console.log('Pokušavam ponovo sa browser automation-om...');
        try {
          await scraper.initialize();
          scrapedData = await scraper.scrapeStandings();
        } catch (retryError: any) {
          throw new Error(`Greška pri scrapanju: ${scrapeError.message}. Stranica verovatno koristi JavaScript za renderovanje tabele, što zahteva browser automation (Playwright/Puppeteer). U produkciji, proverite da li su instalirani potrebni paketi.`);
        }
      } else {
        throw scrapeError;
      }
    }

    if (scrapedData.length === 0) {
      throw new Error('Nijedan tim nije pronađen. Proverite da li je URL ispravan i da li stranica sadrži tabelu.');
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
    
    // Detaljnija poruka o grešci
    let errorMessage = error.message || 'Nepoznata greška';
    let userMessage = 'Greška pri učitavanju podataka';
    
    if (errorMessage.includes('Tabela nije pronađena')) {
      userMessage = 'Tabela nije pronađena na stranici. Stranica verovatno koristi JavaScript za renderovanje, što zahteva browser automation (Playwright/Puppeteer). U produkciji (Vercel), proverite da li su instalirani puppeteer-core, @sparticuz/chromium ili playwright paketi.';
    } else if (errorMessage.includes('Nijedan tim nije pronađen')) {
      userMessage = 'Nijedan tim nije pronađen. Proverite da li je URL ispravan i da li stranica sadrži tabelu sa timovima.';
    } else if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
      userMessage = 'Zahtev je istekao. Stranica možda je spora ili nedostupna. Pokušajte ponovo.';
    }
    
    return NextResponse.json(
      { 
        error: userMessage,
        message: errorMessage,
        details: 'Ako se greška nastavi, proverite da li su instalirani puppeteer-core, @sparticuz/chromium ili playwright paketi u produkciji. Fetch metoda ne može da vidi JavaScript-renderovane tabele.',
      },
      { status: 500 }
    );
  } finally {
    await scraper.close();
  }
}

