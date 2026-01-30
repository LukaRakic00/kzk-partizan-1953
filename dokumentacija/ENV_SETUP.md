# Konfiguracija .env Fajla

Kreiraj `.env` fajl u root direktorijumu projekta i dodaj sledeće varijable:

## Obavezne Varijable

### 1. MongoDB Connection
```env
MONGODB_URI=mongodb://localhost:27017/kzk-partizan
```

**Opcije:**
- **Lokalna MongoDB**: `mongodb://localhost:27017/kzk-partizan`
- **MongoDB Atlas** (cloud): `mongodb+srv://username:password@cluster.mongodb.net/kzk-partizan`

**Kako dobiti:**
- Za lokalnu: Instaliraj MongoDB na računaru
- Za Atlas: Kreiraj besplatan nalog na [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) i kreiraj cluster

---

### 2. JWT Secret
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Šta je ovo:**
- Secret key za potpisivanje JWT tokena za autentifikaciju
- **VAŽNO**: Koristi jak, random string u production-u!

**Kako generisati:**
```bash
# Na Linux/Mac
openssl rand -base64 32

# Ili koristi bilo koji random string generator
```

---

### 3. Cloudinary Configuration

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Kako dobiti:**
1. Registruj se na [Cloudinary](https://cloudinary.com) (besplatno)
2. U Dashboard-u nađi:
   - **Cloud Name** - ime tvog cloud-a
   - **API Key** - tvoj API ključ
   - **API Secret** - tvoj API secret

**Napomena:** Slike će se automatski upload-ovati u folder `KZK_Partizan/` sa podfolderima:
- `igraci/` - slike igrača
- `vesti/` - slike za vesti
- `galerija/` - slike za galerije
- `sections/` - slike za sekcije
- `ostalo/` - ostale slike

---

### 4. API URL
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Za development:** `http://localhost:3000`
**Za production:** `https://tvoj-domen.com`

---

### 5. NextAuth Secret (opciono)
```env
NEXTAUTH_SECRET=your-nextauth-secret-key
```

Ovo je opciono, ali dobro je imati ako planiraš da koristiš NextAuth u budućnosti.

---

### 6. ScrapingBee API Key (opciono, preporučeno za produkciju)
```env
SCRAPINGBEE_API_KEY=your-scrapingbee-api-key
```

**Šta je ovo:**
- API key za ScrapingBee servis koji se koristi za scraping JavaScript-renderovanih stranica
- **Preporučeno za Vercel produkciju** jer browser automation (Puppeteer/Playwright) može imati problema sa shared libraries

**Kako dobiti:**
1. Registruj se na [ScrapingBee](https://www.scrapingbee.com/) (besplatno)
2. Besplatni plan: 1000 zahteva/mesec (dovoljno za dnevne update-e)
3. U Dashboard-u nađi svoj API key
4. Dodaj ga u `.env` fajl i u Vercel Environment Variables

**Za Vercel produkciju:**
- Idite na Vercel Dashboard → Your Project → Settings → Environment Variables
- Dodajte `SCRAPINGBEE_API_KEY` sa vašim API key-em
- Redeploy projekat

---

## Primer Kompletnog .env Fajla

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/kzk-partizan

# JWT
JWT_SECRET=moj-super-tajni-kljuc-12345-ne-koristi-ovo-u-production

# Cloudinary
CLOUDINARY_CLOUD_NAME=moj-cloud
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz123456

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# NextAuth (opciono)
NEXTAUTH_SECRET=nextauth-secret-key

# ScrapingBee (opciono, preporučeno za produkciju)
SCRAPINGBEE_API_KEY=your-scrapingbee-api-key
```

---

## Koraci za Setup

1. **Kreiraj `.env` fajl:**
   ```bash
   cp .env.example .env
   ```

2. **Otvori `.env` fajl i popuni sve vrednosti**

3. **Za MongoDB:**
   - Instaliraj MongoDB lokalno ILI
   - Kreiraj MongoDB Atlas nalog

4. **Za Cloudinary:**
   - Registruj se na Cloudinary
   - Uzmi credentials iz Dashboard-a

5. **Generiši JWT Secret:**
   ```bash
   openssl rand -base64 32
   ```

6. **Pokreni aplikaciju:**
   ```bash
   bun dev
   ```

---

## Security Napomene

⚠️ **NIKADA ne commit-uj `.env` fajl u Git!**
- `.env` je već u `.gitignore` fajlu
- Ne deli `.env` fajl sa drugima
- U production-u koristi environment varijable na hosting platformi

---

## Troubleshooting

**Problem:** "MongoDB connection failed"
- Proveri da li je MongoDB pokrenut (lokalno)
- Proveri connection string
- Proveri da li imaš pristup MongoDB Atlas cluster-u

**Problem:** "Cloudinary upload failed"
- Proveri da li su svi Cloudinary credentials ispravni
- Proveri da li imaš dovoljno storage-a na Cloudinary nalogu

**Problem:** "JWT verification failed"
- Proveri da li je `JWT_SECRET` postavljen
- Proveri da li je isti secret korišćen za generisanje i verifikaciju tokena


