let puppeteer: any = null;
let chromium: any = null;
let playwright: any = null;

// Pokušaj da učitamo različite opcije za browser automation
try {
  // Prvo pokušaj sa puppeteer-core i @sparticuz/chromium (za Vercel/serverless)
  try {
    puppeteer = require('puppeteer-core');
    chromium = require('@sparticuz/chromium');
    console.log('Koristim puppeteer-core sa @sparticuz/chromium (serverless)');
  } catch (e) {
    // Ako to ne radi, pokušaj sa običnim puppeteer
    try {
      puppeteer = require('puppeteer');
      console.log('Koristim obični puppeteer');
    } catch (e2) {
      // Ako ni to ne radi, pokušaj sa Playwright
      try {
        playwright = require('playwright');
        console.log('Koristim Playwright');
      } catch (e3) {
        console.log('Nijedan browser automation tool nije dostupan');
      }
    }
  }
} catch (e) {
  console.log('Browser automation nije dostupan, koristićemo fetch metodu');
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
    
    // Za Vercel/produkciju, prioritizuj Puppeteer sa @sparticuz/chromium
    // Za lokalno okruženje, možemo koristiti bilo koji
    if (isVercel || (isProduction && chromium)) {
      // Pokušaj prvo sa Puppeteer + @sparticuz/chromium (najbolje za Vercel)
      if (puppeteer && chromium) {
        try {
          console.log('Pokušavam inicijalizaciju Puppeteer sa @sparticuz/chromium za Vercel...');
          
          // Konfiguriši Chromium za serverless okruženje
          // Napomena: setGraphicsMode() je uklonjen u novijim verzijama @sparticuz/chromium
          
          const executablePath = await chromium.executablePath();
          console.log('Chromium executable path:', executablePath ? 'OK' : 'MISSING');
          
          this.browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: executablePath,
            headless: chromium.headless,
          });
          
          this.usePuppeteer = true;
          console.log('✓ Puppeteer uspešno inicijalizovan sa @sparticuz/chromium');
          return true;
        } catch (err: any) {
          console.error('✗ Greška pri inicijalizaciji Puppeteer sa @sparticuz/chromium:', err.message);
          console.error('Stack trace:', err.stack);
          // Ne vraćaj false još, probaj Playwright
        }
      }
    } else {
      // Za lokalno okruženje, probaj obični Puppeteer prvo
      if (puppeteer) {
        try {
          if (chromium) {
            // Koristi puppeteer-core sa @sparticuz/chromium
            // Napomena: setGraphicsMode() je uklonjen u novijim verzijama @sparticuz/chromium
            const executablePath = await chromium.executablePath();
            
            this.browser = await puppeteer.launch({
              args: chromium.args,
              defaultViewport: chromium.defaultViewport,
              executablePath: executablePath,
              headless: chromium.headless,
            });
          } else {
            // Koristi obični Puppeteer (za lokalno okruženje)
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

    // Fallback: Pokušaj sa Playwright (može raditi u nekim okruženjima)
    if (playwright) {
      try {
        console.log('Pokušavam inicijalizaciju Playwright...');
        this.browser = await playwright.chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        });
        this.usePlaywright = true;
        console.log('✓ Playwright uspešno inicijalizovan');
        return true;
      } catch (err: any) {
        console.warn('✗ Greška pri inicijalizaciji Playwright:', err.message);
        console.warn('Stack trace:', err.stack);
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
    });
    
    this.usePuppeteer = false;
    return false;
  }

  async scrapeStandings(): Promise<WabaTeamData[]> {
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

      // Čekaj da se tabela učita
      await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => {
        console.log('Tabela nije pronađena odmah, nastavljam...');
      });

      // Pauziraj 2 sekunde da se svi podaci učitaju (waitForTimeout je uklonjen u novijim verzijama)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Izvuci podatke iz stranice
      const standings = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        const data: WabaTeamData[] = [];
        
        // Lista header redova koje treba preskočiti
        const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P'];

        rows.forEach((row, index) => {
          const cells = Array.from(row.querySelectorAll('td')).map(c => c?.innerText?.trim() || '');
          
          // Preskoči prazne redove ili redove sa manje od 5 kolona
          if (cells.length < 5) return;
          
          // Preskoči header redove
          const firstCell = cells[0] || '';
          const secondCell = cells[1] || '';
          if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
            return;
          }
          
          // Preskoči redove koji su samo brojevi bez imena tima
          if (!secondCell || secondCell.length === 0) return;
          
          // Struktura tabele: No | Team | G | W | L | P | PTS/OPTS | +/-
          let rank = 0;
            let teamName = '';
            let gp = 0;
            let w = 0;
            let l = 0;
          let points = 0; // P (bodovi)
          let pts = 0;    // PTS (iz PTS/OPTS)
          let opts = 0;   // OPTS (iz PTS/OPTS)
            let diff = 0;
            
            // Kolona 0: No (pozicija)
            const noCell = cells[0] || '';
            if (!isNaN(parseInt(noCell)) && parseInt(noCell) > 0) {
              rank = parseInt(noCell);
          } else {
            rank = index + 1;
            }
            
            // Kolona 1: Team (tim)
            teamName = cells[1] || '';
            
          // Kolona 2: G (odigrano)
          gp = parseInt(cells[2] || '0') || 0;
          
            // Kolona 3: W (pobede)
            w = parseInt(cells[3] || '0') || 0;
            
            // Kolona 4: L (porazi)
            l = parseInt(cells[4] || '0') || 0;
            
            // Kolona 5: P (bodovi)
          points = parseInt(cells[5] || '0') || 0;
            
          // Kolona 6: PTS/OPTS (format: "100/80" ili slično)
          const ptsOptsCell = cells[6] || '';
          if (ptsOptsCell.includes('/')) {
            const parts = ptsOptsCell.split('/');
            pts = parseInt(parts[0]?.trim() || '0') || 0;
            opts = parseInt(parts[1]?.trim() || '0') || 0;
          }
          
          // Kolona 7: +/- (razlika)
          const diffCell = cells[7] || '';
          // Ukloni + ako postoji
          const diffValue = diffCell.replace(/\+/g, '').trim();
          diff = parseInt(diffValue || '0') || 0;
            
          // Dodaj samo ako ima ime tima i validne podatke
          if (teamName && teamName.length > 0 && rank > 0) {
              const team: WabaTeamData = {
                rank,
                team: teamName.trim(),
              gp: gp || (w + l), // Koristi G ako postoji, inače W + L
                w,
                l,
              points, // P (bodovi)
              pts,    // PTS (iz PTS/OPTS)
              opts,   // OPTS (iz PTS/OPTS)
              diff,
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

  private async scrapeWithFetch(): Promise<WabaTeamData[]> {
    try {
      console.log('Koristim fetch metodu za scraping...');
      
      // Pokušaj prvo sa ScrapingBee API ako je dostupan (za produkciju)
      const scrapingBeeApiKey = process.env.SCRAPINGBEE_API_KEY;
      if (scrapingBeeApiKey) {
        try {
          console.log('Pokušavam sa ScrapingBee API...');
          const scrapingBeeUrl = `https://app.scrapingbee.com/api/v1/?api_key=${scrapingBeeApiKey}&url=${encodeURIComponent(CONFIG.URL)}&render_js=true&wait=3000`;
          const response = await fetch(scrapingBeeUrl);
          
          if (response.ok) {
            const html = await response.text();
            const standings = this.parseRowsDirectly(html);
            if (standings.length > 0) {
              console.log(`Uspješno učitano ${standings.length} timova (ScrapingBee)`);
              return standings;
            }
          }
        } catch (sbError) {
          console.warn('ScrapingBee API neuspešan, pokušavam sa običnim fetch...', sbError);
        }
      }
      
      // Pokušaj sa običnim fetch-om
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

      // Pokušaj različite selektore za tabelu
      let tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
      
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
      const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P'];

      for (let index = 0; index < rowMatches.length; index++) {
        const rowMatch = rowMatches[index];
        const row = rowMatch[1];
        const cellMatches = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
        const cells: string[] = [];
        
        for (const cellMatch of cellMatches) {
          const text = cellMatch[1]
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          cells.push(text);
        }

        if (cells.length < 5) continue;
        
        // Preskoči header redove
        const firstCell = cells[0] || '';
        const secondCell = cells[1] || '';
        if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
          continue;
        }

        // Preskoči redove koji su samo brojevi bez imena tima
        if (!secondCell || secondCell.length === 0) continue;

        // Struktura tabele: No | Team | G | W | L | P | PTS/OPTS | +/-
        let rank = 0;
        const noCell = cells[0] || '';
        if (!isNaN(parseInt(noCell)) && parseInt(noCell) > 0) {
          rank = parseInt(noCell);
        } else {
          rank = index + 1;
        }

        const teamName = cells[1] || '';
        const gp = parseInt(cells[2] || '0') || 0;
        const w = parseInt(cells[3] || '0') || 0;
        const l = parseInt(cells[4] || '0') || 0;
        const points = parseInt(cells[5] || '0') || 0;

        // PTS/OPTS (format: "100/80" ili slično)
        let pts = 0;
        let opts = 0;
        const ptsOptsCell = cells[6] || '';
        if (ptsOptsCell.includes('/')) {
          const parts = ptsOptsCell.split('/');
          pts = parseInt(parts[0]?.trim() || '0') || 0;
          opts = parseInt(parts[1]?.trim() || '0') || 0;
        }

        // +/- (razlika)
        const diffCell = cells[7] || '';
        const diffValue = diffCell.replace(/\+/g, '').trim();
        const diff = parseInt(diffValue || '0') || 0;

        // Dodaj samo ako ima ime tima i validne podatke
        if (teamName && teamName.length > 0 && rank > 0) {
          standings.push({
            rank,
            team: teamName.trim(),
            gp: gp || (w + l),
            w,
            l,
            points,
            pts,
            opts,
            diff,
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
    const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P', '#', 'No', 'Rank'];
    
    // Pokušaj da pronađeš tabelu na različite načine
    let tableContent = html;
    
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
    
    // Pronađi sve tr redove
    const trMatches = Array.from(tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
    
    for (let index = 0; index < trMatches.length; index++) {
      const trMatch = trMatches[index];
      const row = trMatch[1];
      
      // Pronađi sve td ćelije u redu
      const tdMatches = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
      const cells: string[] = [];
      
      for (const tdMatch of tdMatches) {
        let text = tdMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim();
        
        // Ako je ćelija prazna, pokušaj da pronađeš tekst u span ili div elementima
        if (!text && tdMatch[1]) {
          const spanMatch = tdMatch[1].match(/<span[^>]*>([\s\S]*?)<\/span>/i);
          if (spanMatch) {
            text = spanMatch[1].replace(/<[^>]*>/g, '').trim();
          } else {
            const divMatch = tdMatch[1].match(/<div[^>]*>([\s\S]*?)<\/div>/i);
            if (divMatch) {
              text = divMatch[1].replace(/<[^>]*>/g, '').trim();
            }
          }
        }
        
        cells.push(text);
      }

      if (cells.length < 5) continue;
      
      // Preskoči header redove
      const firstCell = cells[0] || '';
      const secondCell = cells[1] || '';
      if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
        continue;
      }

      // Preskoči redove koji su samo brojevi bez imena tima
      if (!secondCell || secondCell.length === 0) continue;

      // Struktura tabele: No | Team | G | W | L | P | PTS/OPTS | +/-
      let rank = 0;
      const noCell = cells[0] || '';
      if (!isNaN(parseInt(noCell)) && parseInt(noCell) > 0) {
        rank = parseInt(noCell);
      } else {
        rank = index + 1;
      }

      const teamName = cells[1] || '';
      const gp = parseInt(cells[2] || '0') || 0;
      const w = parseInt(cells[3] || '0') || 0;
      const l = parseInt(cells[4] || '0') || 0;
      const points = parseInt(cells[5] || '0') || 0;

      // PTS/OPTS (format: "100/80" ili slično)
      let pts = 0;
      let opts = 0;
      const ptsOptsCell = cells[6] || '';
      if (ptsOptsCell.includes('/')) {
        const parts = ptsOptsCell.split('/');
        pts = parseInt(parts[0]?.trim() || '0') || 0;
        opts = parseInt(parts[1]?.trim() || '0') || 0;
      }

      // +/- (razlika)
      const diffCell = cells[7] || '';
      const diffValue = diffCell.replace(/\+/g, '').trim();
      const diff = parseInt(diffValue || '0') || 0;

      // Dodaj samo ako ima ime tima i validne podatke
      if (teamName && teamName.length > 0 && rank > 0) {
        standings.push({
          rank,
          team: teamName.trim(),
          gp: gp || (w + l),
          w,
          l,
          points,
          pts,
          opts,
          diff,
        });
      }
    }

    return standings;
  }

  private async scrapeWithPlaywright(): Promise<WabaTeamData[]> {
    let page = null;
    try {
      page = await this.browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      console.log(`Učitavanje stranice sa Playwright: ${CONFIG.URL}`);
      
      await page.goto(CONFIG.URL, { 
        waitUntil: 'networkidle',
        timeout: CONFIG.TIMEOUT 
      });

      // Čekaj da se tabela učita
      await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => {
        console.log('Tabela nije pronađena odmah, nastavljam...');
      });

      // Pauziraj 2 sekunde da se svi podaci učitaju
      await page.waitForTimeout(2000);

      // Izvuci podatke iz stranice
      const standings = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        const data: WabaTeamData[] = [];
        
        const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P'];

        rows.forEach((row, index) => {
          const cells = Array.from(row.querySelectorAll('td')).map(c => c?.innerText?.trim() || '');
          
          if (cells.length < 5) return;
          
          const firstCell = cells[0] || '';
          const secondCell = cells[1] || '';
          if (skipHeaders.includes(firstCell) || skipHeaders.includes(secondCell)) {
            return;
          }
          
          if (!secondCell || secondCell.length === 0) return;
          
          let rank = 0;
          const noCell = cells[0] || '';
          if (!isNaN(parseInt(noCell)) && parseInt(noCell) > 0) {
            rank = parseInt(noCell);
          } else {
            rank = index + 1;
          }
          
          const teamName = cells[1] || '';
          const gp = parseInt(cells[2] || '0') || 0;
          const w = parseInt(cells[3] || '0') || 0;
          const l = parseInt(cells[4] || '0') || 0;
          const points = parseInt(cells[5] || '0') || 0;
          
          let pts = 0;
          let opts = 0;
          const ptsOptsCell = cells[6] || '';
          if (ptsOptsCell.includes('/')) {
            const parts = ptsOptsCell.split('/');
            pts = parseInt(parts[0]?.trim() || '0') || 0;
            opts = parseInt(parts[1]?.trim() || '0') || 0;
          }
          
          const diffCell = cells[7] || '';
          const diffValue = diffCell.replace(/\+/g, '').trim();
          const diff = parseInt(diffValue || '0') || 0;
            
          if (teamName && teamName.length > 0 && rank > 0) {
            data.push({
              rank,
              team: teamName.trim(),
              gp: gp || (w + l),
              w,
              l,
              points,
              pts,
              opts,
              diff,
            });
          }
        });

        return data;
      });

      console.log(`Uspješno učitano ${standings.length} timova (Playwright)`);
      
      if (standings.length === 0) {
        throw new Error('Nijedan tim nije pronađen');
      }

      return standings;

    } catch (err) {
      console.error('Greška pri scrapanju sa Playwright:', err);
      // Fallback na fetch ako Playwright ne radi
      console.log('Pokušavam sa fetch metodom...');
      return this.scrapeWithFetch();
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

