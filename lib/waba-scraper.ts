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
  URL: 'https://waba-league.com/season/standings/?leagueId=31913',
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
      scrapingBeeApiKey: !!process.env.SCRAPINGBEE_API_KEY,
    });
    
    // Ako postoji ScrapingBee API key, to je OK - koristićemo ga umesto browser automation
    if (process.env.SCRAPINGBEE_API_KEY) {
      console.log('ℹ ScrapingBee API key je dostupan - koristiće se umesto browser automation');
      return false; // Vraćamo false ali će ScrapingBee biti korišćen u scrapeStandings
    }
    
    this.usePuppeteer = false;
    return false;
  }

  async scrapeStandings(): Promise<WabaTeamData[]> {
    // Proveri prvo da li postoji ScrapingBee API key - koristi ga kao primarni način
    // ScrapingBee radi i u development i u production okruženju
    const scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY?.trim();
    
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
        
        // Ako je greška vezana za invalid API key, loguj upozorenje ali nastavi sa fallback
        if (sbError.message && sbError.message.includes('Invalid API key')) {
          console.warn('⚠ ScrapingBee API key nije validan. Koristim browser automation fallback...');
          console.warn('Za produkciju, proverite da li je ScrapingBee API key pravilno postavljen u Vercel Environment Variables.');
          // Ne baci grešku, nastavi sa browser automation fallback
        } else {
          console.warn('Pokušavam sa browser automation fallback...');
        }
        // Nastavi sa browser automation fallback
      }
    } else {
      console.log('ScrapingBee API key nije dostupan, koristim browser automation ili fetch');
    }

    // Ako Playwright je dostupan, koristi ga
    if (this.usePlaywright && this.browser) {
      return this.scrapeWithPlaywright();
    }

    // Ako Puppeteer nije dostupan ili nije uspeo da se inicijalizuje, koristi fetch
    if (!this.usePuppeteer || !this.browser) {
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
      await page.waitForSelector('table.mbt-table tbody tr, table tbody tr', { timeout: 10000 }).catch(() => {
        console.log('Tabela nije pronađena odmah, nastavljam...');
      });

      // Pauziraj 2 sekunde da se svi podaci učitaju (waitForTimeout je uklonjen u novijim verzijama)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Izvuci podatke iz stranice
      const standings = await page.evaluate(() => {
        // Pokušaj prvo sa mbt-table, pa fallback na običnu tabelu
        const table = document.querySelector('table.mbt-table') || document.querySelector('table');
        if (!table) return [];
        
        const rows = table.querySelectorAll('tbody tr');
        const data: WabaTeamData[] = [];
        
        // Lista header redova koje treba preskočiti
        const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P', 'No', 'W/L', 'Points'];

        rows.forEach((row, index) => {
          // Preskoči header redove (th elementi ili redovi sa mbt-subheader klasom)
          if (row.classList.contains('mbt-subheader') || row.querySelector('th')) {
            return;
          }
          
          const cells = Array.from(row.querySelectorAll('td'));
          
          // Nova struktura: No | Team | W/L | Points (minimum 4 kolone)
          if (cells.length < 4) return;
          
          // Preskoči header redove
          const firstCell = cells[0]?.textContent?.trim() || '';
          const secondCell = cells[1]?.textContent?.trim() || '';
          if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
            return;
          }
          
          // Preskoči redove koji su samo brojevi bez imena tima
          if (!secondCell || secondCell.length === 0) return;
          
          // Struktura tabele: No | Team | W/L | Points
          let rank = 0;
          let teamName = '';
          let w = 0;
          let l = 0;
          let points = 0; // Points (bodovi)
          let pts = 0;    // PTS (iz PTS/OPTS) - nema u novoj strukturi
          let opts = 0;   // OPTS (iz PTS/OPTS) - nema u novoj strukturi
          let diff = 0;   // +/- (razlika) - nema u novoj strukturi
          
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
          
          // Kolona 1: Team (tim) - iz <a> taga unutar td.team_name
          const teamCell = cells[1];
          if (teamCell) {
            const teamLink = teamCell.querySelector('a');
            if (teamLink) {
              teamName = teamLink.textContent?.trim() || '';
            } else {
              teamName = teamCell.textContent?.trim() || '';
            }
          }
          
          // Kolona 2: W/L (format: "6/0" ili "6<span></span>/<span></span>0")
          const wlCell = cells[2]?.textContent?.trim() || '';
          // Ukloni sve HTML entitete i spanove, ostavi samo brojeve i /
          const wlClean = wlCell.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
          if (wlClean.includes('/')) {
            const parts = wlClean.split('/');
            w = parseInt(parts[0]?.trim() || '0') || 0;
            l = parseInt(parts[1]?.trim() || '0') || 0;
          }
          
          // Kolona 3: Points (bodovi)
          const pointsCell = cells[3]?.textContent?.trim() || '';
          points = parseInt(pointsCell || '0') || 0;
          
          // Izračunaj gp (odigrane utakmice) kao w + l
          const gp = w + l;
            
          // Dodaj samo ako ima ime tima i validne podatke
          if (teamName && teamName.length > 0 && rank > 0) {
            const team: WabaTeamData = {
              rank,
              team: teamName.trim(),
              gp: gp,
              w,
              l,
              points, // Points (bodovi)
              pts,    // PTS - nema u novoj strukturi, ostaje 0
              opts,   // OPTS - nema u novoj strukturi, ostaje 0
              diff,   // +/- - nema u novoj strukturi, ostaje 0
            };
            data.push(team);
          }
        });

        return data;
      });

      console.log(`Uspješno učitano ${standings.length} timova`);
      
      if (standings.length === 0) {
        throw new Error('Nijedan tim nije pronađen');
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
      const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${encodeURIComponent(scrapingBeeApiKey)}&url=${encodeURIComponent(CONFIG.URL)}&render_js=true&wait=5000`;
      
      console.log('Pozivam ScrapingBee API...');
      const response = await fetch(scrapingBeeUrl, {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
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
      
      const standings = this.parseRowsDirectly(html);
      
      if (standings.length === 0) {
        // Pokušaj sa različitim parsiranjem
        console.warn('Prvo parsiranje nije pronašlo podatke, pokušavam alternativno...');
        // Možda treba da sačekamo malo duže ili koristimo drugačije parametre
        throw new Error('ScrapingBee vratio HTML ali tabela nije pronađena');
      }

      console.log(`✓ Uspešno učitano ${standings.length} timova (ScrapingBee)`);
      return standings;
    } catch (error: any) {
      console.error('✗ Greška pri scrapanju sa ScrapingBee:', error.message);
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
      const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P', 'No', 'W/L', 'Points'];

      for (let index = 0; index < rowMatches.length; index++) {
        const rowMatch = rowMatches[index];
        const rowFull = rowMatch[0]; // Ceo red sa atributima
        const row = rowMatch[1];
        
        // Preskoči header redove (mbt-subheader ili th elementi)
        if (rowFull.includes('class="') && (rowFull.includes('mbt-subheader') || rowFull.includes('mbt-header'))) {
          continue;
        }
        
        const cellMatches = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
        
        // Nova struktura: No | Team | W/L | Points (minimum 4 kolone)
        if (cellMatches.length < 4) continue;
        
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

        // Struktura tabele: No | Team | W/L | Points
        let rank = 0;
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

        // Kolona 1: Team (tim) - iz <a> taga unutar td.team_name
        let teamName = '';
        const teamCellHtml = cells[1]?.html || '';
        const teamLinkMatch = teamCellHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
        if (teamLinkMatch) {
          teamName = teamLinkMatch[1]
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        } else {
          teamName = secondCell;
        }

        // Kolona 2: W/L (format: "6/0" ili "6<span></span>/<span></span>0")
        let w = 0;
        let l = 0;
        const wlCell = cells[2]?.text || '';
        // Ukloni sve HTML entitete i spanove, ostavi samo brojeve i /
        const wlClean = wlCell.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
        if (wlClean.includes('/')) {
          const parts = wlClean.split('/');
          w = parseInt(parts[0]?.trim() || '0') || 0;
          l = parseInt(parts[1]?.trim() || '0') || 0;
        }

        // Kolona 3: Points (bodovi)
        const pointsCell = cells[3]?.text || '';
        const points = parseInt(pointsCell || '0') || 0;

        // Izračunaj gp (odigrane utakmice) kao w + l
        const gp = w + l;

        // Dodaj samo ako ima ime tima i validne podatke
        if (teamName && teamName.length > 0 && rank > 0) {
          standings.push({
            rank,
            team: teamName.trim(),
            gp: gp,
            w,
            l,
            points,
            pts: 0,    // PTS - nema u novoj strukturi
            opts: 0,   // OPTS - nema u novoj strukturi
            diff: 0,   // +/- - nema u novoj strukturi
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
    let tableContent = html;
    
    // Pokušaj da pronađeš mbt-table
    const mbtTableMatch = html.match(/<table[^>]*class="[^"]*mbt-table[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
    if (mbtTableMatch) {
      tableContent = mbtTableMatch[1];
    } else {
      // Pokušaj da pronađeš tbody
      const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
      if (tbodyMatch) {
        tableContent = tbodyMatch[1];
      } else {
        // Pokušaj da pronađeš tabelu
        const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
        if (tableMatch) {
          tableContent = tableMatch[1];
        }
      }
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
      
      // Nova struktura: No | Team | W/L | Points (minimum 4 kolone)
      if (tdMatches.length < 4) continue;
      
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

      // Struktura tabele: No | Team | W/L | Points
      let rank = 0;
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

      // Kolona 1: Team (tim) - iz <a> taga unutar td.team_name
      let teamName = '';
      const teamCellHtml = cells[1]?.html || '';
      const teamLinkMatch = teamCellHtml.match(/<a[^>]*>([\s\S]*?)<\/a>/i);
      if (teamLinkMatch) {
        teamName = teamLinkMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      } else {
        teamName = secondCell;
      }

      // Kolona 2: W/L (format: "6/0" ili "6<span></span>/<span></span>0")
      let w = 0;
      let l = 0;
      const wlCell = cells[2]?.text || '';
      // Ukloni sve HTML entitete i spanove, ostavi samo brojeve i /
      const wlClean = wlCell.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
      if (wlClean.includes('/')) {
        const parts = wlClean.split('/');
        w = parseInt(parts[0]?.trim() || '0') || 0;
        l = parseInt(parts[1]?.trim() || '0') || 0;
      }

      // Kolona 3: Points (bodovi)
      const pointsCell = cells[3]?.text || '';
      const points = parseInt(pointsCell || '0') || 0;

      // Izračunaj gp (odigrane utakmice) kao w + l
      const gp = w + l;

      // Dodaj samo ako ima ime tima i validne podatke
      if (teamName && teamName.length > 0 && rank > 0) {
        standings.push({
          rank,
          team: teamName.trim(),
          gp: gp,
          w,
          l,
          points,
          pts: 0,    // PTS - nema u novoj strukturi
          opts: 0,   // OPTS - nema u novoj strukturi
          diff: 0,   // +/- - nema u novoj strukturi
        });
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
          // Pokušaj prvo sa mbt-table, pa fallback na običnu tabelu
          const table = document.querySelector('table.mbt-table') || document.querySelector('table');
          if (!table) return [];
          
          const rows = table.querySelectorAll('tbody tr');
          const data: WabaTeamData[] = [];
          
          const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P', 'No', 'W/L', 'Points'];

          rows.forEach((row, index) => {
            // Preskoči header redove (th elementi ili redovi sa mbt-subheader klasom)
            if (row.classList.contains('mbt-subheader') || row.querySelector('th')) {
              return;
            }
            
            const cells = Array.from(row.querySelectorAll('td'));
            
            // Nova struktura: No | Team | W/L | Points (minimum 4 kolone)
            if (cells.length < 4) return;
            
            // Preskoči header redove
            const firstCell = cells[0]?.textContent?.trim() || '';
            const secondCell = cells[1]?.textContent?.trim() || '';
            if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
              return;
            }
            
            // Preskoči redove koji su samo brojevi bez imena tima
            if (!secondCell || secondCell.length === 0) return;
            
            // Struktura tabele: No | Team | W/L | Points
            let rank = 0;
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
            
            // Kolona 1: Team (tim) - iz <a> taga unutar td.team_name
            let teamName = '';
            const teamCell = cells[1];
            if (teamCell) {
              const teamLink = teamCell.querySelector('a');
              if (teamLink) {
                teamName = teamLink.textContent?.trim() || '';
              } else {
                teamName = teamCell.textContent?.trim() || '';
              }
            }
            
            // Kolona 2: W/L (format: "6/0" ili "6<span></span>/<span></span>0")
            let w = 0;
            let l = 0;
            const wlCell = cells[2]?.textContent?.trim() || '';
            // Ukloni sve HTML entitete i spanove, ostavi samo brojeve i /
            const wlClean = wlCell.replace(/<[^>]*>/g, '').replace(/\s+/g, '').trim();
            if (wlClean.includes('/')) {
              const parts = wlClean.split('/');
              w = parseInt(parts[0]?.trim() || '0') || 0;
              l = parseInt(parts[1]?.trim() || '0') || 0;
            }
            
            // Kolona 3: Points (bodovi)
            const pointsCell = cells[3]?.textContent?.trim() || '';
            const points = parseInt(pointsCell || '0') || 0;
            
            // Izračunaj gp (odigrane utakmice) kao w + l
            const gp = w + l;
              
            if (teamName && teamName.length > 0 && rank > 0) {
              data.push({
                rank,
                team: teamName.trim(),
                gp: gp,
                w,
                l,
                points,
                pts: 0,    // PTS - nema u novoj strukturi
                opts: 0,   // OPTS - nema u novoj strukturi
                diff: 0,   // +/- - nema u novoj strukturi
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

