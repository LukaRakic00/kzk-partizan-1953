let puppeteer: any = null;

// Pokušaj da učitamo puppeteer, ali ne bacaj grešku ako nije dostupan
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.log('Puppeteer nije dostupan, koristićemo fetch metodu');
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

  async initialize() {
    // Pokušaj da inicijalizujemo Puppeteer samo ako je dostupan
    if (puppeteer) {
      try {
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
        this.usePuppeteer = true;
        console.log('Puppeteer uspešno inicijalizovan');
        return true;
      } catch (err: any) {
        console.warn('Greška pri inicijalizaciji Puppeteer, koristićemo fetch metodu:', err.message);
        this.usePuppeteer = false;
        return false;
      }
    } else {
      console.log('Puppeteer nije dostupan, koristićemo fetch metodu');
      this.usePuppeteer = false;
      return false;
    }
  }

  async scrapeStandings(): Promise<WabaTeamData[]> {
    // Ako Puppeteer nije dostupan ili nije uspeo da se inicijalizuje, koristi fetch
    if (!this.usePuppeteer || !this.browser) {
      console.log('Koristim fetch metodu jer Puppeteer nije dostupan ili nije inicijalizovan');
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
      const response = await fetch(CONFIG.URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
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
        throw new Error('Nijedan tim nije pronađen. Stranica možda koristi JavaScript za renderovanje tabele.');
      }

      return standings;
    } catch (err) {
      console.error('Greška pri scrapanju sa fetch metodom:', err);
      throw err;
    }
  }

  private parseRowsDirectly(html: string): WabaTeamData[] {
    const standings: WabaTeamData[] = [];
    const skipHeaders = ['Games', 'Wins', 'Losses', 'Losses by forfeit', 'Team', 'G', 'W', 'L', 'P'];
    
    // Pronađi sve tr redove
    const trMatches = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
    
    for (let index = 0; index < trMatches.length; index++) {
      const trMatch = trMatches[index];
      const row = trMatch[1];
      
      // Pronađi sve td ćelije u redu
      const tdMatches = Array.from(row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi));
      const cells: string[] = [];
      
      for (const tdMatch of tdMatches) {
        const text = tdMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
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

    return standings;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

