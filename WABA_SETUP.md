# WABA Scraper Setup za Produkciju

## Problem

WABA scraper zahteva browser automation (Puppeteer/Playwright) da bi mogao da renderuje JavaScript stranice. U Vercel okruženju, ovo zahteva posebne pakete.

## Rešenje

### 1. Instalirajte potrebne pakete

```bash
npm install puppeteer-core @sparticuz/chromium playwright
```

### 2. Vercel Konfiguracija

U `vercel.json`, dodajte:

```json
{
  "functions": {
    "app/api/waba/init/route.ts": {
      "maxDuration": 60
    }
  }
}
```

### 3. Environment Variables

**Opciono:** Ako Puppeteer/Playwright ne rade u produkciji, možete koristiti ScrapingBee API:

```bash
# Dodajte u Vercel Environment Variables
SCRAPINGBEE_API_KEY=your_api_key_here
```

Besplatni plan ScrapingBee daje 1000 zahteva mesečno, što je dovoljno za dnevne update-e.

## Alternativno Rešenje - ScrapingBee API (Preporučeno za Vercel)

Ako Puppeteer/Playwright ne rade u produkciji, najbolje rešenje je koristiti ScrapingBee API:

1. **Registrujte se na ScrapingBee**: https://www.scrapingbee.com/
2. **Dobijte API key** (besplatni plan: 1000 zahteva/mesec)
3. **Dodajte API key u Vercel Environment Variables**:
   - Idite na Vercel Dashboard → Your Project → Settings → Environment Variables
   - Dodajte `SCRAPINGBEE_API_KEY` sa vašim API key-em
4. **Redeploy projekat**

Scraper će automatski koristiti ScrapingBee API ako je API key dostupan.

### Druge Alternative:

1. **Browserless.io** - Cloud browser servis (zahteva subscription)
2. **Manual Update** - Ručno ažuriranje podataka kroz admin panel

## Troubleshooting

### Greška: "Tabela nije pronađena na stranici"

Ovo znači da fetch metoda ne može da vidi JavaScript-renderovanu tabelu. Rešenje:
- Proverite da li su instalirani `puppeteer-core` i `@sparticuz/chromium` paketi
- Proverite da li Vercel ima dovoljno resursa za browser automation
- Povećajte `maxDuration` u `vercel.json`

### Greška: "Nijedan tim nije pronađen"

- Proverite da li je URL ispravan: `https://waba-league.com/season/standings/?leagueId=31913`
- Proverite da li stranica još uvek koristi istu strukturu HTML-a

## Testiranje

Pre deploy-a u produkciju, testirajte lokalno:

```bash
npm run dev
```

Zatim idite na `/admin` i kliknite na "Ažuriraj WABA Ligu".
