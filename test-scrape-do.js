// Test skripta za Scrape.do API
// Pokreni sa: node test-scrape-do.js

const token = process.env.SCRAPE_DO_TOKEN || process.env.SCRAPEDO_TOKEN || '1a2144746b324026b90b3ef1ac95a7bc8ff5428f1d7';
const url = 'https://waba-league.com/season/standings/';

console.log('🧪 Testiranje Scrape.do API...\n');
console.log(`Token: ${token.substring(0, 10)}...${token.substring(token.length - 5)}`);
console.log(`URL: ${url}\n`);

// Test 1: Osnovni poziv bez parametara
async function testBasic() {
  console.log('📋 Test 1: Osnovni poziv (bez JavaScript renderovanja)');
  const scrapeDoUrl = `https://api.scrape.do/?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`;
  
  try {
    const response = await fetch(scrapeDoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error(`❌ Greška: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Detalji: ${errorText.substring(0, 200)}`);
      return false;
    }

    const html = await response.text();
    console.log(`✅ Uspešno: ${html.length} karaktera HTML-a`);
    
    // Proveri da li sadrži tabelu
    const hasMbtTable = html.includes('mbt-table') || html.includes('mbt-standings');
    const hasTeamIdLinks = html.includes('team_id') || html.includes('teamId');
    
    console.log(`   - Sadrži mbt-table: ${hasMbtTable}`);
    console.log(`   - Sadrži team_id linkove: ${hasTeamIdLinks}`);
    
    if (hasMbtTable || hasTeamIdLinks) {
      console.log('   ✅ Tabela je pronađena!\n');
      return true;
    } else {
      console.log('   ⚠️  Tabela NIJE pronađena - JavaScript možda nije renderovan\n');
      return false;
    }
  } catch (error) {
    console.error(`❌ Greška: ${error.message}\n`);
    return false;
  }
}

// Test 2: Sa JavaScript renderovanjem (ako Scrape.do podržava)
async function testWithRender() {
  console.log('📋 Test 2: Sa JavaScript renderovanjem (render=true)');
  const scrapeDoUrl = `https://api.scrape.do/?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}&render=true&wait=10000`;
  
  try {
    const response = await fetch(scrapeDoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(60000),
    });

    if (!response.ok) {
      console.error(`❌ Greška: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error(`Detalji: ${errorText.substring(0, 200)}`);
      return false;
    }

    const html = await response.text();
    console.log(`✅ Uspešno: ${html.length} karaktera HTML-a`);
    
    // Proveri da li sadrži tabelu
    const hasMbtTable = html.includes('mbt-table') || html.includes('mbt-standings');
    const hasTeamIdLinks = html.includes('team_id') || html.includes('teamId');
    
    console.log(`   - Sadrži mbt-table: ${hasMbtTable}`);
    console.log(`   - Sadrži team_id linkove: ${hasTeamIdLinks}`);
    
    if (hasMbtTable || hasTeamIdLinks) {
      console.log('   ✅ Tabela je pronađena sa JavaScript renderovanjem!\n');
      
      // Pokušaj da pronađeš neke podatke
      const tableMatch = html.match(/<table[^>]*class="[^"]*mbt[^"]*"[^>]*>[\s\S]{0,1000}/i);
      if (tableMatch) {
        console.log('   📊 Primer tabele (prvih 300 karaktera):');
        console.log(`   ${tableMatch[0].substring(0, 300)}...\n`);
      }
      
      return true;
    } else {
      console.log('   ⚠️  Tabela NIJE pronađena čak ni sa render=true\n');
      return false;
    }
  } catch (error) {
    console.error(`❌ Greška: ${error.message}\n`);
    return false;
  }
}

// Test 3: Provera da li HTML uopšte sadrži neki sadržaj
async function testContent() {
  console.log('📋 Test 3: Provera HTML sadržaja');
  const scrapeDoUrl = `https://api.scrape.do/?url=${encodeURIComponent(url)}&token=${encodeURIComponent(token)}`;
  
  try {
    const response = await fetch(scrapeDoUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return false;
    }

    const html = await response.text();
    
    // Proveri različite indikatore
    console.log(`   - Dužina HTML-a: ${html.length} karaktera`);
    console.log(`   - Sadrži <body>: ${html.includes('<body')}`);
    console.log(`   - Sadrži <script>: ${html.includes('<script')}`);
    console.log(`   - Sadrži "WABA": ${html.includes('WABA')}`);
    console.log(`   - Sadrži "standings": ${html.includes('standings')}`);
    console.log(`   - Sadrži "table": ${html.includes('<table')}`);
    
    // Pronađi sve tabele
    const tableMatches = html.match(/<table[^>]*>/gi);
    console.log(`   - Broj tabela: ${tableMatches ? tableMatches.length : 0}`);
    
    // Pronađi sve script tagove
    const scriptMatches = html.match(/<script[^>]*>/gi);
    console.log(`   - Broj script tagova: ${scriptMatches ? scriptMatches.length : 0}\n`);
    
    return true;
  } catch (error) {
    console.error(`❌ Greška: ${error.message}\n`);
    return false;
  }
}

// Glavna funkcija
async function runTests() {
  console.log('='.repeat(60));
  console.log('SCrape.do API Test');
  console.log('='.repeat(60));
  console.log();
  
  const results = {
    basic: await testBasic(),
    withRender: await testWithRender(),
    content: await testContent(),
  };
  
  console.log('='.repeat(60));
  console.log('REZULTATI:');
  console.log('='.repeat(60));
  console.log(`Osnovni poziv: ${results.basic ? '✅ USPEŠNO' : '❌ NEUSPEŠNO'}`);
  console.log(`Sa render=true: ${results.withRender ? '✅ USPEŠNO' : '❌ NEUSPEŠNO'}`);
  console.log(`Provera sadržaja: ${results.content ? '✅ USPEŠNO' : '❌ NEUSPEŠNO'}`);
  console.log();
  
  if (results.basic || results.withRender) {
    console.log('✅ Scrape.do API radi i vraća HTML!');
    if (results.withRender) {
      console.log('✅ JavaScript renderovanje radi!');
    } else {
      console.log('⚠️  JavaScript renderovanje možda ne radi - koristi browser automation kao fallback');
    }
  } else {
    console.log('❌ Scrape.do API ne vraća tabelu - koristi browser automation (Playwright/Puppeteer)');
  }
  console.log();
}

// Pokreni testove
runTests().catch(console.error);

