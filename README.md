# AI-intakechecklist voor de zorg

Een publiek toegankelijke, statische webtool waarmee een zorgorganisatie per
AI- of softwaretool bepaalt wat er geregeld moet zijn vóórdat die tool in
gebruik wordt genomen en in het AI-register wordt opgenomen.

De gebruiker beantwoordt zeven korte vragen over één tool en krijgt een
concrete lijst met te regelen artefacten terug, gegroepeerd per thema. De tool
geeft **geen** juridisch oordeel, hij vertaalt antwoorden naar acties.

## Belangrijkste eigenschap: privacy

- Geen backend, geen database, geen accounts, geen cookies, geen analytics.
- Er worden **geen** antwoorden opgeslagen of verzonden: niet naar een server,
  niet naar `localStorage` of `sessionStorage`. De state leeft uitsluitend in
  het geheugen van de pagina en is weg zodra je ververst.
- Er wordt nergens om persoons- of patiëntgegevens gevraagd. Alleen de naam van
  de tool en de leverancier, en dat is optioneel.
- Na het laden doet de pagina **geen enkel netwerkverzoek**.

## Bestanden

| Bestand       | Inhoud                                                            |
|---------------|-------------------------------------------------------------------|
| `index.html`  | Semantische HTML: start-, vraag- en resultaatscherm.              |
| `styles.css`  | Alle styling, mobile first, inclusief een schone printstylesheet. |
| `app.js`      | Datablok (vragen + verplichtingen) **gescheiden** van de render.  |
| `README.md`   | Dit bestand.                                                      |

Geen buildstap, geen npm-afhankelijkheden, geen externe fonts of CDN's. Je kunt
`index.html` direct in een browser openen.

## Ontwerpkeuzes

- **Eén vraag per scherm (wizard), ook op desktop.** De doelgroep zit vaak op
  een telefoon en heeft weinig tijd; de voorwaardelijke logica leest natuurlijk
  als stappen; en het geeft een eerlijke voortgangsindicator. Eén consistente
  flow betekent ook minder code dan twee renderpaden onderhouden.
- **Mobile first**, ontworpen op 375px en opgeschaald.
- Toegankelijk: semantische HTML, `fieldset`/`legend` voor keuzes, labels aan
  inputs, zichtbare focus, volledige toetsenbordbediening, contrast conform
  WCAG AA. Nederlandstalig (`lang="nl"`).

## De vragen en verplichtingen aanpassen

Alle inhoud staat **bovenaan `app.js`**, boven de regel
`================  RENDERLOGICA`. Daaronder hoef je niets te wijzigen om vragen
toe te voegen of teksten te veranderen.

### 1. `THEMES`

De thema's waaronder artefacten op de eindlijst worden gegroepeerd, plus
`THEME_ORDER` voor de volgorde.

### 2. `OBLIGATIONS`: de catalogus van te regelen artefacten

Elke verplichting heeft een unieke sleutel (`id`) en deze velden:

```js
ceVerklaring: {
  theme: "medisch",              // sleutel uit THEMES
  title: "CE-verklaring en risicoklasse opvragen",   // regel op de lijst
  note:  "Zonder CE-markering ... niet in gebruik nemen.", // één regel uitleg
  askAt: "leverancier",          // bij wie: leverancier | FG | eigen organisatie | juridisch advies
  redFlag: true,                 // optioneel: apart en bovenaan tonen
}
```

De labels achter `askAt` staan in `ASK_AT_LABEL`. Voeg daar een sleutel toe als
je een nieuwe partij wilt gebruiken.

### 3. `QUESTIONS`: de zeven (of meer) vragen

```js
{
  id: "v3",                      // unieke sleutel; hieronder bewaren we het antwoord
  text: "Heeft de tool een medisch doel ...?",
  help: "Optionele toelichting onder de vraag.",
  type: "single",                // "single" (keuze) of "text" (vrij tekstveld)
  showIf: (a) => a.v1 === "ja",  // optioneel: toon vraag alleen als dit true is
  options: [
    { value: "ja",  label: "Ja",  grants: ["ceVerklaring", "validatie"] },
    { value: "twijfel", label: "Twijfel", grants: [], reask: true,
      explanation: "Uitleg; de vraag wordt opnieuw gesteld." },
    { value: "nee", label: "Nee", grants: ["eindverantwoordelijk"] },
  ],
  dynamicGrants: (a) => a.v6 === "ja" && a.v3 === "ja" ? ["inhouseMdr"] : [],
}
```

Betekenis van de velden per optie:

- **`grants`**: id's uit `OBLIGATIONS` die dit antwoord activeert.
- **`note`**: toelichting die verschijnt zodra dit antwoord wordt gekozen
  (bijvoorbeeld: “weet ik niet” telt als ja).
- **`reask` + `explanation`**: bij twijfel: toon uitleg en stel de vraag
  opnieuw; de gebruiker moet alsnog een definitief antwoord kiezen.

