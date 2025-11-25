/**
 * Script za učitavanje WABA podataka u bazu
 * Pokreni sa: bun run scripts/load-waba-data.ts
 */

import connectDB from '../lib/mongodb';
import WabaStanding from '../models/WabaStanding';
import { WABAStandingsScraper } from '../lib/waba-scraper';

const LEAGUE_ID = '31913';

async function loadWabaData() {
  const scraper = new WABAStandingsScraper();
  
  try {
    console.log('Povezivanje sa bazom podataka...');
    await connectDB();
    
    console.log('Pokretanje WABA scraping-a...');
    await scraper.initialize();
    
    const scrapedData = await scraper.scrapeStandings();
    
    if (scrapedData.length === 0) {
      throw new Error('Nijedan tim nije pronađen');
    }
    
    console.log(`Pronađeno ${scrapedData.length} timova`);
    
    // Obriši stare podatke
    const deleteResult = await WabaStanding.deleteMany({ leagueId: LEAGUE_ID });
    console.log(`Obrisano ${deleteResult.deletedCount} starih zapisa`);
    
    // Sačuvaj nove podatke
    const standingsToSave = scrapedData.map((team) => ({
      rank: team.rank,
      team: team.team,
      gp: team.gp,
      w: team.w,
      l: team.l,
      pts: team.pts,
      opts: team.opts,
      diff: team.diff,
      leagueId: LEAGUE_ID,
    }));
    
    const savedStandings = await WabaStanding.insertMany(standingsToSave);
    
    console.log(`✓ Uspješno sačuvano ${savedStandings.length} timova u bazu`);
    console.log('\nTimovi:');
    savedStandings.forEach((standing: any) => {
      console.log(`  ${standing.rank}. ${standing.team} - W:${standing.w} L:${standing.l} PTS:${standing.pts}`);
    });
    
  } catch (error: any) {
    console.error('✗ Greška:', error.message);
    process.exit(1);
  } finally {
    await scraper.close();
    process.exit(0);
  }
}

loadWabaData();

