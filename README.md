# AI-intakechecklist voor de zorg

Een publiek toegankelijke, statische webtool waarmee een zorgorganisatie per
AI- of softwaretool bepaalt wat er geregeld moet zijn vóórdat die tool in
gebruik wordt genomen en in het AI-register wordt opgenomen.

Bedoeld voor iedereen in de zorg, ook zonder voorkennis: praktijkmanagers,
teamleiders, bestuurders en zorgverleners. De gebruiker beantwoordt een
korte reeks vragen in gewone taal over één tool en krijgt:

1. **een oordeel bovenaan**: "Nog niet in gebruik nemen", "Nog niet gebruiken
   met echte patiëntgegevens" (met de ontbrekende voorwaarden) of "Je kunt
   verantwoord starten";
2. **een stappenplan per wie**: mail de leverancier, laat de FG of een
   privacyadviseur meekijken, regel het intern, eenmalig voor de organisatie,
   vastleggen en starten;
3. **afvinkbare punten**: vinkt de gebruiker een harde voorwaarde af, dan
   verschuift het oordeel mee.

De tool geeft **geen** juridisch oordeel, hij vertaalt antwoorden naar acties.

## Belangrijkste eigenschap: privacy

- Geen backend, geen database, geen accounts, geen cookies, geen analytics.
- Er worden **geen** antwoorden opgeslagen of verzonden: niet naar een server,
  niet naar `localStorage` of `sessionStorage`. De voortgang (antwoorden,
  vinkjes, optioneel toolnaam en leverancier) staat alleen in het `#`-deel van
  de URL. Dat deel stuurt een browser nooit naar een server; wie de link
  bewaart of deelt, deelt daarmee de antwoorden. Gegevens uit de link worden
  gevalideerd tegen de vragenlijst en uitsluitend als tekst getoond.
- Er wordt nergens om persoons- of patiëntgegevens gevraagd. Alleen de naam van
  de tool en de leverancier, en dat is optioneel.
- Na het laden doet de pagina **geen enkel netwerkverzoek**.

## Bestanden

| Bestand       | Inhoud                                                            |
|---------------|-------------------------------------------------------------------|
| `index.html`  | Homepage met uitleg en de twee checklists.                        |
| `intake.html` | De intakechecklist per tool: start-, vraag- en resultaatscherm.   |
| `styles.css`  | Alle styling, mobile first, inclusief een schone printstylesheet. |
| `app.js`      | Datablok (vragen + verplichtingen) **gescheiden** van de render.  |
| `praktijk.html` | Tweede pagina: praktijkchecklist voor de organisatiebrede basis. |
| `praktijk.js` | Datablok en render voor de praktijkchecklist.                     |
| `og.png`      | Voorvertoning voor gedeelde links (Open Graph, 1200 bij 630).     |
| `CNAME`       | Custom domein voor GitHub Pages (`intake.manava.nl`).             |
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

### 1. `STEPS`

De stappen van het stappenplan, in volgorde. Elke stap hoort bij een
`askAt`-waarde; een verplichting met die `askAt` valt in die stap. Titel en
intro mogen een functie van de antwoorden zijn (bijvoorbeeld "jullie FG" of
"een privacyadviseur").

### 2. `OBLIGATIONS`: de catalogus van te regelen artefacten

Elke verplichting heeft een unieke sleutel (`id`) en deze velden:

```js
ceVerklaring: {
  title: "Vraag de CE-markering en risicoklasse op",   // regel op de lijst, gewone taal
  note:  "Een tool die een medisch advies geeft ...",  // korte uitleg
  more:  "Dit volgt uit de MDR.",          // optioneel: achter "Meer uitleg"
  link:  { href: "...", label: "..." },    // optioneel: verdieping
  askAt: "leverancier",   // stap: leverancier | FG | eigen organisatie | organisatie | register | juridisch advies
  letter: "De CE-verklaring ...",          // formulering in de mail aan de leverancier
  redFlag: true,          // optioneel: bovenaan bij "Eerst uitzoeken"
}
```

### 3. `QUESTIONS`: de vragen

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

### 4b. `CONDITIONS`: harde voorwaarden

