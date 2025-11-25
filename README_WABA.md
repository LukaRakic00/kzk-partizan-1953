# WABA Standings Integration

## Instalacija

1. Instaliraj Puppeteer:
```bash
bun add puppeteer
```

2. Dodaj environment varijable u `.env` (opciono):
```env
WABA_UPDATE_API_KEY=your-secret-key-here
CRON_SECRET=your-cron-secret-here
```

## API Endpoints

### GET `/api/waba/standings`
Vraća trenutne standings iz baze podataka.

**Response:**
```json
{
  "standings": [...],
  "lastUpdated": "2025-01-15T10:30:00.000Z",
  "isStale": false,
  "totalTeams": 7
}
```

### POST `/api/waba/standings`
Ručno pokreće scraping i ažurira bazu podataka.

**Response:**
```json
{
  "success": true,
  "message": "Uspješno ažurirano 7 timova",
  "standings": [...],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

### GET `/api/cron/waba-update`
Cron job endpoint za automatsko ažuriranje jednom dnevno (u 12:00).

**Authorization:** 
- Ako je postavljen `CRON_SECRET`, zahtev mora imati header: `Authorization: Bearer ${CRON_SECRET}`
- Vercel Cron Jobs automatski dodaje ovaj header

## Automatsko Ažuriranje

### Vercel Cron Jobs
Ako deploy-uješ na Vercel, `vercel.json` je već konfigurisan za automatsko ažuriranje jednom dnevno (u 12:00). Vercel Hobby plan dozvoljava samo jednom dnevno cron job-ove.

### Lokalno Testiranje
Možeš ručno pozvati cron endpoint:
```bash
curl http://localhost:3000/api/cron/waba-update
```

### Alternativno - External Cron Service
Možeš koristiti servise poput:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- [UptimeRobot](https://uptimerobot.com)

Pozovi endpoint: `https://your-domain.com/api/cron/waba-update` sa header-om:
```
Authorization: Bearer your-cron-secret
```

## Struktura Podataka

### MongoDB Model: `WabaStanding`
```typescript
{
  rank: number;        // Pozicija u tabeli
  team: string;        // Ime tima
  gp: number;          // Games Played (Odigrano)
  w: number;           // Wins (Pobede)
  l: number;           // Losses (Porazi)
  pts: number;         // Points For (Ukupno Dati)
  opts: number;        // Opponent Points (Ukupno Primljeni)
  diff: number;        // Difference (Koš Razlika)
  leagueId: string;    // ID lige (31913)
  lastUpdated: Date;  // Poslednje ažuriranje
}
```

## Troubleshooting

### Puppeteer ne radi
- Proveri da li je Puppeteer instaliran: `bun list | grep puppeteer`
- Proveri da li API route ima `export const runtime = 'nodejs'`
- Proveri da li server ima dovoljno resursa za pokretanje headless browser-a

### Scraping ne radi
- Proveri da li je WABA sajt dostupan: `https://waba-league.com/season/standings/?leagueId=31913`
- Proveri da li se struktura HTML-a promenila
- Proveri logove u konzoli

### Cron job ne radi
- Proveri `vercel.json` konfiguraciju
- Proveri da li je `CRON_SECRET` postavljen ako koristiš external cron service
- Proveri Vercel dashboard za cron job status

