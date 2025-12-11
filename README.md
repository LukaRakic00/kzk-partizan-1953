# KZK Partizan 1953 - Sajt

Kompletan sajt za Ženski Košarkaški Klub Partizan sa admin panelom za upravljanje sadržajem.

## Tehnologije

- Next.js 14 (App Router)
- TypeScript
- MongoDB
- Cloudinary
- Tailwind CSS
- Framer Motion

## Pokretanje

```bash
# Instaliraj dependencies
bun install

# Development server
bun run dev

# Production build
bun run build
bun start
```

## Konfiguracija

Kreiraj `.env` fajl sa sledećim varijablama:

```env
MONGODB_URI=mongodb://localhost:27017/kzk-partizan
JWT_SECRET=your-jwt-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Funkcionalnosti

- **Javne stranice**: Početna, Tim, Statut Kluba, Istorijat, Galerija, Novosti, Kontakt
- **Admin panel**: Upravljanje igračima, vestima, galerijom, istorijatom
- **Live tabela**: Automatsko ažuriranje rezultata iz WABA lige
- **Mečevi**: Prikaz predstojećih i proteklih mečeva

## Kreiranje Admin Korisnika

```bash
bun run scripts/add-admin.ts
```

Ili kroz API:
```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kzkpartizan.rs","password":"admin123"}'
```

## Deployment

### Provera Pre Deploy-a

Pre deployment-a, proverite da li je sve spremno:

```bash
bun run check-deployment
```

Ova skripta će proveriti:
- ✅ Sve obavezne environment varijable
- ✅ Format connection string-ova
- ✅ Cloudinary konfiguraciju
- ✅ Postojanje potrebnih fajlova

### Deployment na Loopia

Detaljne instrukcije za deployment na Loopia hosting:

1. **[LOOPIA_SETUP.md](./LOOPIA_SETUP.md)** - Kompletan vodič za podešavanje
   - MongoDB Atlas setup
   - Cloudinary konfiguracija
   - Environment varijable
   - Deployment koraci

2. **[LOOPIA_PANEL_GUIDE.md](./LOOPIA_PANEL_GUIDE.md)** - Detaljne instrukcije za Loopia panel
   - Kako dodati environment varijable
   - FTP upload fajlova
   - MongoDB Atlas setup korak po korak
   - Cloudinary setup

### Opšti Deployment Koraci

1. Postavi environment varijable (vidi [ENV_SETUP.md](./ENV_SETUP.md))
2. `bun run build`
3. `bun start`

### Alternativni Hosting Opcije

- **Vercel** (Preporučeno za Next.js) - [vercel.com](https://vercel.com)
- **Netlify** - [netlify.com](https://netlify.com)
- **DigitalOcean** - [digitalocean.com](https://digitalocean.com)
- **Loopia** - [loopia.se](https://loopia.se)
