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

Nisu potrebne dodatne environment variables.

## Alternativno Rešenje

Ako Puppeteer/Playwright ne rade u produkciji, možete koristiti:

1. **ScrapingBee API** - Servis koji renderuje JavaScript stranice
2. **Browserless.io** - Cloud browser servis
3. **Manual Update** - Ručno ažuriranje podataka kroz admin panel

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
