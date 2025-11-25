import puppeteer from 'puppeteer';

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

  async initialize() {
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
      return true;
    } catch (err) {
      console.error('Greška pri inicijalizaciji Puppeteer:', err);
      throw err;
    }
  }

  async scrapeStandings(): Promise<WabaTeamData[]> {
    let page = null;
    try {
      if (!this.browser) {
        await this.initialize();
      }

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
      console.error('Greška pri scrapanju:', err);
      throw err;
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

