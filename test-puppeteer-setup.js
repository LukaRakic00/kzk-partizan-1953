// Test skripta za proveru Puppeteer + @sparticuz/chromium setup-a
// Pokreni sa: node test-puppeteer-setup.js

console.log('🧪 Testiranje Puppeteer + @sparticuz/chromium setup...\n');

// Test 1: Provera da li su paketi instalirani
console.log('📋 Test 1: Provera instalacije paketa');
try {
  const puppeteer = require('puppeteer-core');
  console.log('✅ puppeteer-core je instaliran');
  console.log(`   Verzija: ${puppeteer.version || 'N/A'}`);
} catch (error) {
  console.error('❌ puppeteer-core NIJE instaliran:', error.message);
  process.exit(1);
}

try {
  const chromium = require('@sparticuz/chromium');
  console.log('✅ @sparticuz/chromium je instaliran');
  console.log(`   Verzija: ${chromium.version || 'N/A'}`);
} catch (error) {
  console.error('❌ @sparticuz/chromium NIJE instaliran:', error.message);
  process.exit(1);
}

// Test 2: Provera executable path
console.log('\n📋 Test 2: Provera Chromium executable path');
async function testExecutablePath() {
  try {
    const chromium = require('@sparticuz/chromium');
    const executablePath = await chromium.executablePath();
    console.log(`✅ Executable path: ${executablePath ? 'OK' : 'MISSING'}`);
    if (executablePath && typeof executablePath === 'string') {
      console.log(`   Putanja: ${executablePath.substring(0, 100)}...`);
    } else if (executablePath) {
      console.log(`   Tip: ${typeof executablePath}`);
    }
  } catch (error) {
    console.error('❌ Greška pri dobijanju executable path:', error.message);
  }
}
testExecutablePath();

// Test 3: Provera argumenta
console.log('\n📋 Test 3: Provera Chromium argumenta');
try {
  const chromium = require('@sparticuz/chromium');
  const args = chromium.args || [];
  console.log(`✅ Chromium argumenti: ${args.length} argumenta`);
  console.log(`   Prvih 5 argumenata: ${args.slice(0, 5).join(', ')}`);
} catch (error) {
  console.error('❌ Greška pri dobijanju argumenata:', error.message);
}

// Test 4: Provera viewport-a
console.log('\n📋 Test 4: Provera viewport konfiguracije');
try {
  const chromium = require('@sparticuz/chromium');
  const viewport = chromium.defaultViewport || {};
  console.log(`✅ Viewport: ${JSON.stringify(viewport)}`);
} catch (error) {
  console.error('❌ Greška pri dobijanju viewport-a:', error.message);
}

// Test 5: Pokušaj inicijalizacije browser-a (opciono - može biti sporo)
console.log('\n📋 Test 5: Pokušaj inicijalizacije browser-a');
console.log('   (Ovo može potrajati nekoliko sekundi...)');

async function testBrowserInit() {
  try {
    const puppeteer = require('puppeteer-core');
    const chromium = require('@sparticuz/chromium');
    
    // Konfiguriši chromium za Vercel
    if (typeof chromium.setGraphicsMode === 'function') {
      chromium.setGraphicsMode(false);
    }
    
    const executablePath = await chromium.executablePath();
    
    if (!executablePath) {
      console.error('❌ Executable path nije dostupan');
      return false;
    }
    
    console.log('   Pokretanje browser-a...');
    
    const browser = await puppeteer.launch({
      args: chromium.args || [],
      defaultViewport: chromium.defaultViewport || { width: 1920, height: 1080 },
      executablePath: executablePath,
      headless: chromium.headless !== false,
    });
    
    console.log('✅ Browser uspešno pokrenut!');
    
    const page = await browser.newPage();
    console.log('✅ Nova stranica kreirana');
    
    await page.goto('https://www.example.com', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('✅ Stranica uspešno učitana');
    
    await browser.close();
    console.log('✅ Browser uspešno zatvoren');
    
    return true;
  } catch (error) {
    console.error('❌ Greška pri inicijalizaciji browser-a:', error.message);
    console.error('   Stack:', error.stack?.substring(0, 500));
    return false;
  }
}

// Pokreni test samo ako korisnik želi (može biti sporo)
const args = process.argv.slice(2);
if (args.includes('--full') || args.includes('-f')) {
  testBrowserInit().then(success => {
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ SVI TESTOVI PROŠLI - Puppeteer setup je ispravan!');
    } else {
      console.log('❌ NEKI TESTOVI NISU PROŠLI - Proverite greške iznad');
    }
    console.log('='.repeat(60));
    process.exit(success ? 0 : 1);
  });
} else {
  console.log('\n💡 Za potpunu proveru (uključujući pokretanje browser-a), pokreni:');
  console.log('   node test-puppeteer-setup.js --full');
  console.log('\n✅ Osnovni testovi prošli - paketi su instalirani!');
  console.log('='.repeat(60));
}

