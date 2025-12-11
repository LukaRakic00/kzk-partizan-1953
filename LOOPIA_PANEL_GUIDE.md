# Loopia Panel - Detaljni Vodič

Ovaj vodič će vam pokazati tačno gde i kako da podesite sve u Loopia panelu.

## 🔐 1. Environment Varijable u Loopia Panelu

### Korak 1: Pristup Panelu
1. Idite na [https://www.loopia.se/](https://www.loopia.se/)
2. Ulogujte se sa svojim kredencijalima
3. Idite na **"Mina sidor"** (Moji sajtovi)

### Korak 2: Environment Varijable
1. Kliknite na vaš domen/sajt
2. Idite na **"Inställningar"** (Podešavanja) ili **"Webbhotell"** (Web Hosting)
3. Pronađite sekciju **"Miljövariabler"** (Environment Variables) ili **"Environment Variables"**
4. Kliknite **"Lägg till"** (Dodaj) ili **"Add"**

### Korak 3: Dodajte Varijable

Dodajte sledeće varijable jednu po jednu:

#### MongoDB Connection
```
Variabelnamn (Variable Name): MONGODB_URI
Värde (Value): mongodb+srv://username:password@cluster.mongodb.net/kzk-partizan
```

#### JWT Secret
```
Variabelnamn: JWT_SECRET
Värde: [generiši jak random string - koristi openssl rand -base64 32]
```

#### Cloudinary Cloud Name
```
Variabelnamn: CLOUDINARY_CLOUD_NAME
Värde: [tvoj-cloud-name]
```

#### Cloudinary API Key
```
Variabelnamn: CLOUDINARY_API_KEY
Värde: [tvoj-api-key]
```

#### Cloudinary API Secret
```
Variabelnamn: CLOUDINARY_API_SECRET
Värde: [tvoj-api-secret]
```

#### API URL
```
Variabelnamn: NEXT_PUBLIC_API_URL
Värde: https://vas-domen.rs
```

#### MongoDB Database Name
```
Variabelnamn: MONGO_DB
Värde: KZKPartizanDB
```

**VAŽNO:** 
- Nakon dodavanja svake varijable, kliknite **"Spara"** (Sačuvaj)
- Restart-ujte aplikaciju nakon dodavanja varijabli

---

## 📁 2. Upload Fajlova preko FTP

### Korak 1: FTP Pristup Podaci
1. U Loopia panelu, idite na **"FTP-konton"** (FTP Accounts)
2. Kreiraj novi FTP nalog ako ne postoji
3. Zapišite:
   - **FTP Server:** ftp.vas-domen.rs (ili ono što Loopia kaže)
   - **Username:** [tvoj-ftp-username]
   - **Password:** [tvoj-ftp-password]
   - **Port:** 21 (ili 22 za SFTP)

### Korak 2: Povezivanje sa FileZilla
1. Download-ujte [FileZilla](https://filezilla-project.org/)
2. Otvorite FileZilla
3. Unesite FTP podatke:
   - **Host:** ftp.vas-domen.rs
   - **Username:** [tvoj-username]
   - **Password:** [tvoj-password]
   - **Port:** 21
4. Kliknite **"Quickconnect"**

### Korak 3: Upload Fajlova
1. U FileZilla, idite na **"public_html"** ili **"www"** folder na serveru
2. Sa lokalnog računara, selektujte sve fajlove iz projekta
3. **NE upload-ujte:**
   - `node_modules` folder
   - `.env` fajl (kreiraj na serveru)
   - `.git` folder
4. **Upload-ujte:**
   - `app` folder
   - `components` folder
   - `lib` folder
   - `models` folder
   - `public` folder
   - `package.json`
   - `next.config.js`
   - `tsconfig.json`
   - `tailwind.config.ts`
   - Sve ostale konfiguracione fajlove

---

## 🗄️ 3. Baza Podataka - MongoDB Atlas Setup

### Korak 1: Kreiraj MongoDB Atlas Nalog
1. Idite na [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Kliknite **"Try Free"**
3. Registrujte se (besplatno)

### Korak 2: Kreiraj Cluster
1. Kliknite **"Build a Database"**
2. Izaberi **"M0"** (Free tier)
3. Izaberi **"AWS"** kao provider
4. Izaberi region: **"Frankfurt (eu-central-1)"** (najbliže Srbiji)
5. Kliknite **"Create"**

### Korak 3: Kreiraj Database User
1. Idite na **"Database Access"** u levom meniju
2. Kliknite **"Add New Database User"**
3. Izaberi **"Password"** autentifikaciju
4. Unesite:
   - **Username:** `kzkpartizan` (ili nešto slično)
   - **Password:** [generiši jak password]
5. Kliknite **"Add User"**
6. **VAŽNO:** Zapišite username i password!

### Korak 4: Whitelist IP Adresa
1. Idite na **"Network Access"** u levom meniju
2. Kliknite **"Add IP Address"**
3. Za development, kliknite **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Za production, dodaj IP adresu Loopia servera:
   - Kontaktirajte Loopia podršku za IP adresu
   - Ili koristite **"Add Current IP Address"**
5. Kliknite **"Confirm"**

### Korak 5: Uzmi Connection String
1. Idite na **"Database"** u levom meniju
2. Kliknite **"Connect"** na vašem clusteru
3. Izaberi **"Connect your application"**
4. Kopiraj connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Zameni `<username>` i `<password>` sa vašim podacima
6. Dodaj ime baze na kraju:
   ```
   mongodb+srv://kzkpartizan:password@cluster0.xxxxx.mongodb.net/kzk-partizan?retryWrites=true&w=majority
   ```

### Korak 6: Dodaj u Loopia Environment Varijable
Dodaj u Loopia panel kao `MONGODB_URI` (vidi gore)

---

## 🖼️ 4. Cloudinary Setup (Za Slike)

### Korak 1: Kreiraj Cloudinary Nalog
1. Idite na [https://cloudinary.com](https://cloudinary.com)
2. Kliknite **"Sign Up for Free"**
3. Registrujte se (besplatno - 25GB storage)

### Korak 2: Uzmi Credentials
1. Nakon registracije, idite na **Dashboard**
2. Nađite:
   - **Cloud Name:** (npr. `dxyz123abc`)
   - **API Key:** (npr. `123456789012345`)
   - **API Secret:** (npr. `abcdefghijklmnopqrstuvwxyz123456`)

### Korak 3: Dodaj u Loopia Environment Varijable
Dodaj tri varijable (vidi gore):
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

---

## 🚀 5. Deploy Aplikacije

### Opcija A: Ako Loopia ima Node.js Support

1. **SSH pristup serveru:**
   - U Loopia panelu, idite na **"SSH Access"**
   - Aktiviraj SSH ako nije aktiviran
   - Zapišite SSH podatke

2. **Poveži se preko SSH:**
   ```bash
   ssh username@vas-domen.rs
   ```

3. **Idi u web folder:**
   ```bash
   cd public_html
   # ili
   cd www
   ```

4. **Instaliraj dependencies:**
   ```bash
   bun install --production
   ```

5. **Build aplikacije:**
   ```bash
   bun run build
   ```

6. **Pokreni aplikaciju:**
   ```bash
   bun start
   ```

### Opcija B: Ako Loopia nema Node.js Support

**Alternativa 1: Koristi Vercel (Besplatno)**
1. Idite na [https://vercel.com](https://vercel.com)
2. Povežite GitHub repo
3. Dodajte environment varijable
4. Deploy automatski

**Alternativa 2: Koristi Loopia VPS**
- Upgrade na Loopia Cloud Server
- Instaliraj Node.js i MongoDB
- Deploy aplikaciju

---

## 🔧 6. Podešavanje Cron Jobs (Za Automatske Update-e)

Ako želite automatske update-e WABA tabele:

1. U Loopia panelu, idite na **"Cron Jobs"**
2. Kliknite **"Add New Cron Job"**
3. Podesi:
   - **Command:** `curl https://vas-domen.rs/api/cron/waba-update`
   - **Schedule:** `0 12 * * *` (svaki dan u 12:00)
4. Kliknite **"Save"**

---

## 📊 7. Monitoring i Logovi

### Pristup Logovima
1. U Loopia panelu, idite na **"Loggar"** (Logs)
2. Možete videti:
   - **Error Logs** - greške aplikacije
   - **Access Logs** - pristup sajtu

### Ako imate SSH:
```bash
# PM2 logovi
pm2 logs kzk-partizan

# Nginx logovi
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## ✅ Checklist

- [ ] MongoDB Atlas cluster kreiran
- [ ] MongoDB user kreiran
- [ ] IP adresa whitelist-ovana
- [ ] Connection string dobijen
- [ ] Cloudinary nalog kreiran
- [ ] Cloudinary credentials dobijeni
- [ ] Sve environment varijable dodate u Loopia panel
- [ ] Fajlovi upload-ovani preko FTP
- [ ] Dependencies instalirane na serveru
- [ ] Aplikacija build-ovana
- [ ] Aplikacija pokrenuta
- [ ] Test kreiranje admin korisnika
- [ ] Test upload slike
- [ ] Test kreiranje vesti

---

## 🆘 Problemi i Rešenja

### Problem: "Cannot connect to MongoDB"
**Rešenje:**
- Proverite da li je IP adresa whitelist-ovana u MongoDB Atlas
- Proverite connection string u environment varijablama
- Proverite username i password

### Problem: "Cloudinary upload failed"
**Rešenje:**
- Proverite Cloudinary credentials
- Proverite da li imate dovoljno storage-a
- Proverite internet konekciju servera

### Problem: "Application won't start"
**Rešenje:**
- Proverite logove u Loopia panelu
- Proverite da li su sve environment varijable postavljene
- Proverite da li je `bun install` pokrenut
- Proverite da li je `bun run build` pokrenut

### Problem: "Port already in use"
**Rešenje:**
- Kontaktirajte Loopia podršku
- Ili promenite port u `package.json`

---

## 📞 Kontakt

Ako imate problema sa Loopia hosting-om:
- **Loopia Support:** [https://www.loopia.se/kontakt/](https://www.loopia.se/kontakt/)
- **Email:** support@loopia.se
- **Telefon:** Proverite na sajtu

---

**Napomena:** Ako Loopia ne podržava Node.js aplikacije, razmotrite alternativne hosting opcije kao što su Vercel, Netlify, ili DigitalOcean.


