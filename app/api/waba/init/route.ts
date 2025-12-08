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
    
    // Proveri ScrapingBee API key status
    const scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY?.trim();
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    
    console.log('=== API ROUTE DEBUG ===');
    console.log('Environment:', {
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      isVercel: isVercel,
    });
    console.log('ScrapingBee API key status:', {
      exists: !!process.env.SCRAPINGBEE_API_KEY,
      trimmed: !!scrapingBeeApiKey,
      length: scrapingBeeApiKey?.length || 0,
      preview: scrapingBeeApiKey ? `${scrapingBeeApiKey.substring(0, 10)}...${scrapingBeeApiKey.substring(scrapingBeeApiKey.length - 5)}` : 'N/A',
    });
    console.log('=== END API ROUTE DEBUG ===');
    
    // Ako postoji ScrapingBee API key, preskoči browser automation inicijalizaciju
    // ScrapingBee će biti korišćen direktno u scrapeStandings()
    let browserInitialized = false;
    
    if (!scrapingBeeApiKey) {
      // Pokušaj da inicijalizujemo browser automation samo ako nema ScrapingBee API key
      // Ovo je važno jer fetch metoda ne može da vidi JavaScript-renderovane tabele
      try {
        console.log('Inicijalizacija browser automation-a (ScrapingBee nije dostupan)...');
        browserInitialized = await scraper.initialize();
        if (browserInitialized) {
          console.log('✓ Browser automation uspešno inicijalizovan - koristiće se za scraping');
        } else {
          console.error('✗ Browser automation nije uspeo da se inicijalizuje');
          console.error('Proverite da li su instalirani puppeteer-core i @sparticuz/chromium paketi.');
          console.error('U Vercel produkciji, ovi paketi su obavezni za JavaScript-renderovane stranice.');
        }
      } catch (initError: any) {
        console.error('✗ Browser automation inicijalizacija neuspešna:', initError.message);
        console.error('Stack trace:', initError.stack);
        console.error('NAPOMENA: Fetch metoda neće moći da pronađe tabelu ako stranica koristi JavaScript za renderovanje.');
        console.error('U produkciji (Vercel), proverite da li su instalirani puppeteer-core i @sparticuz/chromium paketi.');
      }
    } else {
      console.log('✓ ScrapingBee API key je dostupan - preskačem browser automation inicijalizaciju');
      console.log('ScrapingBee će biti korišćen direktno u scrapeStandings()');
    }
    
    let scrapedData: any[] = [];
    
    try {
      console.log('Pokretanje scraping-a...');
      scrapedData = await scraper.scrapeStandings();
      console.log(`✓ Scraping uspešan: pronađeno ${scrapedData.length} timova`);
    } catch (scrapeError: any) {
      console.error('✗ Scraping error:', scrapeError.message);
      console.error('Stack trace:', scrapeError.stack);
      
      // Ako je greška vezana za tabelu i browser nije inicijalizovan, probaj ponovo
      if (scrapeError.message && scrapeError.message.includes('Tabela nije pronađena') && !browserInitialized) {
        console.log('Pokušavam ponovo sa browser automation-om...');
        try {
          browserInitialized = await scraper.initialize();
          if (browserInitialized) {
            scrapedData = await scraper.scrapeStandings();
            console.log(`✓ Retry uspešan: pronađeno ${scrapedData.length} timova`);
          } else {
            throw new Error(`Greška pri scrapanju: ${scrapeError.message}. Browser automation nije uspeo da se inicijalizuje. U Vercel produkciji, proverite da li su instalirani puppeteer-core i @sparticuz/chromium paketi.`);
          }
        } catch (retryError: any) {
          console.error('✗ Retry neuspešan:', retryError.message);
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
    
    if (errorMessage.includes('ScrapingBee API key nije validan')) {
      userMessage = 'ScrapingBee API key nije validan. Proverite da li je pravilno postavljen u Vercel Environment Variables. Idite na Vercel Dashboard → Settings → Environment Variables i proverite SCRAPINGBEE_API_KEY.';
    } else if (errorMessage.includes('Tabela nije pronađena')) {
      userMessage = 'Tabela nije pronađena na stranici. Stranica verovatno koristi JavaScript za renderovanje, što zahteva browser automation (Playwright/Puppeteer) ili ScrapingBee API. U produkciji (Vercel), proverite da li je ScrapingBee API key pravilno postavljen ili da li su instalirani puppeteer-core, @sparticuz/chromium paketi.';
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

