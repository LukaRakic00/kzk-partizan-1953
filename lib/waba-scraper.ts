let puppeteer: any = null;
let chromium: any = null;
let playwright: any = null;

// Pokušaj da učitamo različite opcije za browser automation
// Učitavamo ih nezavisno da bi imali sve opcije dostupne

// 1. Pokušaj učitati puppeteer-core i @sparticuz/chromium (za Vercel/serverless)
try {
  puppeteer = require('puppeteer-core');
  chromium = require('@sparticuz/chromium');
  console.log('✓ puppeteer-core i @sparticuz/chromium su dostupni');
} catch (e) {
  const errorMessage = e instanceof Error ? e.message : String(e);
  console.log('puppeteer-core/@sparticuz/chromium nisu dostupni:', errorMessage);
}

// 2. Pokušaj učitati obični puppeteer (za lokalno okruženje)
if (!puppeteer) {
  try {
    puppeteer = require('puppeteer');
    console.log('✓ obični puppeteer je dostupan');
  } catch (e2) {
    const errorMessage = e2 instanceof Error ? e2.message : String(e2);
    console.log('obični puppeteer nije dostupan:', errorMessage);
  }
}

// 3. Pokušaj učitati Playwright (najbolje za serverless)
try {
  playwright = require('playwright');
  console.log('✓ Playwright je dostupan');
} catch (e3) {
  const errorMessage = e3 instanceof Error ? e3.message : String(e3);
  console.log('Playwright nije dostupan:', errorMessage);
}

const CONFIG = {
  LEAGUE_ID: '31913',
  URL: 'https://waba-league.com/season/standings/',
  TIMEOUT: 30000,
};

export interface WabaTeamData {
  rank: number;
  team: string;
  gp: number;
  w: number;
  l: number;
  points: number; // P (bodovi)
  pts: number;   // PTS (iz PTS/OPTS)
  opts: number;  // OPTS (iz PTS/OPTS)
  diff: number;
}

export class WABAStandingsScraper {
  private browser: any = null;
  private usePuppeteer: boolean = false;
  private usePlaywright: boolean = false;

  async initialize() {
    // Detektuj da li smo u Vercel/produkciji
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Za Vercel/produkciju, prioritizuj Puppeteer + @sparticuz/chromium
    // Playwright ne radi u Vercel serverless bez bundling browser-a
    // Zatim ScrapingBee API kao fallback
    
    // 1. Za Vercel/produkciju, koristi Puppeteer + @sparticuz/chromium (najbolje za serverless)
    if (isVercel || (isProduction && chromium)) {
      if (puppeteer && chromium) {
        try {
          console.log('Pokušavam inicijalizaciju Puppeteer sa @sparticuz/chromium za Vercel...');
          
          // Konfiguriši chromium za Vercel - isključi graphics mode
          if (typeof chromium.setGraphicsMode === 'function') {
            chromium.setGraphicsMode(false);
          }
          
          const executablePath = await chromium.executablePath();
          console.log('Chromium executable path:', executablePath ? 'OK' : 'MISSING');
          
          if (!executablePath) {
            throw new Error('Chromium executable path nije dostupan');
          }
          
          // Koristi argumente koje @sparticuz/chromium preporučuje za Vercel
          // @sparticuz/chromium već ima dobre default argumente, samo dodajemo dodatne ako je potrebno
          const chromiumArgs = [
            ...(chromium.args || []),
            '--disable-gpu',
            '--disable-software-rasterizer',
            '--disable-dev-shm-usage',
            '--no-sandbox',
            '--disable-setuid-sandbox',
          ];
          
          // Ukloni duplikate
          const uniqueArgs = [...new Set(chromiumArgs)];
          
          this.browser = await puppeteer.launch({
            args: uniqueArgs,
            defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
            executablePath: executablePath,
            headless: chromium.headless !== false, // Uvek headless u produkciji
          });
          
          this.usePuppeteer = true;
          console.log('✓ Puppeteer uspešno inicijalizovan sa @sparticuz/chromium');
          return true;
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          console.error('✗ Greška pri inicijalizaciji Puppeteer sa @sparticuz/chromium:', errorMsg);
          
          // Ako je greška vezana za shared libraries, to znači da @sparticuz/chromium
          // možda nije pravilno instaliran ili verzija nije kompatibilna
          if (errorMsg.includes('shared libraries') || errorMsg.includes('libnss3.so')) {
            console.error('NAPOMENA: @sparticuz/chromium zahteva dodatne system biblioteke.');
            console.error('Proverite da li je @sparticuz/chromium pravilno instaliran i da li je verzija kompatibilna sa Vercel Lambda okruženjem.');
            console.error('Preporučeno: koristite ScrapingBee API kao alternativu.');
          }
          
          console.error('Stack trace:', err.stack);
        }
      }
    }
    
    // 2. Za lokalno okruženje, probaj Playwright
    if (!isVercel && playwright) {
      try {
        console.log('Pokušavam inicijalizaciju Playwright...');
        
        // Za Windows, koristi drugačije opcije
        const isWindows = process.platform === 'win32';
        const launchOptions: any = {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--disable-software-rasterizer',
          ],
        };
        
        // --single-process može da pravi probleme na Windows-u
        if (!isWindows) {
          launchOptions.args.push('--single-process');
        }
        
        this.browser = await playwright.chromium.launch(launchOptions);
        
        // Sačekaj malo da se browser potpuno inicijalizuje
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        this.usePlaywright = true;
        console.log('✓ Playwright uspešno inicijalizovan');
        return true;
      } catch (err: any) {
        console.warn('✗ Greška pri inicijalizaciji Playwright:', err.message);
        console.warn('Stack trace:', err.stack);
      }
    }
    
