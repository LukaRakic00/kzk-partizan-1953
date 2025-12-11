# Vodič za Podešavanje na Loopia Cloud Prostoru

Ovaj vodič će vam pomoći da deploy-ujete Next.js aplikaciju na Loopia hosting i podesite sve potrebne servise.

## 🚀 Brzi Start

**Najvažnije stvari koje treba da uradite:**

1. **MongoDB Atlas** (Besplatno) - [Kreiraj nalog](https://www.mongodb.com/cloud/atlas)
   - Kreiraj cluster, user, i whitelist IP adresu
   - Uzmi connection string

2. **Cloudinary** (Besplatno) - [Kreiraj nalog](https://cloudinary.com)
   - Uzmi Cloud Name, API Key, i API Secret

3. **Loopia Panel** - Dodaj environment varijable
   - Vidi [LOOPIA_PANEL_GUIDE.md](./LOOPIA_PANEL_GUIDE.md) za detaljne korake

4. **Deploy aplikacije** - Upload fajlova i pokreni

**Proverite pre deploy-a:**
```bash
bun run check-deployment
```

---

## 📋 Pregled Arhitekture

Vaša aplikacija trenutno koristi:
- **MongoDB** - za bazu podataka
- **Cloudinary** - za skladištenje slika
- **Next.js** - Node.js framework

## 🎯 Opcije za Deploy na Loopia

### Opcija 1: Loopia Web Hosting (Preporučeno ako imate Node.js podršku)

**Proverite da li Loopia podržava Node.js:**
1. Ulogujte se na Loopia panel
2. Proverite da li imate pristup Node.js aplikacijama
3. Ako imate, možete deploy-ovati Next.js direktno

**Koraci:**
1. Build aplikacije lokalno:
   ```bash
   bun run build
   ```

2. Upload fajlova preko FTP/SFTP:
   - Upload-ujte `.next` folder
   - Upload-ujte `node_modules` (ili instalirajte na serveru)
   - Upload-ujte `package.json`
   - Upload-ujte `public` folder
   - Upload-ujte sve ostale fajlove

3. Na serveru pokrenite:
   ```bash
   bun install --production
   bun start
   ```

---

### Opcija 2: Loopia Cloud Server (VPS)

Ako imate Loopia Cloud Server (VPS), možete instalirati sve potrebno:

**Koraci:**
1. **SSH pristup serveru**
2. **Instaliraj Node.js i Bun:**
   ```bash
   # Instaliraj Node.js 20+
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Instaliraj Bun
   curl -fsSL https://bun.sh/install | bash
   ```

3. **Kloniraj ili upload-uj projekat:**
   ```bash
   cd /var/www
   git clone <your-repo> kzk-partizan
   cd kzk-partizan
   bun install
   ```

4. **Podesi environment varijable:**
   ```bash
   nano .env
   ```

5. **Build i pokreni:**
   ```bash
   bun run build
   bun start
   ```

6. **Podesi PM2 za auto-restart:**
   ```bash
   npm install -g pm2
   pm2 start bun --name "kzk-partizan" -- start
   pm2 save
   pm2 startup
   ```

---

## 🗄️ Baza Podataka - MongoDB

**VAŽNO:** Loopia ne nudi MongoDB hosting direktno. Imate dve opcije:

### Opcija A: MongoDB Atlas (Preporučeno - Besplatno)

1. **Kreiraj nalog na [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**
2. **Kreiraj novi cluster:**
   - Izaberi besplatni tier (M0)
   - Izaberi region blizu Srbije (npr. Frankfurt)
3. **Kreiraj database user:**
   - Username i password
4. **Dodaj IP adresu:**
   - Za development: `0.0.0.0/0` (sve IP adrese)
   - Za production: dodaj IP adresu Loopia servera
5. **Uzmi connection string:**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/kzk-partizan
   ```

6. **Dodaj u `.env`:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kzk-partizan
   ```

### Opcija B: MongoDB na Loopia VPS Serveru

Ako imate VPS, možete instalirati MongoDB:

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y mongodb

# Pokreni MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# Connection string
MONGODB_URI=mongodb://localhost:27017/kzk-partizan
```

---

## 📁 Skladištenje Fajlova

### Opcija 1: Zadržati Cloudinary (Preporučeno)

Cloudinary je najbolja opcija jer:
- Automatska optimizacija slika
- CDN distribucija
- Besplatni plan (25GB storage, 25GB bandwidth)
- Ne zahteva dodatnu konfiguraciju

**Samo nastavite da koristite postojeće Cloudinary credentials.**

### Opcija 2: Loopia Cloud Storage

Ako želite da koristite Loopia cloud storage umesto Cloudinary:

**1. Podesi Loopia Cloud Storage:**
   - U Loopia panelu, aktiviraj Cloud Storage
   - Kreiraj bucket/folder za slike
   - Uzmi pristupne podatke (API key, endpoint)

**2. Kreiraj novi upload handler:**

Kreiraj fajl `lib/loopia-storage.ts`:
```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  endpoint: process.env.LOOPIA_STORAGE_ENDPOINT,
  region: process.env.LOOPIA_STORAGE_REGION,
  credentials: {
    accessKeyId: process.env.LOOPIA_STORAGE_ACCESS_KEY!,
    secretAccessKey: process.env.LOOPIA_STORAGE_SECRET_KEY!,
  },
});

export const uploadToLoopia = async (
  file: File,
  folder: string
): Promise<{ url: string; key: string }> => {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  
  const fileName = `${Date.now()}-${file.name}`;
  const key = `KZK_Partizan/${folder}/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.LOOPIA_STORAGE_BUCKET!,
    Key: key,
    Body: buffer,
    ContentType: file.type,
  });
  
  await s3Client.send(command);
  
  const url = `${process.env.LOOPIA_STORAGE_PUBLIC_URL}/${key}`;
  
  return { url, key };
};
```

**3. Ažuriraj `app/api/upload/route.ts`:**
```typescript
import { uploadToLoopia } from '@/lib/loopia-storage';
// ili zadrži Cloudinary
```

**Napomena:** Ovo zahteva dodatnu konfiguraciju i promene u kodu. Preporučujem da zadržite Cloudinary.

---

## 🔐 Environment Varijable na Loopia

### Način 1: Preko Loopia Panela

1. Ulogujte se na Loopia panel
2. Idite na **Web Hosting** → **Vaš domen** → **Environment Variables**
3. Dodajte sledeće varijable:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kzk-partizan
JWT_SECRET=your-super-secret-jwt-key-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_API_URL=https://vas-domen.rs
MONGO_DB=KZKPartizanDB
```

### Način 2: Preko `.env` fajla (ako imate SSH pristup)

```bash
cd /var/www/kzk-partizan
nano .env
```

Dodajte sve varijable kao gore.

---

## 🚀 Deployment Koraci

### 1. Priprema Lokalno

```bash
# Build aplikacije
bun run build

# Testiraj production build
bun start
```

### 2. Upload na Loopia

**Preko FTP/SFTP:**
- Koristite FileZilla ili WinSCP
- Upload-ujte sve fajlove osim:
  - `node_modules` (instalirajte na serveru)
  - `.next` (build-ujte na serveru ili upload-ujte)
  - `.env` (kreirajte na serveru)

**Preko Git (ako imate SSH):**
```bash
ssh user@loopia-server
cd /var/www
git clone <your-repo> kzk-partizan
cd kzk-partizan
bun install --production
bun run build
```

### 3. Pokretanje na Serveru

**Direktno:**
```bash
bun start
```

**Sa PM2 (preporučeno):**
```bash
pm2 start bun --name "kzk-partizan" -- start
pm2 save
```

### 4. Podešavanje Nginx (ako imate VPS)

Kreiraj `/etc/nginx/sites-available/kzk-partizan`:
```nginx
server {
    listen 80;
    server_name vas-domen.rs www.vas-domen.rs;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktiviraj:
```bash
sudo ln -s /etc/nginx/sites-available/kzk-partizan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. SSL Certifikat (Let's Encrypt)

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d vas-domen.rs -d www.vas-domen.rs
```

---

## 📊 Monitoring i Backup

### MongoDB Backup

**MongoDB Atlas:**
- Automatski backup je uključen u plaćenim planovima
- Za besplatni plan, koristite `mongodump`:

```bash
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/kzk-partizan" --out=/backup
```

**Lokalni MongoDB:**
```bash
mongodump --db=kzk-partizan --out=/backup
```

### Aplikacija Backup

```bash
# Backup koda
tar -czf kzk-partizan-backup-$(date +%Y%m%d).tar.gz /var/www/kzk-partizan

# Backup baze
mongodump --uri="$MONGODB_URI" --out=/backup/mongodb-$(date +%Y%m%d)
```

---

## 🔧 Troubleshooting

### Problem: "Cannot find module"
**Rešenje:**
```bash
cd /var/www/kzk-partizan
rm -rf node_modules .next
bun install
bun run build
```

### Problem: "MongoDB connection failed"
**Rešenje:**
- Proverite da li je MongoDB Atlas cluster aktivan
- Proverite da li je IP adresa dodata u whitelist
- Proverite connection string u `.env`

### Problem: "Port 3000 already in use"
**Rešenje:**
```bash
# Pronađi proces
lsof -i :3000

# Ubij proces
kill -9 <PID>

# Ili promeni port u package.json
```

### Problem: "Cloudinary upload failed"
**Rešenje:**
- Proverite Cloudinary credentials
- Proverite da li imate dovoljno storage-a
- Proverite internet konekciju servera

---

## 📝 Checklist za Deploy

- [ ] MongoDB Atlas cluster kreiran i konfigurisan
- [ ] Environment varijable postavljene na Loopia
- [ ] Aplikacija build-ovana lokalno i testirana
- [ ] Fajlovi upload-ovani na server
- [ ] `bun install` pokrenut na serveru
- [ ] `bun run build` pokrenut na serveru
- [ ] Aplikacija pokrenuta (direktno ili preko PM2)
- [ ] Nginx konfigurisan (ako imate VPS)
- [ ] SSL certifikat instaliran
- [ ] Admin korisnik kreiran
- [ ] Test upload slike
- [ ] Test kreiranje vesti/igrača

---

## 💡 Preporuke

1. **Koristite MongoDB Atlas** - najlakše i najsigurnije
2. **Zadržite Cloudinary** - najbolja opcija za slike
3. **Koristite PM2** - za auto-restart aplikacije
4. **Podesite cron job** - za automatske backup-e
5. **Monitorujte logove:**
   ```bash
   pm2 logs kzk-partizan
   ```

---

## 📞 Podrška

Ako imate problema:
1. Proverite logove aplikacije
2. Proverite MongoDB connection
3. Proverite environment varijable
4. Kontaktirajte Loopia podršku za hosting specifične probleme

---

**Napomena:** Ovaj vodič pretpostavlja da imate pristup Node.js na Loopia hosting-u. Ako Loopia ne podržava Node.js, razmotrite:
- Migraciju na Vercel (besplatno za Next.js)
- Migraciju na DigitalOcean/Linode VPS
- Koristiti Loopia samo za statičke fajlove i deploy-ovati Next.js negde drugde

