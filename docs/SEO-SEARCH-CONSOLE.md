# Google Search Console – KŽK Partizan

Kratko uputstvo za dodavanje sajta u Google Search Console i slanje sitemapa.

## Linkovi

- **Sitemap:** https://kzkpartizan1953.rs/sitemap.xml  
- **Robots.txt:** https://kzkpartizan1953.rs/robots.txt  

## Koraci

### 1. Dodavanje resursa (property)

1. Otvorite [Google Search Console](https://search.google.com/search-console).
2. Kliknite **„Dodaj resurs”** / **„Add Property”**.
3. Izaberite **„Prefiks URL-a”** / **„URL prefix”** i unesite: `https://kzkpartizan1953.rs` (ili `https://www.kzkpartizan1953.rs` ako koristite www).
4. Kliknite **„Nastavi”** / **„Continue”**.

### 2. Verifikacija vlasništva

- U projektu je u root layoutu već postavljen **HTML tag** za Google (polje `verification.google` u metadata).  
- U Search Console izaberite metodu **„HTML tag”** i uporedite tag sa onim u kodu; zatim kliknite **„Potvrdi”** / **„Verify”**.

### 3. Slanje sitemapa

1. U levom meniju izaberite **„Sitemaps”** / **„Mapa sajta”**.
2. U polje **„Dodaj novu mapu sajta”** unesite: `sitemap.xml`.
3. Kliknite **„Pošalji”** / **„Submit”**.

Status može biti „Uspešno” ili privremeno „Couldn't fetch” – oba su u redu ako je sitemap ispravan (XML na `/sitemap.xml`).

### 4. Zatraži indeksiranje (opciono)

1. Koristite **„URL Inspection”** / **„Provera URL-a”** (ikonica lupice).
2. Unesite URL (npr. `https://kzkpartizan1953.rs/` ili glavne stranice: `/klub`, `/tim`, `/vesti`, itd.).
3. Kliknite **„Test Live URL”**, pa zatim **„Request Indexing”** / **„Zatraži indeksiranje”**.

Google ograničava broj zahteva za indeksiranje (reda veličine ~10 dnevno), pa koristite prioritetno za početnu i najvažnije stranice.

### 5. Provera posle nekoliko dana

- **Coverage / Pokrivenost** – broj indeksiranih stranica i eventualne greške.
- **Sitemaps** – broj „Discovered URLs” za poslatu sitemap.
- Pretraga: `site:kzkpartizan1953.rs` na Google-u da vidite koje stranice su u indeksu.

## Tehnička provera

- **robots.txt:** Otvorite https://kzkpartizan1953.rs/robots.txt i proverite da postoje pravila za Googlebot, Bingbot, Twitterbot, facebookexternalhit i `*`, te red `Sitemap: https://kzkpartizan1953.rs/sitemap.xml`.
- **sitemap.xml:** Otvorite https://kzkpartizan1953.rs/sitemap.xml i proverite da se u listi nalaze početna, klub, tim, igraci, o-nama, galerija, vesti, kontakt i dinamičke vesti.

## Korisni linkovi

- [Google Search Console](https://search.google.com/search-console)
- [URL Inspection](https://search.google.com/search-console/inspect)
- [PageSpeed Insights](https://pagespeed.web.dev/)
- [Mobile-Friendly Test](https://search.google.com/test/mobile-friendly)
