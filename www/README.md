# Manava — www.manava.nl (nieuwe site)

Statische vervanging van de Webflow-site: pure HTML/CSS/JS, geen buildstap,
geen npm-afhankelijkheden, geen externe fonts of CDN's. Hosting is daarmee
gratis (GitHub Pages, Cloudflare Pages, Netlify) in plaats van ±€500/jaar
Webflow.

## Bestanden

| Bestand | Inhoud |
|---|---|
| `index.html` | Homepage: hero met 3D-partikelanimatie, partners, problemen, beloftes, diensten, referenties, checklists, contactformulier. |
| `hoe-we-te-werk-gaan.html` | Domeinen, "we bouwen mee", cases en het 4-stappenproces. |
| `over-ons.html` | De naam, werkwijze en het volledige team. |
| `medtadvies.html` | Case: van schaduwinnovatie naar gestructureerde AI-rapportage. |
| `sanofi.html` | Case: AI-diagnostiek bij Sanofi. |
| `artikelen.html` | Artikeloverzicht. |
| `artikelen/de-drie-schalingswetten-van-ai.html` | Artikel. |
| `assets/style.css` | Alle styling (huisstijl als CSS-variabelen bovenaan). |
| `assets/main.js` | Animaties (hero-canvas, scroll-reveals, 3D-tilt, nav) en het contactformulier. Respecteert `prefers-reduced-motion`. |
| `assets/algemene-voorwaarden-manava-bv.pdf` | Algemene voorwaarden (lokaal gehost, geen Webflow-CDN meer). |

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

- Het contactformulier heeft geen server en opent daarom het e-mailprogramma
  van de bezoeker met een vooringevuld bericht aan `info@manava.nl`
  (instelbaar in `assets/main.js`). Wil je echte formulier-inzendingen
  zonder mailprogramma, koppel dan een gratis dienst als Formspree of
  (bij hosting op Netlify) Netlify Forms: alleen het `action`-attribuut
  van het formulier aanpassen.
- Controleer of `info@manava.nl` het juiste adres is.
- Partnerlogo's staan er nu als getypografeerde namen. Echte beeldmerken
  toevoegen: zet SVG's/PNG's in `assets/logos/` en vervang de
  `<i>`-elementen in de partnersectie van `index.html` door
  `<img>`-tags.
- Cache-busting: bij wijzigingen in CSS/JS het versienummer in
  `?v=2` ophogen in alle HTML-bestanden.