Op vraagniveau:

- **`showIf(answers)`**: voorwaardelijke vraag (bijvoorbeeld V2 alleen als er
  persoonsgegevens zijn). `answers` is een object met alle gegeven antwoorden,
  gesleuteld op vraag-`id`.
- **`dynamicGrants(answers)`**: extra verplichtingen op basis van álle
  antwoorden samen (bijvoorbeeld de MDR-toets alleen bij zelfbouw én een
  medisch doel).
- **`type: "text"`**: vrij tekstveld; het antwoord wordt als string bewaard en
  op het resultaat getoond. Gebruik `placeholder` voor een hint.

### 4. `ALWAYS`

Id's van verplichtingen die altijd gelden, ongeacht de antwoorden.

### 5. `DPIA_TEMPLATE`: de downloadbare DPIA-aanzet

Zodra de antwoorden een DPIA-toets opleveren (vraag 2 = ja), biedt het
resultaatscherm een download aan: een Word-document dat de indeling van het
Model DPIA Rijksdienst volgt (17 onderdelen), met de antwoorden uit de intake
alvast ingevuld waar dat kan. Open onderdelen zijn gemarkeerd met
`OPEN_MARKER` ("[Nog invullen door de praktijk]").

Elk onderdeel in `DPIA_TEMPLATE.sections`:

```js
{
  nr: 7,                          // nummer in het model
  title: "Verwerkingslocaties",   // titel van het onderdeel
  hint: "Waar worden de gegevens opgeslagen en verwerkt ...",  // invulinstructie
  prefill: (ctx) => [...],        // regels die we al kunnen invullen;
                                  // ctx = { answers, toolName, vendorName }
}
```

Het document wordt volledig in de browser opgebouwd (als HTML in een
`.doc`-bestand dat Word opent) en nergens heen gestuurd. Teksten wijzigen of
onderdelen toevoegen doe je uitsluitend in `DPIA_TEMPLATE`; de generator
(`buildDpiaHtml`) hoeft daarvoor niet aangepast te worden.

### Een vraag toevoegen: stappenplan

1. Voeg eventueel nieuwe verplichtingen toe aan `OBLIGATIONS`.
2. Voeg een object toe aan `QUESTIONS` met een uniek `id` en de gewenste
   opties/`grants`.
3. Klaar. De rendering, voortgang, resultaatgroepering, klembordtekst en print
   verwerken de nieuwe vraag automatisch.

## Deployen

Het is een set statische bestanden; elke statische host werkt.

- **Lokaal bekijken:** open `index.html` in een browser (dubbelklik), of serveer
  de map, bijvoorbeeld `python3 -m http.server`.
- **Publiceren onder een subdomein van `manava.nl`:** upload `index.html`,
  `styles.css` en `app.js` naar de webroot van de host (of koppel de map aan
  bijvoorbeeld Netlify, Cloudflare Pages, GitHub Pages of een eigen webserver)
  en wijs het subdomein daarheen. Er is geen buildstap.

### Huisstijlkleuren wijzigen

De kleuren staan als CSS-variabelen bovenaan `styles.css`. Groen is de rustige
merkkleur (koppen en structuur), steenrood is de actiekleur (knoppen, accenten,
rode vlaggen):

```css
:root {
  --green:      #1c3b31;   /* diep bosgroen: koppen, structuur */
  --green-dark: #12281f;   /* donkerder: hover, focus */
  --green-soft: #eef2ee;   /* lichte tint: geselecteerde staat, ok-vlak */

  --rust:       #9a3416;   /* steenrood: knoppen, accenten, aandacht */
  --rust-dark:  #7c2911;   /* donkerder: hover */
  --rust-soft:  #f6ebe5;   /* lichte tint: rode vlaggen, waarschuwing */
}
```

Pas deze waarden aan naar de exacte Manava-huisstijl; de rest van de interface
volgt automatisch. Koppen gebruiken een systeem-serif (`--serif`); ook die stel
je bovenaan `styles.css` in.

## Controleren (definition of done)

- Werkt zonder internetverbinding na het laden van de pagina.
- Volledig te doorlopen met alleen het toetsenbord.
- Leesbaar en bedienbaar op 375px breed.
- Printversie (Print of “opslaan als PDF”) past op maximaal twee A4'tjes en
  bevat de disclaimer.
- Geen netwerkverzoek na het laden: controleer dit in het netwerktabblad van
  de browser.
- Geen `localStorage`, geen `sessionStorage`, geen cookies.

## Wat het niet is

Dit is een hulpmiddel om te bepalen wat er geregeld moet worden. Het is geen
juridisch advies en geen vervanging van een DPIA. Een DPIA is een onderbouwd
oordeel over risico's en maatregelen en vraagt om een inhoudelijke beoordeling.

---

Een hulpmiddel van **Manava**, advies over AI en compliance in de zorg.