    // 3. Fallback: Pokušaj sa običnim Puppeteer (za lokalno okruženje)
    if (!isVercel) {
      // Za lokalno okruženje, probaj obični Puppeteer
      if (puppeteer) {
        try {
          if (chromium) {
            const executablePath = await chromium.executablePath();
            
            this.browser = await puppeteer.launch({
              args: chromium.args,
              defaultViewport: chromium.defaultViewport,
              executablePath: executablePath,
              headless: chromium.headless,
            });
          } else {
            this.browser = await puppeteer.launch({
              headless: true,
              args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
                '--disable-features=IsolateOrigins,site-per-process',
                '--window-size=1920,1080',
              ],
            });
          }
          
          this.usePuppeteer = true;
          console.log('✓ Puppeteer uspešno inicijalizovan');
          return true;
        } catch (err: any) {
          console.warn('Greška pri inicijalizaciji Puppeteer:', err.message);
        }
      }
    }

    // Ako ništa nije uspelo
    console.error('✗ Nijedan browser automation tool nije uspeo da se inicijalizuje');
    console.error('Dostupni paketi:', {
      puppeteer: !!puppeteer,
      chromium: !!chromium,
      playwright: !!playwright,
      vercel: isVercel,
      production: isProduction,
      scrapeDoToken: !!(process.env.SCRAPE_DO_TOKEN || process.env.SCRAPEDO_TOKEN),
      scrapingBeeApiKey: !!process.env.SCRAPINGBEE_API_KEY,
    });
    
    // Ako postoji Scrape.do token ili ScrapingBee API key, to je OK - koristićemo ga umesto browser automation
    const scrapeDoToken = process.env.SCRAPE_DO_TOKEN?.trim() || process.env.SCRAPEDO_TOKEN?.trim();
    if (scrapeDoToken) {
      console.log('ℹ Scrape.do token je dostupan - koristiće se umesto browser automation');
      return false; // Vraćamo false ali će Scrape.do biti korišćen u scrapeStandings
    }
    if (process.env.SCRAPINGBEE_API_KEY) {
      console.log('ℹ ScrapingBee API key je dostupan - koristiće se umesto browser automation');
      return false; // Vraćamo false ali će ScrapingBee biti korišćen u scrapeStandings
    }
    
    this.usePuppeteer = false;
    return false;
  }

  async scrapeStandings(): Promise<WabaTeamData[]> {
    // Proveri prvo da li postoji Scrape.do API token - koristi ga kao primarni način
    // Scrape.do radi i u development i u production okruženju
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
    const scrapeDoToken = process.env.SCRAPE_DO_TOKEN?.trim() || process.env.SCRAPEDO_TOKEN?.trim();
    
    // Ako postoji Scrape.do token, koristi ga prvo
    if (scrapeDoToken) {
      console.log(`✓ Koristim Scrape.do API (preporučeno za ${isVercel ? 'produkciji (Vercel)' : 'development'})...`);
      try {
        const standings = await this.scrapeWithScrapeDo();
        if (standings && standings.length > 0) {
          console.log(`✓ Scrape.do uspešan: pronađeno ${standings.length} timova`);
          return standings;
        } else {
          console.warn('Scrape.do vratio prazan rezultat, pokušavam sa ScrapingBee...');
        }
      } catch (sdError: any) {
        const errorMsg = sdError?.message || String(sdError);
        console.error('✗ Scrape.do API neuspešan:', errorMsg);
        
        // Ako je greška vezana za JavaScript renderovanje, brzo pređi na browser automation
        if (errorMsg.includes('JavaScript nije renderovan') || errorMsg.includes('mbt-table') || errorMsg.includes('nije pronađena')) {
          console.warn('⚠ Scrape.do ne renderuje JavaScript - prebacujem se direktno na browser automation');
          // Inicijalizuj browser automation ako nije već inicijalizovan
          if (!this.browser) {
            console.log('Inicijalizujem browser automation za fallback...');
            await this.initialize();
          }
          // Preskoči ScrapingBee i idi direktno na browser automation
          if (this.usePlaywright && this.browser) {
            return this.scrapeWithPlaywright();
          }
          if (this.usePuppeteer && this.browser) {
            // Fallback na Puppeteer će se desiti u nastavku
          }
        } else {
          console.warn('Pokušavam sa ScrapingBee fallback...');
          // Nastavi sa ScrapingBee fallback samo ako nije greška vezana za renderovanje
        }
      }
    }
    
    // Proveri da li postoji ScrapingBee API key - koristi ga kao sekundarni način
    // ScrapingBee radi i u development i u production okruženju
    const scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY?.trim();
    
    // Debug: loguj sve environment variables koje se tiču ScrapingBee
    console.log('=== SCRAPINGBEE DEBUG ===');
    console.log('Environment check:', {
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
      NODE_ENV: process.env.NODE_ENV,
      isVercel: isVercel,
    });
    
    // Proveri sve moguće varijante imena environment variable
    const envVars = {
      'SCRAPINGBEE_API_KEY': process.env.SCRAPINGBEE_API_KEY,
      'NEXT_PUBLIC_SCRAPINGBEE_API_KEY': process.env.NEXT_PUBLIC_SCRAPINGBEE_API_KEY,
      'scrapingbee_api_key': process.env.scrapingbee_api_key,
    };
    
    console.log('All ScrapingBee env vars:', Object.keys(envVars).map(key => ({
      key,
      exists: !!envVars[key as keyof typeof envVars],
      length: envVars[key as keyof typeof envVars]?.length || 0,
    })));
    
    console.log('ScrapingBee API key check:', {
      exists: !!process.env.SCRAPINGBEE_API_KEY,
      trimmed: !!scrapingBeeApiKey,
      length: scrapingBeeApiKey?.length || 0,
      preview: scrapingBeeApiKey ? `${scrapingBeeApiKey.substring(0, 10)}...${scrapingBeeApiKey.substring(scrapingBeeApiKey.length - 5)}` : 'N/A',
      isEmpty: scrapingBeeApiKey === '',
      isUndefined: scrapingBeeApiKey === undefined,
      isNull: scrapingBeeApiKey === null,
    });
    console.log('=== END SCRAPINGBEE DEBUG ===');
    
    console.log('Provera ScrapingBee API key:', scrapingBeeApiKey ? `DOSTUPAN (${scrapingBeeApiKey.length} karaktera)` : 'NIJE DOSTUPAN');
    
    if (scrapingBeeApiKey) {
      const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
      const env = isVercel ? 'produkciji (Vercel)' : process.env.NODE_ENV === 'production' ? 'produkciji' : 'development';
      console.log(`✓ Koristim ScrapingBee API (preporučeno za ${env})...`);
      try {
        const standings = await this.scrapeWithScrapingBee();
        if (standings && standings.length > 0) {
          console.log(`✓ ScrapingBee uspešan: pronađeno ${standings.length} timova`);
          return standings;
        } else {
          console.warn('ScrapingBee vratio prazan rezultat, pokušavam sa browser automation...');
        }
      } catch (sbError: any) {
        console.error('✗ ScrapingBee API neuspešan:', sbError.message);
        console.error('ScrapingBee error details:', {
          message: sbError.message,
          stack: sbError.stack?.substring(0, 500),
        });
        
        // Ako je greška vezana za invalid API key ili u Vercel-u, baci jasnu grešku
        if (sbError.message && sbError.message.includes('Invalid API key')) {
          if (isVercel) {
            throw new Error('ScrapingBee API key nije validan. Proverite da li je SCRAPINGBEE_API_KEY pravilno postavljen u Vercel Environment Variables (Settings → Environment Variables → Production) i da li je validan na ScrapingBee dashboard-u.');
          }
          console.warn('⚠ ScrapingBee API key nije validan. Koristim browser automation fallback...');
          console.warn('Za produkciju, proverite da li je ScrapingBee API key pravilno postavljen u Vercel Environment Variables.');
        } else if (isVercel) {
          // U Vercel-u, ako ScrapingBee ne radi, baci grešku umesto da pokušava browser automation
          throw new Error(`ScrapingBee API neuspešan u Vercel produkciji: ${sbError.message}. Proverite da li je SCRAPINGBEE_API_KEY pravilno postavljen i da li imate dovoljno kredita na ScrapingBee nalogu.`);
        } else {
          console.warn('Pokušavam sa browser automation fallback...');
        }
        // Nastavi sa browser automation fallback samo ako nismo u Vercel-u
        if (!isVercel) {
          // Nastavi sa browser automation fallback
        } else {
          throw sbError; // U Vercel-u, baci grešku
        }
      }
    } else {
      // Ako nema ScrapingBee API key u Vercel produkciji, proveri da li postoji Scrape.do token
      if (isVercel) {
        if (!scrapeDoToken) {
          throw new Error('Nijedan scraping API nije dostupan u Vercel produkciji. Proverite da li je SCRAPE_DO_TOKEN ili SCRAPINGBEE_API_KEY pravilno postavljen u Vercel Environment Variables (Settings → Environment Variables → Production).');
        }
      }
      console.log('ScrapingBee API key nije dostupan, koristim browser automation ili fetch');
    }

    // Ako browser automation nije inicijalizovan, pokušaj da ga inicijalizuješ
    if (!this.browser) {
      console.log('Browser automation nije inicijalizovan, pokušavam inicijalizaciju...');
      await this.initialize();
    }

    // Ako Playwright je dostupan, koristi ga
    if (this.usePlaywright && this.browser) {
      return this.scrapeWithPlaywright();
    }

    // Ako Puppeteer je dostupan, koristi ga
    if (this.usePuppeteer && this.browser) {
      // Puppeteer će se koristiti u nastavku koda
    }

    // Ako browser automation nije dostupan ili nije uspeo da se inicijalizuje, koristi fetch
    if (!this.usePuppeteer || !this.browser) {
      if (isVercel) {
        // U Vercel produkciji, fetch metoda neće raditi jer stranica koristi JavaScript
        // Ako smo došli ovde, znači da Scrape.do i ScrapingBee nisu radili i browser automation nije dostupan
        throw new Error('Browser automation nije dostupan u Vercel produkciji. Proverite da li su instalirani puppeteer-core i @sparticuz/chromium paketi, ili da li je SCRAPE_DO_TOKEN ili SCRAPINGBEE_API_KEY pravilno postavljen u Vercel Environment Variables.');
      }
      console.log('Koristim fetch metodu jer browser automation nije dostupan ili nije inicijalizovan');
      console.warn('NAPOMENA: Fetch metoda možda neće moći da pronađe tabelu ako stranica koristi JavaScript za renderovanje.');
      return this.scrapeWithFetch();
    }

    let page = null;
    try {
      page = await this.browser.newPage();
      page.setDefaultNavigationTimeout(CONFIG.TIMEOUT);
      page.setDefaultTimeout(CONFIG.TIMEOUT);

      // Postavi User-Agent da izgleda kao pravi browser
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Postavi viewport
      await page.setViewport({ width: 1920, height: 1080 });

      console.log(`Učitavanje stranice: ${CONFIG.URL}`);
      
      // Pokušaj sa različitim waitUntil strategijama
      try {
        await page.goto(CONFIG.URL, { 
          waitUntil: 'domcontentloaded',
          timeout: CONFIG.TIMEOUT 
        });
      } catch (err: any) {
        // Ako prvi pokušaj ne uspe, probaj sa 'load'
        console.log('Prvi pokušaj neuspešan, pokušavam sa "load"...');
        try {
          await page.goto(CONFIG.URL, { 
            waitUntil: 'load',
            timeout: CONFIG.TIMEOUT 
          });
        } catch (err2: any) {
          // Ako i to ne uspe, probaj sa 'networkidle2'
          console.log('Drugi pokušaj neuspešan, pokušavam sa "networkidle2"...');
      await page.goto(CONFIG.URL, { 
            waitUntil: 'networkidle2',
        timeout: CONFIG.TIMEOUT 
      });
        }
      }

      // Čekaj da se tabela učita - nova struktura koristi mbt-table klasu
      // Pokušaj sa različitim selektorima
      let tableFound = false;
      const selectors = [
        'table.mbt-table tbody tr',
        'table.mbt-table tr',
        'table tbody tr',
        'table tr',
        '.mbt-table tbody tr',
        'table[class*="mbt"] tbody tr'
      ];
      
      for (const selector of selectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`✓ Tabela pronađena sa selektorom: ${selector}`);
          tableFound = true;
          break;
        } catch (err) {
          // Probaj sledeći selektor
        }
      }
      
      if (!tableFound) {
        console.log('Tabela nije pronađena sa standardnim selektorima, nastavljam sa čekanjem...');
      }

      // Pauziraj duže da se svi podaci učitaju (JavaScript renderovanje)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Proveri da li tabela postoji pre parsiranja
      const tableExists = await page.evaluate(() => {
        const table = document.querySelector('table.mbt-table') || document.querySelector('table');
        return !!table;
      });
      
      if (!tableExists) {
        console.error('Tabela nije pronađena na stranici nakon čekanja');
        // Pokušaj da sačekaš još malo
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Izvuci podatke iz stranice
      const standings = await page.evaluate(() => {
        // Pronađi sve tabele sa mbt-table klasom
        const allTables = Array.from(document.querySelectorAll('table.mbt-table'));
        
        // Pronađi glavnu tabelu sa standings podacima (ona koja ima redove sa linkovima na timove)
        let table: HTMLTableElement | null = null;
        
        for (const t of allTables) {
          // Preskoči tabele koje su u legend div-u
          const parentDiv = t.closest('div');
          if (parentDiv && (parentDiv.id?.includes('legend') || parentDiv.classList.contains('mbt-subcontent'))) {
            continue;
          }
          
          // Proveri da li tabela ima redove sa linkovima na timove (team_id atribut)
          const hasTeamLinks = t.querySelectorAll('a[team_id]').length > 0;
          if (hasTeamLinks) {
            table = t as HTMLTableElement;
            console.log('Pronađena glavna tabela sa team linkovima');
            break;
          }
        }
        
        // Ako nije pronađena sa team linkovima, uzmi prvu tabelu koja nije u legend div-u
        if (!table) {
          for (const t of allTables) {
            const parentDiv = t.closest('div');
            if (!parentDiv || (!parentDiv.id?.includes('legend') && !parentDiv.classList.contains('mbt-subcontent'))) {
              table = t as HTMLTableElement;
              console.log('Pronađena tabela (fallback)');
              break;
            }
          }
        }
        
        // Fallback na bilo koju tabelu
        if (!table) {
          table = document.querySelector('table.mbt-table') as HTMLTableElement || 
                  document.querySelector('table[class*="mbt"]') as HTMLTableElement ||
                  document.querySelector('table') as HTMLTableElement;
        }
        
        if (!table) {
          console.error('Tabela nije pronađena u DOM-u');
          // Debug: loguj sve tabele na stranici
          const allTablesDebug = document.querySelectorAll('table');
          console.error(`Pronađeno tabela: ${allTablesDebug.length}`);
          allTablesDebug.forEach((t, i) => {
            const parent = t.closest('div');
            console.error(`Tabela ${i}:`, t.className, t.id, 'parent:', parent?.id, parent?.className);
          });
          return [];
        }
        
        const rows = table.querySelectorAll('tbody tr');
        console.log(`Pronađeno redova u tabeli: ${rows.length}`);
        const data: WabaTeamData[] = [];
        
        // Lista header redova koje treba preskočiti
        const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P', 'No', 'W/L', 'Points', '#', 'Rank'];

        rows.forEach((row, index) => {
          // Preskoči header redove (th elementi ili redovi sa mbt-subheader klasom)
          if (row.classList.contains('mbt-subheader') || row.querySelector('th')) {
            return;
          }
          
          const cells = Array.from(row.querySelectorAll('td'));
          
          // Kompleksna struktura: No | Team | G | W | L | P | PTS/OPTS | +/- | ...
          // Minimum 6 kolona za kompleksnu tabelu
          if (cells.length < 6) return;
          
          // Preskoči header redove
          const firstCell = cells[0]?.textContent?.trim() || '';
          const secondCell = cells[1]?.textContent?.trim() || '';
          if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
            return;
          }
          
          // Preskoči redove koji su samo brojevi bez imena tima
          if (!secondCell || secondCell.length === 0) return;
          
          // Struktura kompleksne tabele: No | Team | G | W | L | P | PTS/OPTS | +/- | ...
          let rank = 0;
          let teamName = '';
          let gp = 0;    // G - Games (odigrane utakmice)
          let w = 0;     // W - Wins (pobede)
          let l = 0;     // L - Losses (porazi)
          let points = 0; // P - Points (bodovi)
          let pts = 0;    // PTS (iz PTS/OPTS)
          let opts = 0;   // OPTS (iz PTS/OPTS)
          let diff = 0;   // +/- (razlika)
          
          // Kolona 0: No (pozicija) - format "1." ili "1"
          const noCell = cells[0]?.textContent?.trim() || '';
          const rankMatch = noCell.match(/^(\d+)\.?/);
          if (rankMatch) {
            rank = parseInt(rankMatch[1]);
          } else if (!isNaN(parseInt(noCell)) && parseInt(noCell) > 0) {
            rank = parseInt(noCell);
          } else {
            rank = index + 1;
          }
          
          // Kolona 1: Team (tim) - iz <a> taga unutar td
          // Proveri da li postoji link sa team_id atributom (glavna tabela)
          const teamCell = cells[1];
          if (teamCell) {
            const teamLink = teamCell.querySelector('a[team_id]') || teamCell.querySelector('a');
            if (teamLink) {
              teamName = teamLink.textContent?.trim() || '';
              // Ako nema team_id, možda je ovo legend tabela - preskoči
              if (!teamLink.hasAttribute('team_id') && teamName.length < 3) {
                return; // Verovatno legend tabela
              }
            } else {
              teamName = teamCell.textContent?.trim() || '';
            }
          }
          
          // Ako nema ime tima ili je prekratko, preskoči (verovatno legend)
          if (!teamName || teamName.length < 2) {
            return;
          }
          
          // Kolona 2: G (Games - odigrane utakmice)
          const gCell = cells[2]?.textContent?.trim() || '';
          gp = parseInt(gCell || '0') || 0;
          
          // Kolona 3: W (Wins - pobede)
          const wCell = cells[3]?.textContent?.trim() || '';
          w = parseInt(wCell || '0') || 0;
          
          // Kolona 4: L (Losses - porazi)
          const lCell = cells[4]?.textContent?.trim() || '';
          l = parseInt(lCell || '0') || 0;
          
          // Kolona 5: P (Points - bodovi)
          const pointsCell = cells[5]?.textContent?.trim() || '';
          points = parseInt(pointsCell || '0') || 0;
          
          // Kolona 6: PTS/OPTS (Points/Opponent Points) - format "514/424" ili "514<span></span>/<span></span>424"
          if (cells.length > 6) {
            const ptsOptsCell = cells[6]?.textContent?.trim() || '';
            // Ukloni sve HTML entitete i spanove, ostavi samo brojeve i /
            const ptsOptsClean = ptsOptsCell.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
            if (ptsOptsClean.includes('/')) {
              const parts = ptsOptsClean.split('/');
              pts = parseInt(parts[0]?.trim() || '0') || 0;
              opts = parseInt(parts[1]?.trim() || '0') || 0;
            }
          }
          
          // Kolona 7: +/- (razlika)
          if (cells.length > 7) {
            const diffCell = cells[7]?.textContent?.trim() || '';
            // Može biti pozitivan ili negativan broj
            diff = parseInt(diffCell || '0') || 0;
          }
            
          // Dodaj samo ako ima ime tima i validne podatke
          if (teamName && teamName.length > 0 && rank > 0) {
            const team: WabaTeamData = {
              rank,
              team: teamName.trim(),
              gp: gp,
              w,
              l,
              points, // P - Points (bodovi)
              pts,    // PTS (iz PTS/OPTS)
              opts,   // OPTS (iz PTS/OPTS)
              diff,   // +/- (razlika)
            };
            data.push(team);
          }
        });

        return data;
      });

      console.log(`Uspješno učitano ${standings.length} timova`);
      
      if (standings.length === 0) {
        // Pokušaj da dobiješ više informacija o tome zašto nije pronađeno
        const debugInfo = await page.evaluate(() => {
          const table = document.querySelector('table.mbt-table') || document.querySelector('table');
          if (!table) {
            return { error: 'Tabela nije pronađena', tablesCount: document.querySelectorAll('table').length };
          }
          const rows = table.querySelectorAll('tbody tr');
          return {
            tableFound: true,
            rowsCount: rows.length,
            firstRowContent: rows[0]?.textContent?.substring(0, 100) || 'N/A',
            tableClass: table.className
          };
        });
        
        console.error('Debug info:', debugInfo);
        throw new Error(`Nijedan tim nije pronađen. Debug: ${JSON.stringify(debugInfo)}`);
      }

      return standings;

    } catch (err) {
      console.error('Greška pri scrapanju sa Puppeteer:', err);
      // Fallback na fetch ako Puppeteer ne radi
      console.log('Pokušavam sa fetch metodom...');
      return this.scrapeWithFetch();
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  private async scrapeWithScrapingBee(): Promise<WabaTeamData[]> {
    const scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY?.trim();
    if (!scrapingBeeApiKey) {
      throw new Error('SCRAPINGBEE_API_KEY nije postavljen');
    }

    // Proveri da li API key izgleda validno (ScrapingBee API key je obično 40+ karaktera)
    if (scrapingBeeApiKey.length < 20) {
      throw new Error(`SCRAPINGBEE_API_KEY izgleda nevalidno (prekratak: ${scrapingBeeApiKey.length} karaktera). Proverite da li je pravilno postavljen u .env fajlu.`);
    }

    console.log('Koristim ScrapingBee API za scraping...');
    console.log(`API key dužina: ${scrapingBeeApiKey.length} karaktera`);
    
    try {
      // ScrapingBee API sa render_js=true za JavaScript-renderovane stranice
      // Povećaj wait vreme da se tabela potpuno učita (maksimum je 10000ms)
      // Dodaj premium=true za bolje renderovanje JavaScript-a
      const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${encodeURIComponent(scrapingBeeApiKey)}&url=${encodeURIComponent(CONFIG.URL)}&render_js=true&wait=10000&premium=true`;
      
      console.log('Pozivam ScrapingBee API...');
      console.log('ScrapingBee URL (bez API key):', `https://app.scrapingbee.com/api/v1/?url=${encodeURIComponent(CONFIG.URL)}&render_js=true&wait=10000&premium=true`);
      
      const response = await fetch(scrapingBeeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        // Povećaj timeout za produkciju
        signal: AbortSignal.timeout(60000), // 60 sekundi timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `ScrapingBee API error: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage += ' - Invalid API key. Proverite da li je API key pravilno postavljen u .env fajlu i da li je validan na ScrapingBee dashboard-u.';
        } else if (response.status === 402) {
          errorMessage += ' - Payment required. Proverite da li imate dovoljno kredita na ScrapingBee nalogu.';
        } else {
          errorMessage += ` - ${errorText.substring(0, 200)}`;
        }
        
        throw new Error(errorMessage);
      }

      const html = await response.text();
      
      if (!html || html.length < 100) {
        throw new Error('ScrapingBee vratio prazan HTML');
      }

      console.log(`ScrapingBee vratio ${html.length} karaktera HTML-a`);
      
      // Proveri da li HTML sadrži mbt-table
      const hasMbtTable = html.includes('mbt-table') || html.includes('mbt-standings');
      console.log(`HTML sadrži mbt-table: ${hasMbtTable}`);
      
      // Proveri da li HTML sadrži team_id linkove (glavna tabela)
      const hasTeamIdLinks = html.includes('team_id') || html.includes('teamId');
      console.log(`HTML sadrži team_id linkove: ${hasTeamIdLinks}`);
      
      // Debug: loguj mali deo HTML-a da vidimo strukturu
      const tableMatch = html.match(/<table[^>]*class="[^"]*mbt[^"]*"[^>]*>[\s\S]{0,500}/i);
      if (tableMatch) {
        console.log('Pronađena mbt tabela u HTML-u:', tableMatch[0].substring(0, 200));
      }
      
      // Ako nema mbt-table u HTML-u, možda ScrapingBee nije dovoljno čekao
      if (!hasMbtTable && !hasTeamIdLinks) {
        console.warn('⚠ ScrapingBee HTML ne sadrži mbt-table ili team_id linkove - možda JavaScript nije renderovan');
        console.warn('Pokušavam parsiranje ipak...');
      }
      
      const standings = this.parseRowsDirectly(html);
      
      if (standings.length === 0) {
        // Pokušaj sa različitim parsiranjem
        console.warn('Prvo parsiranje nije pronašlo podatke, pokušavam alternativno...');
        
        // Debug: proveri šta je u HTML-u
        const debugTableMatch = html.match(/<table[^>]*>[\s\S]{0,1000}/i);
        if (debugTableMatch) {
          console.log('Debug - pronađena tabela u HTML-u:', debugTableMatch[0].substring(0, 500));
        }
        
        // Proveri da li možda postoji problem sa renderovanjem
        const hasScriptTags = html.includes('<script') && html.includes('</script>');
        const hasBodyTag = html.includes('<body');
        console.log(`HTML struktura: hasScriptTags=${hasScriptTags}, hasBodyTag=${hasBodyTag}`);
        
        // Ako nema mbt-table, pokušaj ponovo sa dužim čekanjem
        if (!hasMbtTable) {
          console.warn('⚠ Prvi ScrapingBee poziv nije vratio mbt-table, pokušavam ponovo sa dužim čekanjem...');
          
          // Pokušaj ponovo sa još dužim čekanjem (maksimum 10 sekundi)
          const retryUrl = `https://app.scrapingbee.com/api/v1/?api_key=${encodeURIComponent(scrapingBeeApiKey)}&url=${encodeURIComponent(CONFIG.URL)}&render_js=true&wait=10000&premium=true&block_resources=image,media,font`;
          
          try {
            const retryResponse = await fetch(retryUrl, {
              method: 'GET',
              headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              },
              signal: AbortSignal.timeout(60000),
            });
            
            if (retryResponse.ok) {
              const retryHtml = await retryResponse.text();
              console.log(`ScrapingBee retry vratio ${retryHtml.length} karaktera HTML-a`);
              
              const retryHasMbtTable = retryHtml.includes('mbt-table') || retryHtml.includes('mbt-standings');
              const retryHasTeamIdLinks = retryHtml.includes('team_id') || retryHtml.includes('teamId');
              
              if (retryHasMbtTable || retryHasTeamIdLinks) {
                const retryStandings = this.parseRowsDirectly(retryHtml);
                if (retryStandings.length > 0) {
                  console.log(`✓ Retry uspešan: pronađeno ${retryStandings.length} timova`);
                  return retryStandings;
                }
              }
            }
          } catch (retryErr: any) {
            console.warn('Retry ScrapingBee poziv neuspešan:', retryErr.message);
          }
          
          throw new Error('ScrapingBee vratio HTML ali tabela (mbt-table) nije pronađena. JavaScript možda nije renderovan. Pokušajte sa browser automation fallback.');
        }
        
        throw new Error('ScrapingBee vratio HTML ali tabela nije pronađena ili nema podataka');
      }

      console.log(`✓ Uspešno učitano ${standings.length} timova (ScrapingBee)`);
      return standings;
    } catch (error: any) {
      console.error('✗ Greška pri scrapanju sa ScrapingBee:', error.message);
      throw error;
    }
  }

  private async scrapeWithScrapeDo(): Promise<WabaTeamData[]> {
    const scrapeDoToken = process.env.SCRAPE_DO_TOKEN?.trim() || process.env.SCRAPEDO_TOKEN?.trim();
    if (!scrapeDoToken) {
      throw new Error('SCRAPE_DO_TOKEN nije postavljen');
    }

    // Proveri da li token izgleda validno
    if (scrapeDoToken.length < 10) {
      throw new Error(`SCRAPE_DO_TOKEN izgleda nevalidno (prekratak: ${scrapeDoToken.length} karaktera). Proverite da li je pravilno postavljen u .env fajlu.`);
    }

    console.log('Koristim Scrape.do API za scraping...');
    console.log(`Token dužina: ${scrapeDoToken.length} karaktera`);
    
    try {
      // Scrape.do API format: https://api.scrape.do/?url=...&token=...
      // Pokušavamo sa i bez JavaScript renderovanja parametara
      // Prvo bez parametara, pa ako ne radi, sa render=true
      let scrapeDoUrl = `https://api.scrape.do/?url=${encodeURIComponent(CONFIG.URL)}&token=${encodeURIComponent(scrapeDoToken)}`;
      
      console.log('Pozivam Scrape.do API...');
      console.log('Scrape.do URL (bez token):', `https://api.scrape.do/?url=${encodeURIComponent(CONFIG.URL)}&token=***`);
      
      const response = await fetch(scrapeDoUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        // Povećaj timeout za produkciju
        signal: AbortSignal.timeout(60000), // 60 sekundi timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Scrape.do API error: ${response.status}`;
        
        if (response.status === 401 || response.status === 403) {
          errorMessage += ' - Invalid token. Proverite da li je token pravilno postavljen u .env fajlu i da li je validan na Scrape.do dashboard-u.';
        } else if (response.status === 402 || response.status === 429) {
          errorMessage += ' - Payment required or rate limit exceeded. Proverite da li imate dovoljno kredita na Scrape.do nalogu.';
        } else {
          errorMessage += ` - ${errorText.substring(0, 200)}`;
        }
        
        throw new Error(errorMessage);
      }

      const html = await response.text();
      
      if (!html || html.length < 100) {
        throw new Error('Scrape.do vratio prazan HTML');
      }

      console.log(`Scrape.do vratio ${html.length} karaktera HTML-a`);
      
      // DEBUG: Sačuvaj HTML u development okruženju za analizu
      if (process.env.NODE_ENV === 'development') {
        try {
          const fs = require('fs');
          const path = require('path');
          const outputPath = path.join(process.cwd(), 'scrape-do-output.html');
          fs.writeFileSync(outputPath, html);
          console.log(`📄 HTML sačuvan u: ${outputPath}`);
        } catch (fsError) {
          // Ignoriši greške pri pisanju fajla
        }
      }
      
      // Proveri da li HTML sadrži mbt-table
      const hasMbtTable = html.includes('mbt-table') || html.includes('mbt-standings');
      console.log(`HTML sadrži mbt-table: ${hasMbtTable}`);
      
      // Proveri da li HTML sadrži team_id linkove (glavna tabela)
      const hasTeamIdLinks = html.includes('team_id') || html.includes('teamId');
      console.log(`HTML sadrži team_id linkove: ${hasTeamIdLinks}`);
      
      // Dodatne provere za debug
      const hasTable = html.includes('<table');
      const hasScript = html.includes('<script');
      const hasBody = html.includes('<body');
      console.log(`HTML struktura: hasTable=${hasTable}, hasScript=${hasScript}, hasBody=${hasBody}`);
      
      // Debug: loguj mali deo HTML-a da vidimo strukturu
      const tableMatch = html.match(/<table[^>]*class="[^"]*mbt[^"]*"[^>]*>[\s\S]{0,500}/i);
      if (tableMatch) {
        console.log('Pronađena mbt tabela u HTML-u:', tableMatch[0].substring(0, 200));
      }
      
      // Ako nema mbt-table u HTML-u, Scrape.do verovatno ne renderuje JavaScript
      // Brzo pređi na fallback umesto da pokušavaš parsiranje
      if (!hasMbtTable && !hasTeamIdLinks) {
        console.warn('⚠ Scrape.do HTML ne sadrži mbt-table ili team_id linkove - JavaScript nije renderovan');
        console.warn('Scrape.do možda ne podržava JavaScript renderovanje za ovu stranicu');
        throw new Error('Scrape.do vratio HTML ali tabela (mbt-table) nije pronađena. JavaScript nije renderovan. Prebacujem se na browser automation fallback.');
      }
      
      const standings = this.parseRowsDirectly(html);
      
      if (standings.length === 0) {
        // Ako nema podataka nakon parsiranja, baci grešku da bi se prešlo na fallback
        console.warn('⚠ Scrape.do vratio HTML ali nema podataka u tabeli');
        throw new Error('Scrape.do vratio HTML ali tabela nije pronađena ili nema podataka. Prebacujem se na browser automation fallback.');
      }

      console.log(`✓ Uspešno učitano ${standings.length} timova (Scrape.do)`);
      return standings;
    } catch (error: any) {
      console.error('✗ Greška pri scrapanju sa Scrape.do:', error.message);
      throw error;
    }
  }

  private async scrapeWithFetch(): Promise<WabaTeamData[]> {
    try {
      console.log('Koristim fetch metodu za scraping...');
      
      // Pokušaj sa običnim fetch-om (bez JavaScript renderovanja)
      const response = await fetch(CONFIG.URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      
      // Proveri da li HTML uopšte sadrži neki sadržaj
      if (!html || html.length < 100) {
        throw new Error('Stranica je prazna ili nije učitana');
      }

      // Pokušaj različite selektore za tabelu - prvo mbt-table
      let tableMatch = html.match(/<table[^>]*class="[^"]*mbt-table[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
      
      // Ako nije pronađena sa mbt-table, probaj sa standardnim selektorom
      if (!tableMatch) {
        tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
      }
      
      // Ako nije pronađena sa standardnim selektorom, probaj sa različitim varijantama
      if (!tableMatch) {
        // Pokušaj sa tbody
        tableMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
      }
      
      // Pokušaj da pronađeš div sa tabelom
      if (!tableMatch) {
        const divWithTable = html.match(/<div[^>]*class="[^"]*table[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (divWithTable) {
          tableMatch = divWithTable[1].match(/<table[^>]*>([\s\S]*?)<\/table>/i);
        }
      }

      // Ako i dalje nije pronađena, probaj da pronađeš bilo koji element sa tr redovima
      if (!tableMatch) {
        const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
        if (trMatches && trMatches.length > 0) {
          // Ako ima tr redova, pokušaj da ih parsiraš direktno
          console.log(`Pronađeno ${trMatches.length} redova u HTML-u, pokušavam direktno parsiranje...`);
          return this.parseRowsDirectly(html);
        }
      }

      if (!tableMatch) {
        console.error('HTML snippet (prvih 1000 karaktera):', html.substring(0, 1000));
        throw new Error('Tabela nije pronađena na stranici. Stranica možda koristi JavaScript za renderovanje.');
      }

      const tableHtml = tableMatch[1];
      
      // Proveri da li tabela ima sadržaj
      if (!tableHtml || tableHtml.trim().length < 50) {
        console.warn('Tabela je pronađena ali je prazna, pokušavam direktno parsiranje...');
        return this.parseRowsDirectly(html);
      }
      
      const rowMatches = Array.from(tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
      
      // Ako nema redova u tabeli, probaj direktno parsiranje
      if (rowMatches.length === 0) {
        console.warn('Nema redova u tabeli, pokušavam direktno parsiranje...');
        return this.parseRowsDirectly(html);
      }
      
      const standings: WabaTeamData[] = [];
      const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P', 'No', 'W/L', 'Points', '#', 'Rank'];

      for (let index = 0; index < rowMatches.length; index++) {
        const rowMatch = rowMatches[index];
        const rowFull = rowMatch[0]; // Ceo red sa atributima
        const row = rowMatch[1];
        
        // Preskoči header redove (mbt-subheader ili th elementi)
        if (rowFull.includes('class="') && (rowFull.includes('mbt-subheader') || rowFull.includes('mbt-header'))) {
          continue;
        }
        
        const cellMatches = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
        
        // Kompleksna struktura: No | Team | G | W | L | P | PTS/OPTS | +/- | ...
        // Minimum 6 kolona za kompleksnu tabelu
        if (cellMatches.length < 6) continue;
        
        // Parsiraj ćelije
        const cells: Array<{ text: string; html: string }> = [];
        
        for (const cellMatch of cellMatches) {
          const cellHtml = cellMatch[1];
          let text = cellHtml
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Ukloni script tagove
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/\s+/g, ' ')
            .trim();
          
          cells.push({ text, html: cellHtml });
        }
        
        // Preskoči header redove
        const firstCell = cells[0]?.text || '';
        const secondCell = cells[1]?.text || '';
        if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
          continue;
        }

        // Preskoči redove koji su samo brojevi bez imena tima
        if (!secondCell || secondCell.length === 0) continue;

        // Struktura kompleksne tabele: No | Team | G | W | L | P | PTS/OPTS | +/- | ...
        let rank = 0;
        let teamName = '';
        let gp = 0;    // G - Games (odigrane utakmice)
        let w = 0;     // W - Wins (pobede)
        let l = 0;     // L - Losses (porazi)
        let points = 0; // P - Points (bodovi)
        let pts = 0;    // PTS (iz PTS/OPTS)
        let opts = 0;   // OPTS (iz PTS/OPTS)
        let diff = 0;   // +/- (razlika)
        
        const noCell = cells[0]?.text || '';
        // Format "1." ili "1"
        const rankMatch = noCell.match(/^(\d+)\.?/);
        if (rankMatch) {
          rank = parseInt(rankMatch[1]);
        } else if (!isNaN(parseInt(noCell)) && parseInt(noCell) > 0) {
          rank = parseInt(noCell);
        } else {
          rank = index + 1;
        }

        // Kolona 1: Team (tim) - iz <a> taga unutar td
        // Proveri da li postoji link sa team_id atributom (glavna tabela)
        const teamCellHtml = cells[1]?.html || '';
        // Prvo pokušaj da pronađeš link sa team_id atributom
        const teamIdLinkMatch = teamCellHtml.match(/<a[^>]*team_id[^>]*>([\s\S]*?)<\/a>/i);
        if (teamIdLinkMatch) {
          teamName = teamIdLinkMatch[1]
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          // Fallback na običan link
          const teamLinkMatch = teamCellHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
          if (teamLinkMatch) {
            teamName = teamLinkMatch[1]
              .replace(/<[^>]*>/g, '')
              .replace(/&nbsp;/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            // Ako nema team_id, možda je ovo legend tabela - preskoči ako je prekratko
            if (teamName.length < 3) {
              continue; // Verovatno legend tabela
            }
          } else {
            teamName = secondCell;
          }
        }
        
        // Ako nema ime tima ili je prekratko, preskoči (verovatno legend)
        if (!teamName || teamName.length < 2) {
          continue;
        }

        // Kolona 2: G (Games - odigrane utakmice)
        const gCell = cells[2]?.text || '';
        gp = parseInt(gCell || '0') || 0;
        
        // Kolona 3: W (Wins - pobede)
        const wCell = cells[3]?.text || '';
        w = parseInt(wCell || '0') || 0;
        
        // Kolona 4: L (Losses - porazi)
        const lCell = cells[4]?.text || '';
        l = parseInt(lCell || '0') || 0;
        
        // Kolona 5: P (Points - bodovi)
        const pointsCell = cells[5]?.text || '';
        points = parseInt(pointsCell || '0') || 0;
        
        // Kolona 6: PTS/OPTS (Points/Opponent Points) - format "514/424" ili "514<span></span>/<span></span>424"
        if (cells.length > 6) {
          const ptsOptsCell = cells[6]?.text || '';
          // Ukloni sve HTML entitete i spanove, ostavi samo brojeve i /
          const ptsOptsClean = ptsOptsCell.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
          if (ptsOptsClean.includes('/')) {
            const parts = ptsOptsClean.split('/');
            pts = parseInt(parts[0]?.trim() || '0') || 0;
            opts = parseInt(parts[1]?.trim() || '0') || 0;
          }
        }
        
        // Kolona 7: +/- (razlika)
        if (cells.length > 7) {
          const diffCell = cells[7]?.text || '';
          // Može biti pozitivan ili negativan broj
          diff = parseInt(diffCell || '0') || 0;
        }

        // Dodaj samo ako ima ime tima i validne podatke
        if (teamName && teamName.length > 0 && rank > 0) {
          standings.push({
            rank,
            team: teamName.trim(),
            gp: gp,
            w,
            l,
            points, // P - Points (bodovi)
            pts,    // PTS (iz PTS/OPTS)
            opts,   // OPTS (iz PTS/OPTS)
            diff,   // +/- (razlika)
          });
        }
      }

      console.log(`Uspješno učitano ${standings.length} timova (fetch metoda)`);
      
      if (standings.length === 0) {
        // Ako fetch metoda ne može da pronađe podatke, verovatno je problem sa JavaScript renderovanjem
        throw new Error('Nijedan tim nije pronađen. Stranica verovatno koristi JavaScript za renderovanje tabele, što zahteva Puppeteer. U produkciji, proverite da li su instalirani puppeteer-core i @sparticuz/chromium paketi.');
      }

      return standings;
    } catch (err: any) {
      console.error('Greška pri scrapanju sa fetch metodom:', err);
      
      // Ako je greška vezana za tabelu, daj jasniju poruku
      if (err.message && err.message.includes('Tabela nije pronađena')) {
        throw new Error('Tabela nije pronađena na stranici. Stranica verovatno koristi JavaScript za renderovanje, što zahteva Puppeteer. U produkciji (Vercel), proverite da li su instalirani puppeteer-core i @sparticuz/chromium paketi.');
      }
      
      throw err;
    }
  }

  private parseRowsDirectly(html: string): WabaTeamData[] {
    const standings: WabaTeamData[] = [];
    const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P', '#', 'No', 'Rank', 'W/L', 'Points'];
    
    // Pokušaj da pronađeš tabelu na različite načine - prvo mbt-table
    let tableContent = '';
    let tableFound = false;
    
    // Pronađi sve tabele sa mbt-table klasom
    const allTableMatches = Array.from(html.matchAll(/<table[^>]*class="[^"]*mbt-table[^"]*"[^>]*>([\s\S]*?)<\/table>/gi));
    
    // Pronađi glavnu tabelu sa standings podacima (ona koja ima linkove sa team_id atributom)
    for (const tableMatch of allTableMatches) {
      const fullTable = tableMatch[0];
      const tableHtml = tableMatch[1];
      
      // Preskoči tabele koje su u legend div-u
      const beforeTable = html.substring(0, html.indexOf(fullTable));
      const legendMatch = beforeTable.match(/<div[^>]*(?:id="[^"]*legend[^"]*"|class="[^"]*mbt-subcontent[^"]*")[^>]*>[\s\S]*$/i);
      if (legendMatch) {
        console.log('parseRowsDirectly: Preskočena legend tabela');
        continue;
      }
      
      // Proveri da li tabela ima linkove sa team_id atributom
      const hasTeamLinks = /<a[^>]*team_id[^>]*>/i.test(fullTable);
      if (hasTeamLinks) {
        tableContent = tableHtml;
        tableFound = true;
        console.log('parseRowsDirectly: Pronađena glavna tabela sa team_id linkovima');
        break;
      }
    }
    
    // Ako nije pronađena sa team_id linkovima, uzmi prvu tabelu koja nije u legend div-u
    if (!tableFound) {
      for (const tableMatch of allTableMatches) {
        const fullTable = tableMatch[0];
        const tableHtml = tableMatch[1];
        const beforeTable = html.substring(0, html.indexOf(fullTable));
        const legendMatch = beforeTable.match(/<div[^>]*(?:id="[^"]*legend[^"]*"|class="[^"]*mbt-subcontent[^"]*")[^>]*>[\s\S]*$/i);
        if (!legendMatch) {
          tableContent = tableHtml;
          tableFound = true;
          console.log('parseRowsDirectly: Pronađena tabela (fallback)');
          break;
        }
      }
    }
    
    // Fallback na prvu mbt-table
    if (!tableFound && allTableMatches.length > 0) {
      tableContent = allTableMatches[0][1];
      tableFound = true;
      console.log('parseRowsDirectly: Pronađena prva mbt-table (fallback)');
    }
    
    // Ako i dalje nije pronađena, probaj sa tbody ili običnom tabelom
    if (!tableFound) {
      const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
      if (tbodyMatch) {
        tableContent = tbodyMatch[1];
        tableFound = true;
        console.log('parseRowsDirectly: Pronađen tbody');
      } else {
        const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
        if (tableMatch) {
          tableContent = tableMatch[1];
          tableFound = true;
          console.log('parseRowsDirectly: Pronađena obična tabela');
        }
      }
    }
    
    if (!tableFound) {
      console.error('parseRowsDirectly: Tabela nije pronađena u HTML-u');
      // Debug: loguj mali deo HTML-a
      const htmlSnippet = html.substring(0, 2000);
      console.error('parseRowsDirectly: HTML snippet:', htmlSnippet);
      return [];
    }
    
    // Pronađi sve tr redove
    const trMatches = Array.from(tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
    
    for (let index = 0; index < trMatches.length; index++) {
      const trMatch = trMatches[index];
      const row = trMatch[0]; // Uzmi ceo red sa atributima
      const rowContent = trMatch[1];
      
      // Preskoči header redove (mbt-subheader ili th elementi)
      if (row.includes('class="') && (row.includes('mbt-subheader') || row.includes('mbt-header'))) {
        continue;
      }
      
      // Pronađi sve td ćelije u redu
      const tdMatches = Array.from(rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
      
      // Kompleksna struktura: No | Team | G | W | L | P | PTS/OPTS | +/- | ...
      // Minimum 6 kolona za kompleksnu tabelu
      if (tdMatches.length < 6) continue;
      
      // Parsiraj ćelije
      const cells: Array<{ text: string; html: string }> = [];
      
      for (const tdMatch of tdMatches) {
        const cellHtml = tdMatch[1];
        let text = cellHtml
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '') // Ukloni script tagove
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
        
        cells.push({ text, html: cellHtml });
      }

      // Preskoči header redove
      const firstCell = cells[0]?.text || '';
      const secondCell = cells[1]?.text || '';
      if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
        continue;
      }

      // Preskoči redove koji su samo brojevi bez imena tima
      if (!secondCell || secondCell.length === 0) continue;

      // Struktura kompleksne tabele: No | Team | G | W | L | P | PTS/OPTS | +/- | ...
      let rank = 0;
      let teamName = '';
      let gp = 0;    // G - Games (odigrane utakmice)
      let w = 0;     // W - Wins (pobede)
      let l = 0;     // L - Losses (porazi)
      let points = 0; // P - Points (bodovi)
      let pts = 0;    // PTS (iz PTS/OPTS)
      let opts = 0;   // OPTS (iz PTS/OPTS)
      let diff = 0;   // +/- (razlika)
      
      const noCell = cells[0]?.text || '';
      // Format "1." ili "1"
      const rankMatch = noCell.match(/^(\d+)\.?/);
      if (rankMatch) {
        rank = parseInt(rankMatch[1]);
      } else if (!isNaN(parseInt(noCell)) && parseInt(noCell) > 0) {
        rank = parseInt(noCell);
      } else {
        rank = index + 1;
      }

      // Kolona 1: Team (tim) - iz <a> taga unutar td
      // Proveri da li postoji link sa team_id atributom (glavna tabela)
      const teamCellHtml = cells[1]?.html || '';
      // Prvo pokušaj da pronađeš link sa team_id atributom
      const teamIdLinkMatch = teamCellHtml.match(/<a[^>]*team_id[^>]*>([\s\S]*?)<\/a>/i);
      if (teamIdLinkMatch) {
        teamName = teamIdLinkMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        // Fallback na običan link
        const teamLinkMatch = teamCellHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
        if (teamLinkMatch) {
          teamName = teamLinkMatch[1]
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          // Ako nema team_id, možda je ovo legend tabela - preskoči ako je prekratko
          if (teamName.length < 3) {
            continue; // Verovatno legend tabela
          }
        } else {
          teamName = secondCell;
        }
      }
      
      // Ako nema ime tima ili je prekratko, preskoči (verovatno legend)
      if (!teamName || teamName.length < 2) {
        continue;
      }

      // Kolona 2: G (Games - odigrane utakmice)
      const gCell = cells[2]?.text || '';
      gp = parseInt(gCell || '0') || 0;
      
      // Kolona 3: W (Wins - pobede)
      const wCell = cells[3]?.text || '';
      w = parseInt(wCell || '0') || 0;
      
      // Kolona 4: L (Losses - porazi)
      const lCell = cells[4]?.text || '';
      l = parseInt(lCell || '0') || 0;
      
      // Kolona 5: P (Points - bodovi)
      const pointsCell = cells[5]?.text || '';
      points = parseInt(pointsCell || '0') || 0;
      
      // Kolona 6: PTS/OPTS (Points/Opponent Points) - format "514/424" ili "514<span></span>/<span></span>424"
      if (cells.length > 6) {
        const ptsOptsCell = cells[6]?.text || '';
        // Ukloni sve HTML entitete i spanove, ostavi samo brojeve i /
        const ptsOptsClean = ptsOptsCell.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
        if (ptsOptsClean.includes('/')) {
          const parts = ptsOptsClean.split('/');
          pts = parseInt(parts[0]?.trim() || '0') || 0;
          opts = parseInt(parts[1]?.trim() || '0') || 0;
        }
      }
      
      // Kolona 7: +/- (razlika)
      if (cells.length > 7) {
        const diffCell = cells[7]?.text || '';
        // Može biti pozitivan ili negativan broj
        diff = parseInt(diffCell || '0') || 0;
      }

      // Dodaj samo ako ima ime tima i validne podatke
      if (teamName && teamName.length > 0 && rank > 0) {
        standings.push({
          rank,
          team: teamName.trim(),
          gp: gp,
          w,
          l,
          points, // P - Points (bodovi)
          pts,    // PTS (iz PTS/OPTS)
          opts,   // OPTS (iz PTS/OPTS)
          diff,   // +/- (razlika)
        });
      }
    }

    console.log(`parseRowsDirectly: Parsirano ${standings.length} timova`);
    if (standings.length === 0 && trMatches.length > 0) {
      console.warn('parseRowsDirectly: Pronađeni redovi ali nijedan tim nije parsiran. Možda struktura nije očekivana.');
      // Debug: loguj prvi red
      if (trMatches.length > 0) {
        const firstRow = trMatches[0][1]?.substring(0, 500);
        console.warn('parseRowsDirectly: Prvi red:', firstRow);
      }
    }

    return standings;
  }

  private async scrapeWithPlaywright(): Promise<WabaTeamData[]> {
    let page = null;
    let context = null;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        if (!this.browser) {
          // Pokušaj da reinicijalizujemo browser
          if (retryCount < maxRetries) {
            console.log(`Browser nije inicijalizovan, pokušavam reinicijalizaciju (pokušaj ${retryCount + 1}/${maxRetries})...`);
            await this.initialize();
            if (!this.browser) {
              throw new Error('Browser nije uspeo da se inicijalizuje');
            }
            // Sačekaj malo da se browser potpuno inicijalizuje
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            throw new Error('Browser nije inicijalizovan i reinicijalizacija nije uspela');
          }
        }

        // Koristi browser context umesto direktnog newPage() za bolju kontrolu
        try {
          const contexts = this.browser.contexts ? this.browser.contexts() : [];
          if (contexts.length === 0) {
            // Kreiraj novi context
            context = await this.browser.newContext({
              viewport: { width: 1920, height: 1080 },
            });
            console.log('✓ Browser context kreiran');
          } else {
            // Koristi postojeći context
            context = contexts[0];
            console.log('✓ Koristim postojeći browser context');
          }
        } catch (ctxErr: any) {
          const errorMsg = ctxErr?.message || String(ctxErr);
          if (errorMsg.includes('closed') || errorMsg.includes('Target closed')) {
            throw new Error('Browser se zatvorio pre kreiranja context-a');
          }
          throw ctxErr;
        }

        // Sačekaj malo da se context potpuno inicijalizuje
        await new Promise(resolve => setTimeout(resolve, 1000));

        page = await context.newPage();
        
        // Sačekaj malo da se page potpuno inicijalizuje
        await new Promise(resolve => setTimeout(resolve, 500));
        
        await page.setViewportSize({ width: 1920, height: 1080 });
        
        // Postavi timeout za page operacije
        page.setDefaultTimeout(CONFIG.TIMEOUT);
        page.setDefaultNavigationTimeout(CONFIG.TIMEOUT);
        
        console.log(`Učitavanje stranice sa Playwright: ${CONFIG.URL}`);
        
        // Proveri da li je page još uvek otvoren pre navigacije
        if (page.isClosed && page.isClosed()) {
          throw new Error('Page se zatvorio odmah nakon kreiranja');
        }
        
        // Proveri da li je page još uvek otvoren pre navigacije
        if (page.isClosed && page.isClosed()) {
          throw new Error('Page se zatvorio pre navigacije');
        }
        
        // Proveri da li je context još uvek otvoren
        try {
          const contexts = this.browser.contexts ? this.browser.contexts() : [];
          if (contexts.length === 0 || !contexts.includes(context)) {
            throw new Error('Browser context se zatvorio pre navigacije');
          }
        } catch (checkErr: any) {
          if (checkErr.message.includes('zatvorio')) {
            throw checkErr;
          }
        }
        
        // Učitaj stranicu sa domcontentloaded (brže i pouzdanije)
        try {
          await page.goto(CONFIG.URL, { 
            waitUntil: 'domcontentloaded',
            timeout: CONFIG.TIMEOUT 
          });
          console.log('✓ Stranica učitana (domcontentloaded)');
          
          // Sačekaj malo da se JavaScript učita
          await new Promise(resolve => setTimeout(resolve, 3000));
        } catch (err: any) {
          // Ako domcontentloaded ne uspe, proveri da li je browser zatvoren
          const errorMsg = err?.message || String(err);
          console.warn('domcontentloaded neuspešan:', errorMsg);
          
          if (errorMsg.includes('closed') || errorMsg.includes('Target page') || errorMsg.includes('Target closed') || errorMsg.includes('Browser closed')) {
            // Proveri da li je browser još uvek otvoren
            try {
              const contexts = this.browser.contexts ? this.browser.contexts() : [];
              if (contexts.length === 0) {
                throw new Error('Browser se zatvorio tokom navigacije - nema aktivnih konteksta');
              }
            } catch (checkErr: any) {
              throw new Error('Browser se zatvorio tokom navigacije');
            }
          }
          
          // Ako nije browser closure, baci originalnu grešku
          throw err;
        }
        
        // Proveri da li je page još uvek otvoren nakon navigacije
        if (page.isClosed && page.isClosed()) {
          throw new Error('Page se zatvorio nakon navigacije');
        }

        // Čekaj da se tabela učita - nova struktura koristi mbt-table klasu
        let tableFound = false;
        try {
          // Pokušaj sa različitim selektorima sa kraćim timeout-om da ne blokiramo
          await page.waitForSelector('table.mbt-table tbody tr, table tbody tr', { timeout: 10000, state: 'visible' });
          console.log('✓ Tabela je pronađena');
          tableFound = true;
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          if (errorMsg.includes('closed') || errorMsg.includes('Target page') || errorMsg.includes('Target closed')) {
            throw new Error('Page se zatvorio tokom čekanja tabele');
          }
          
          console.warn('Tabela nije pronađena sa waitForSelector, pokušavam alternativne selektore...', errorMsg);
          
          // Pokušaj sa alternativnim selektorima
          try {
            await page.waitForSelector('table tr', { timeout: 8000, state: 'visible' });
            console.log('✓ Tabela je pronađena (alternativni selektor)');
            tableFound = true;
          } catch (err2: any) {
            const errorMsg2 = err2?.message || String(err2);
            if (errorMsg2.includes('closed') || errorMsg2.includes('Target page') || errorMsg2.includes('Target closed')) {
              throw new Error('Page se zatvorio tokom čekanja tabele');
            }
            console.warn('Alternativni selektor takođe neuspešan, nastavljam...', errorMsg2);
            // Nastavi dalje - možda je tabela već učitana
          }
        }
        
        // Proveri da li je page još uvek otvoren pre čekanja
        if (page.isClosed && page.isClosed()) {
          throw new Error('Page se zatvorio pre čekanja JavaScript-a');
        }
        
        // Sačekaj malo da se JavaScript potpuno izvrši (kraće čekanje)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Proveri ponovo da li je page još uvek otvoren
        if (page.isClosed && page.isClosed()) {
          throw new Error('Page se zatvorio pre evaluate');
        }

        // Izvuci podatke iz stranice
        // Koristimo try-catch unutar evaluate da bismo bolje rukovali greškama
        // Važno: evaluate mora da se završi pre nego što se browser zatvori
        let standings: WabaTeamData[];
        try {
          standings = await page.evaluate(() => {
          // Pronađi sve tabele sa mbt-table klasom
          const allTables = Array.from(document.querySelectorAll('table.mbt-table'));
          
          // Pronađi glavnu tabelu sa standings podacima (ona koja ima redove sa linkovima na timove)
          let table: HTMLTableElement | null = null;
          
          for (const t of allTables) {
            // Preskoči tabele koje su u legend div-u
            const parentDiv = t.closest('div');
            if (parentDiv && (parentDiv.id?.includes('legend') || parentDiv.classList.contains('mbt-subcontent'))) {
              continue;
            }
            
            // Proveri da li tabela ima redove sa linkovima na timove (team_id atribut)
            const hasTeamLinks = t.querySelectorAll('a[team_id]').length > 0;
            if (hasTeamLinks) {
              table = t as HTMLTableElement;
              break;
            }
          }
          
          // Ako nije pronađena sa team linkovima, uzmi prvu tabelu koja nije u legend div-u
          if (!table) {
            for (const t of allTables) {
              const parentDiv = t.closest('div');
              if (!parentDiv || (!parentDiv.id?.includes('legend') && !parentDiv.classList.contains('mbt-subcontent'))) {
                table = t as HTMLTableElement;
                break;
              }
            }
          }
          
          // Fallback na bilo koju tabelu
          if (!table) {
            table = document.querySelector('table.mbt-table') as HTMLTableElement || document.querySelector('table') as HTMLTableElement;
          }
          
          if (!table) return [];
          
          const rows = table.querySelectorAll('tbody tr');
          const data: WabaTeamData[] = [];
          
          const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P', 'No', 'W/L', 'Points', '#', 'Rank'];

          rows.forEach((row, index) => {
            // Preskoči header redove (th elementi ili redovi sa mbt-subheader klasom)
            if (row.classList.contains('mbt-subheader') || row.querySelector('th')) {
              return;
            }
            
            const cells = Array.from(row.querySelectorAll('td'));
            
            // Kompleksna struktura: No | Team | G | W | L | P | PTS/OPTS | +/- | ...
            // Minimum 6 kolona za kompleksnu tabelu
            if (cells.length < 6) return;
            
            // Preskoči header redove
            const firstCell = cells[0]?.textContent?.trim() || '';
            const secondCell = cells[1]?.textContent?.trim() || '';
            if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
              return;
            }
            
            // Preskoči redove koji su samo brojevi bez imena tima
            if (!secondCell || secondCell.length === 0) return;
            
            // Struktura kompleksne tabele: No | Team | G | W | L | P | PTS/OPTS | +/- | ...
            let rank = 0;
            let teamName = '';
            let gp = 0;    // G - Games (odigrane utakmice)
            let w = 0;     // W - Wins (pobede)
            let l = 0;     // L - Losses (porazi)
            let points = 0; // P - Points (bodovi)
            let pts = 0;    // PTS (iz PTS/OPTS)
            let opts = 0;   // OPTS (iz PTS/OPTS)
            let diff = 0;   // +/- (razlika)
            
            const noCell = cells[0]?.textContent?.trim() || '';
            // Format "1." ili "1"
            const rankMatch = noCell.match(/^(\d+)\.?/);
            if (rankMatch) {
              rank = parseInt(rankMatch[1]);
            } else if (!isNaN(parseInt(noCell)) && parseInt(noCell) > 0) {
              rank = parseInt(noCell);
            } else {
              rank = index + 1;
            }
            
            // Kolona 1: Team (tim) - iz <a> taga unutar td
            // Proveri da li postoji link sa team_id atributom (glavna tabela)
            const teamCell = cells[1];
            if (teamCell) {
              const teamLink = teamCell.querySelector('a[team_id]') || teamCell.querySelector('a');
              if (teamLink) {
                teamName = teamLink.textContent?.trim() || '';
                // Ako nema team_id, možda je ovo legend tabela - preskoči
                if (!teamLink.hasAttribute('team_id') && teamName.length < 3) {
                  return; // Verovatno legend tabela
                }
              } else {
                teamName = teamCell.textContent?.trim() || '';
              }
            }
            
            // Ako nema ime tima ili je prekratko, preskoči (verovatno legend)
            if (!teamName || teamName.length < 2) {
              return;
            }
            
            // Kolona 2: G (Games - odigrane utakmice)
            const gCell = cells[2]?.textContent?.trim() || '';
            gp = parseInt(gCell || '0') || 0;
            
            // Kolona 3: W (Wins - pobede)
            const wCell = cells[3]?.textContent?.trim() || '';
            w = parseInt(wCell || '0') || 0;
            
            // Kolona 4: L (Losses - porazi)
            const lCell = cells[4]?.textContent?.trim() || '';
            l = parseInt(lCell || '0') || 0;
            
            // Kolona 5: P (Points - bodovi)
            const pointsCell = cells[5]?.textContent?.trim() || '';
            points = parseInt(pointsCell || '0') || 0;
            
            // Kolona 6: PTS/OPTS (Points/Opponent Points) - format "514/424" ili "514<span></span>/<span></span>424"
            if (cells.length > 6) {
              const ptsOptsCell = cells[6]?.textContent?.trim() || '';
              // Ukloni sve HTML entitete i spanove, ostavi samo brojeve i /
              const ptsOptsClean = ptsOptsCell.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
              if (ptsOptsClean.includes('/')) {
                const parts = ptsOptsClean.split('/');
                pts = parseInt(parts[0]?.trim() || '0') || 0;
                opts = parseInt(parts[1]?.trim() || '0') || 0;
              }
            }
            
            // Kolona 7: +/- (razlika)
            if (cells.length > 7) {
              const diffCell = cells[7]?.textContent?.trim() || '';
              // Može biti pozitivan ili negativan broj
              diff = parseInt(diffCell || '0') || 0;
            }
              
            if (teamName && teamName.length > 0 && rank > 0) {
              data.push({
                rank,
                team: teamName.trim(),
                gp: gp,
                w,
                l,
                points, // P - Points (bodovi)
                pts,    // PTS (iz PTS/OPTS)
                opts,   // OPTS (iz PTS/OPTS)
                diff,   // +/- (razlika)
              });
            }
          });

          return data;
          });
        } catch (evalErr: any) {
          const errorMsg = evalErr?.message || String(evalErr);
          if (errorMsg.includes('closed') || errorMsg.includes('Target page') || errorMsg.includes('Target closed') || errorMsg.includes('Browser closed')) {
            throw new Error('Page ili browser se zatvorio tokom evaluate operacije');
          }
          throw evalErr;
        }

        console.log(`Uspješno učitano ${standings.length} timova (Playwright)`);
        
        if (standings.length === 0) {
          throw new Error('Nijedan tim nije pronađen');
        }

        // Uspešno završeno - zatvori page i vrati rezultat
        if (page) {
          try {
            if (!page.isClosed || !page.isClosed()) {
              await page.close();
            }
          } catch (closeErr: any) {
            console.warn('Greška pri zatvaranju page-a:', closeErr.message);
          }
        }
        
        // Ne zatvaraj context - možda će biti korišćen ponovo
        // Context će biti zatvoren kada se browser zatvori
        
        return standings;
        
      } catch (err: any) {
        console.error(`Greška pri scrapanju sa Playwright (pokušaj ${retryCount + 1}/${maxRetries + 1}):`, err.message);
        
        // Proveri da li je greška vezana za zatvoreni browser
        const isBrowserClosed = err.message && (
          err.message.includes('closed') || 
          err.message.includes('Target page') || 
          err.message.includes('Target closed') || 
          err.message.includes('Browser closed') ||
          err.message.includes('Browser se zatvorio')
        );
        
        if (isBrowserClosed && retryCount < maxRetries) {
          console.error('Browser se zatvorio, pokušavam reinicijalizaciju...');
          
          // Zatvori page ako postoji
          if (page) {
            try {
              if (!page.isClosed || !page.isClosed()) {
                await page.close();
              }
            } catch (closeErr: any) {
              // Ignoriši greške pri zatvaranju
            }
            page = null;
          }
          
          // Zatvori context ako postoji
          if (context) {
            try {
              await context.close();
            } catch (ctxCloseErr: any) {
              // Ignoriši greške pri zatvaranju context-a
            }
            context = null;
          }
          
          // Zatvori browser i reinicijalizuj
          try {
            await this.close();
            await new Promise(resolve => setTimeout(resolve, 1000)); // Sačekaj malo pre reinicijalizacije
            const reinitialized = await this.initialize();
            if (reinitialized && this.browser) {
              console.log('Browser reinicijalizovan, pokušavam ponovo...');
              retryCount++;
              continue; // Pokušaj ponovo
            }
          } catch (retryErr: any) {
            console.error('Reinicijalizacija neuspešna:', retryErr.message);
          }
        }
        
        // Ako nije browser closure ili smo iscrpili retry-e, baci grešku
        if (retryCount >= maxRetries || !isBrowserClosed) {
          console.error('Stack trace:', err.stack);
          throw err;
        }
        
        retryCount++;
      } finally {
        if (page) {
          try {
            if (!page.isClosed || !page.isClosed()) {
              await page.close();
            }
          } catch (err: any) {
            console.warn('Greška pri zatvaranju page-a:', err.message);
          }
        }
        // Ne zatvaraj context ovde - browser.close() će zatvoriti sve kontekste
        // Context će biti zatvoren kada se browser zatvori u close() metodi
      }
    }
    
    // Ako smo izašli iz while loop-a bez uspeha, fallback na fetch
    console.log('Svi pokušaji sa Playwright neuspešni, pokušavam sa fetch metodom...');
    return this.scrapeWithFetch();
  }

  async close() {
    if (this.browser) {
      try {
        // Za Puppeteer, zatvori sve stranice pre zatvaranja browser-a
        if (this.usePuppeteer && !this.usePlaywright) {
          try {
            const pages = this.browser.pages ? await this.browser.pages() : [];
            if (pages.length > 0) {
              console.log(`Zatvaram ${pages.length} otvorenih stranica pre zatvaranja browser-a...`);
              await Promise.all(pages.map((p: any) => {
                try {
                  if (!p.isClosed || !p.isClosed()) {
                    return p.close();
                  }
                } catch (e) {
                  // Ignoriši greške pri zatvaranju stranica
                }
              }));
            }
          } catch (pagesErr: any) {
            console.warn('Greška pri zatvaranju stranica:', pagesErr.message);
          }
        }
        
        // Zatvori browser (Playwright automatski zatvara sve kontekste i stranice)
        await this.browser.close();
        this.browser = null;
        console.log('Browser uspešno zatvoren');
      } catch (err: any) {
        // Ako je browser već zatvoren, ignoriši grešku
        if (err.message && (err.message.includes('closed') || err.message.includes('Target closed') || err.message.includes('Browser closed'))) {
          console.log('Browser je već zatvoren');
        } else {
          console.warn('Greška pri zatvaranju browser-a:', err.message);
        }
        this.browser = null;
      }
    }
  }
}

