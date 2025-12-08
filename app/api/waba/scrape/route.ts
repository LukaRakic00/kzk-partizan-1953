import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WabaStanding from '@/models/WabaStanding';

const LEAGUE_ID = '31913';
const WABA_URL = `https://waba-league.com/season/standings/?leagueId=${LEAGUE_ID}`;

// POST - Scrapuj i sačuvaj u bazu
export async function POST() {
  let puppeteer: any = null;
  
  try {
    // Pokušaj da učitamo puppeteer ako je dostupan
    try {
      puppeteer = require('puppeteer');
    } catch (e) {
      console.log('Puppeteer nije dostupan, koristićemo fetch sa HTML parsing');
    }

    await connectDB();

    let standings: Array<{
      rank: number;
      team: string;
      gp: number;
      w: number;
      l: number;
      pts: number;
      opts: number;
      diff: number;
    }> = [];

    if (puppeteer) {
      // Koristi puppeteer za scraping
      const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      try {
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(30000);
        page.setDefaultTimeout(30000);

        await page.goto(WABA_URL, { waitUntil: 'networkidle0' });
        
        // Čekaj da se tabela učita - nova struktura koristi mbt-table klasu
        await page.waitForSelector('table.mbt-table tbody tr, table tbody tr', { timeout: 10000 }).catch(() => {
          console.log('Tabela nije pronađena, nastavljam...');
        });

        // Pauziraj 2 sekunde da se svi podaci učitaju
        await page.waitForTimeout(2000);

        // Izvuci podatke iz stranice
        standings = await page.evaluate(() => {
          // Pokušaj prvo sa mbt-table, pa fallback na običnu tabelu
          const table = document.querySelector('table.mbt-table') || document.querySelector('table');
          if (!table) return [];
          
          const rows = table.querySelectorAll('tbody tr');
          const data: Array<{
            rank: number;
            team: string;
            gp: number;
            w: number;
            l: number;
            pts: number;
            opts: number;
            diff: number;
          }> = [];

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
                gp,
                w,
                l,
                pts: 0,    // PTS - nema u novoj strukturi
                opts: 0,   // OPTS - nema u novoj strukturi
                diff: 0,   // +/- - nema u novoj strukturi
              });
            }
          });

          return data;
        });

        await browser.close();
      } catch (err) {
        await browser.close();
        throw err;
      }
    } else {
      // Fallback na fetch sa HTML parsing
      const response = await fetch(WABA_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      
      // Parsiraj HTML - prvo pokušaj sa mbt-table
      let tableMatch = html.match(/<table[^>]*class="[^"]*mbt-table[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
      if (!tableMatch) {
        tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
      }
      if (!tableMatch) {
        throw new Error('Tabela nije pronađena na stranici');
      }

      const tableHtml = tableMatch[1];
      const rowMatches = Array.from(tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi));
      
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

        if (teamName && teamName.length > 0 && rank > 0) {
          standings.push({
            rank,
            team: teamName.trim(),
            gp,
            w,
            l,
            pts: 0,    // PTS - nema u novoj strukturi
            opts: 0,   // OPTS - nema u novoj strukturi
            diff: 0,   // +/- - nema u novoj strukturi
          });
        }
      }
    }

    if (standings.length === 0) {
      return NextResponse.json(
        { error: 'Nije moguće parsirati podatke. Nema timova u tabeli.' },
        { status: 500 }
      );
    }

    // Obriši stare podatke za ovu ligu
    await WabaStanding.deleteMany({ leagueId: LEAGUE_ID });

    // Sačuvaj nove podatke
    const savedStandings = await WabaStanding.insertMany(
      standings.map((standing) => ({
        ...standing,
        leagueId: LEAGUE_ID,
      }))
    );

    return NextResponse.json({
      success: true,
      message: `Uspješno ažurirano ${savedStandings.length} timova`,
      standings: savedStandings,
      totalTeams: savedStandings.length,
    });
  } catch (error: any) {
    console.error('Error scraping WABA standings:', error);
    return NextResponse.json(
      { error: `Greška pri scrapanju: ${error.message}` },
      { status: 500 }
    );
  }
}
