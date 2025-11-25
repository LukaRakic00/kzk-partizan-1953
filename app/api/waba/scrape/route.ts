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
        
        // Čekaj da se tabela učita
        await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(() => {
          console.log('Tabela nije pronađena, nastavljam...');
        });

        // Pauziraj 2 sekunde da se svi podaci učitaju
        await page.waitForTimeout(2000);

        // Izvuci podatke iz stranice
        standings = await page.evaluate(() => {
          const rows = document.querySelectorAll('table tbody tr');
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

          rows.forEach((row, index) => {
            const cells = row.querySelectorAll('td');
            
            if (cells.length > 0) {
              const rank = index + 1;
              const team = cells[0]?.textContent?.trim() || '';
              const gp = parseInt(cells[1]?.textContent?.trim() || '0') || 0;
              const w = parseInt(cells[2]?.textContent?.trim() || '0') || 0;
              const l = parseInt(cells[3]?.textContent?.trim() || '0') || 0;
              const pts = parseInt(cells[4]?.textContent?.trim() || '0') || 0;
              const opts = parseInt(cells[5]?.textContent?.trim() || '0') || 0;
              const diff = parseInt(cells[6]?.textContent?.trim() || '0') || 0;

              if (team) {
                data.push({
                  rank,
                  team,
                  gp,
                  w,
                  l,
                  pts,
                  opts,
                  diff,
                });
              }
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
      
      // Parsiraj HTML - ovo je osnovni parser
      const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
      if (!tableMatch) {
        throw new Error('Tabela nije pronađena na stranici');
      }

      const tableHtml = tableMatch[1];
      const rowMatches = tableHtml.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi);
      
      for (const rowMatch of rowMatches) {
        const row = rowMatch[1];
        const cellMatches = row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi);
        const cells: string[] = [];
        
        for (const cellMatch of cellMatches) {
          const text = cellMatch[1]
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          cells.push(text);
        }

        if (cells.length >= 7 && cells[0]) {
          standings.push({
            rank: parseInt(cells[0]) || standings.length + 1,
            team: cells[0],
            gp: parseInt(cells[1]) || 0,
            w: parseInt(cells[2]) || 0,
            l: parseInt(cells[3]) || 0,
            pts: parseInt(cells[4]) || 0,
            opts: parseInt(cells[5]) || 0,
            diff: parseInt(cells[6]) || 0,
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
