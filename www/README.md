# Manava — www.manava.nl (nieuwe site)

Statische vervanging van de Webflow-site: pure HTML/CSS/JS, geen buildstap,
geen npm-afhankelijkheden, geen externe fonts of CDN's. Hosting is daarmee
gratis (GitHub Pages, Cloudflare Pages, Netlify) in plaats van ±€500/jaar
Webflow.

## Bestanden

| Bestand | Inhoud |
|---|---|
| `index.html` | Homepage: hero met 3D-partikelanimatie, diensten, aanpak, case, checklists, artikelen, over, contact. |
| `over-ons.html` | Over Manava en de oprichter. |
| `ai-rapportage.html` | Case: AI-rapportage in de spreekkamer. |
| `artikelen.html` | Artikeloverzicht. |
| `artikelen/de-drie-schalingswetten-van-ai.html` | Artikel. |
| `assets/style.css` | Alle styling (huisstijl als CSS-variabelen bovenaan). |
| `assets/main.js` | Animaties: hero-canvas, scroll-reveals, 3D-tilt, nav. Respecteert `prefers-reduced-motion`. |

## Lokaal bekijken

Open `index.html` in een browser, of serveer de map:

```
python3 -m http.server -d www
```

## Publiceren op www.manava.nl (GitHub Pages, gratis)

Deze repo servet al `intake.manava.nl` vanaf de root; één GitHub
Pages-site kan maar één custom domein hebben. Twee opties:

1. **Aparte repo (aanbevolen):** maak een repo `manava-www`, kopieer de
   inhoud van deze `www/`-map naar de root, voeg een `CNAME`-bestand toe met
   `www.manava.nl`, zet Pages aan. Wijs daarna in DNS `www` als CNAME naar
   `<gebruikersnaam>.github.io` en zet de apex (`manava.nl`) door naar `www`
   (of gebruik de vier GitHub Pages A-records). Zeg het Webflow-abonnement
   pas op nadat DNS is omgezet en alles werkt.
2. **Andere host:** upload de map naar Cloudflare Pages of Netlify en koppel
   het domein daar.

## Aandachtspunten

- Het e-mailadres in de contactsectie staat op `info@manava.nl` — controleer
  of dat het juiste adres is.
- Teksten zijn gereconstrueerd vanuit de bestaande site; loop ze na en pas
  aan waar gewenst. Alle content staat gewoon in de HTML-bestanden.
- Cache-busting: bij wijzigingen in CSS/JS het versienummer in
  `?v=1` ophogen in alle HTML-bestanden.