Zolang een voorwaarde geldt en het bijbehorende actiepunt niet is
afgevinkt, luidt het oordeel "Nog niet gebruiken met echte gegevens". Nu:
verwerkersovereenkomst (AVG art. 28), bevestigde opslaglocatie, toets bij
doorgifte buiten de EU (AVG hfst. V) en de beoordeling of een DPIA nodig is
(AVG art. 35). Rode vlaggen (`redFlag: true`) geven het strengere oordeel
"Nog niet in gebruik nemen".

FG-plicht volgens de Autoriteit Persoonsgegevens: altijd voor ziekenhuizen,
zorggroepen en huisartsenposten; voor andere zorgaanbieders bij meer dan
10.000 ingeschreven of jaarlijks behandelde patiënten van wie de gegevens in
één systeem staan.

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

### 6. `PROFILES`: voorbeeldprofielen op het startscherm

Vooringevulde antwoordensets als startpunt (generieke categorieën, geen
productnamen). Een profiel vult alleen de antwoorden vooraf in; de gebruiker
loopt daarna alle vragen gewoon na. Een profiel toevoegen is één regel:

```js
{ label: "Naam van het profiel", answers: { v1: "ja", v2: "nee", ... } }
```

### 7. `LETTER`: opvraagbrief voor de leverancier

Zodra minstens één actiepunt bij de leverancier ligt, biedt het
resultaatscherm een opvraagbrief aan (kopiëren of openen in het
e-mailprogramma). De punten in de brief volgen automatisch uit de intake:
alle toegekende verplichtingen met `askAt: "leverancier"`. In de brief wordt
per verplichting het `letter`-veld gebruikt: een formulering gericht aan de
leverancier ("Een verwerkersovereenkomst, met daarin ..."), niet de
gebruikersinstructie uit `note`. De vaste teksten (aanhef, intro, slot)
staan in `LETTER`.

### 8. `REGISTER_COLUMNS`: registerregel als CSV

De knop "Registerregel (CSV)" downloadt één regel voor het AI-register
(puntkomma-gescheiden, klaar voor Nederlandse Excel). De kolommen staan in
`REGISTER_COLUMNS`; elke kolom heeft een `label` en een `value(ctx)`-functie.
Kolommen toevoegen of hernoemen doe je alleen daar.

### 9. Praktijkchecklist (`praktijk.html` + `praktijk.js`)

Naast de intake per tool is er een organisatiebrede checklist: het centrale
register, leveranciersbeheer (verwerkersovereenkomsten, EU-datalocatie,
NEN 7510), menselijke eindverantwoordelijkheid, AI-geletterdheid, de
datalek- en incidentprocedure en de gemotiveerde FG- en FRIA-besluiten.
De punten staan in `PRAKTIJK_GROUPS` bovenaan `praktijk.js` (groepen met
items: `id`, `title`, `note`). Vinkjes leven alleen in het geheugen van de
pagina. De punten over FG en FRIA zijn bewust als uitgangspunt geformuleerd
("in beginsel", "laat bij twijfel toetsen"), niet als juridisch oordeel.

### Een vraag toevoegen: stappenplan

1. Voeg eventueel nieuwe verplichtingen toe aan `OBLIGATIONS`.
2. Voeg een object toe aan `QUESTIONS` met een uniek `id` en de gewenste
   opties/`grants`.
3. Klaar. De rendering, voortgang, resultaatgroepering, klembordtekst en print
   verwerken de nieuwe vraag automatisch.

## Deployen

Het is een set statische bestanden; elke statische host werkt.

- **Lokaal bekijken:** open `index.html` (homepage), `intake.html` of
  `praktijk.html` in een browser, of serveer de map met bijvoorbeeld
  `python3 -m http.server`.
- **Publiceren onder een subdomein van `manava.nl`:** upload alle bestanden
  naar de webroot van de host (of koppel de map aan bijvoorbeeld Netlify,
  Cloudflare Pages, GitHub Pages of een eigen webserver) en wijs het
  subdomein daarheen. Er is geen buildstap.
- **Cache-busting:** de HTML verwijst naar `styles.css?v=2` en `app.js?v=2`.
  Hoog dit versienummer op bij wijzigingen in CSS of JS, zodat browsers niet
  op een oude versie blijven hangen.

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
