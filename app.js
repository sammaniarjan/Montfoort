"use strict";
/* =========================================================================
   AI-INTAKECHECKLIST VOOR DE ZORG
   -------------------------------------------------------------------------
   Alles draait client-side. Er wordt niets opgeslagen (geen localStorage,
   sessionStorage of cookies) en niets verzonden. De voortgang staat alleen
   in het #-deel van de URL van deze pagina; dat deel stuurt een browser
   nooit naar een server.

   DATA-BLOK  (dit deel pas je aan om vragen of teksten te wijzigen)
   RENDER     (dit deel hoef je niet aan te raken)
   ========================================================================= */


/* -------------------------------------------------------------------------
   1. STAPPEN: waaronder de actiepunten op het resultaat worden gegroepeerd.
   Elke verplichting heeft een `askAt`; die bepaalt in welke stap hij valt.
   "juridisch advies" valt niet in een stap: die punten staan bovenaan bij
   "Eerst uitzoeken".
   ------------------------------------------------------------------------- */
const STEPS = [
  { askAt: "leverancier",
    title: "Mail de leverancier",
    intro: "Deze punten vraag je in één keer op. De mail hieronder zet ze voor je op een rij." },
  { askAt: "FG",
    title: (a) => a.fg === "ja" ? "Laat jullie FG meekijken" : "Laat een privacyadviseur meekijken",
    intro: (a) => a.fg === "ja"
      ? "Je functionaris gegevensbescherming (FG) beoordeelt deze punten."
      : "Heeft jullie organisatie geen FG? Vraag dan een privacyadviseur om deze punten te beoordelen." },
  { askAt: "eigen organisatie",
    title: "Regel het binnen jullie organisatie",
    intro: "Afspraken die je zelf maakt en kort vastlegt." },
  { askAt: "organisatie",
    title: "Eenmalig voor de hele organisatie",
    intro: "Dit regel je één keer, niet per tool. De praktijkchecklist helpt je verder." },
  { askAt: "register",
    title: "Vastleggen en starten",
    intro: "Leg de tool vast. Daarna kun je verantwoord beginnen." },
];


/* -------------------------------------------------------------------------
   2. VERPLICHTINGEN (actiepunten)
   Eén catalogus, verwijzingen via id.
     title   : de regel op de lijst, in gewone taal
     note    : één of twee zinnen uitleg
     more    : optioneel; achtergrond, wetsartikel, tips (achter "Meer uitleg")
     link    : optioneel; { href, label } voor verdieping
     askAt   : leverancier | FG | eigen organisatie | organisatie | register
               | juridisch advies
     letter  : formulering voor de mail aan de leverancier
     redFlag : true = apart en bovenaan, tool nog niet in gebruik nemen
   ------------------------------------------------------------------------- */
const OBLIGATIONS = {
  // --- Bij de leverancier ---
  verwerkersovereenkomst: {
    title: "Sluit een privacycontract met de leverancier (verwerkersovereenkomst)",
    note: "Hierin spreek je af wat de leverancier met jullie gegevens mag doen en hoe hij ze beschermt. Leveranciers hebben vaak een standaardversie: vraag erom.",
    more: "Verplicht onder de AVG (artikel 28) zodra een leverancier persoonsgegevens voor jullie verwerkt. Zonder dit contract mag je geen persoonsgegevens in de tool stoppen.",
    askAt: "leverancier",
    letter: "Een verwerkersovereenkomst, met daarin welke gegevens u voor ons verwerkt en onder welke voorwaarden.",
  },
  hostinglocatie: {
    title: "Laat de leverancier bevestigen waar de gegevens staan",
    note: "Vraag schriftelijk in welk land de gegevens worden opgeslagen en verwerkt.",
    more: "Blijkt het buiten de EU te zijn? Pas dan je antwoord bij die vraag aan; dan komt er een extra stap bij.",
    askAt: "leverancier",
    letter: "Een schriftelijke bevestiging van het land of de landen waar de gegevens worden opgeslagen en verwerkt.",
  },
  training: {
    title: "Vraag of jullie gegevens worden gebruikt om de AI te trainen",
    note: "Sommige leveranciers gebruiken wat je invoert om hun AI te verbeteren. Met patiëntgegevens wil je dat niet, of alleen met duidelijke afspraken.",
    askAt: "leverancier",
    letter: "Een bevestiging of de gegevens die wij invoeren worden bewaard of gebruikt om (AI-)modellen te trainen, en zo ja, hoe wij dat kunnen uitzetten.",
  },
  subverwerkers: {
    title: "Vraag welke andere bedrijven de leverancier inschakelt",
    note: "Leveranciers werken vaak zelf weer met andere partijen, bijvoorbeeld voor de opslag of het AI-model. Je hebt recht op die lijst.",
    more: "In AVG-termen heten dit subverwerkers.",
    askAt: "leverancier",
    letter: "Een actuele lijst van de partijen (subverwerkers) die u inschakelt bij de verwerking van onze gegevens.",
  },
  nen7510: {
    title: "Vraag naar het beveiligingscertificaat van de leverancier",
    note: "Vraag of de leverancier aantoonbaar goed is beveiligd. In de zorg is NEN 7510 de norm; ISO 27001 is de internationale variant.",
    askAt: "leverancier",
    letter: "Een geldig certificaat of aantoonbare naleving van NEN 7510 of ISO 27001 voor uw informatiebeveiliging.",
  },
  ceVerklaring: {
    title: "Vraag de CE-markering en risicoklasse op",
    note: "Een tool die een medisch advies of uitkomst geeft, is een medisch hulpmiddel en moet een CE-markering hebben. Zonder CE-markering: niet in gebruik nemen.",
    more: "Dit volgt uit de Europese regels voor medische hulpmiddelen (MDR).",
    askAt: "leverancier",
    letter: "De CE-verklaring van de tool als medisch hulpmiddel en de bijbehorende risicoklasse.",
    redFlag: true,
  },
  ceBekend: {
    title: "Bewaar de CE-verklaring en noteer de risicoklasse",
    note: "De CE-markering is bekend. Vraag de verklaring op als je die nog niet hebt, en zet de risicoklasse in je AI-overzicht.",
    askAt: "leverancier",
    letter: "De CE-verklaring van de tool en de bijbehorende risicoklasse, ter vastlegging in ons register.",
  },
  validatie: {
    title: "Vraag of de tool getest is bij patiënten zoals de jouwe",
    note: "Een tool die goed werkt in een buitenlands ziekenhuis, werkt niet vanzelf goed bij jullie. Vraag naar resultaten in een vergelijkbare Nederlandse patiëntengroep.",
    more: "Let op: een hoge 'accuracy' zegt weinig als de aandoening bij jullie zeldzaam is. Dan kan het merendeel van de alarmen alsnog loos zijn.",
    link: { href: "https://www.manava.nl/accuracy-uitgelegd.html", label: "Lees: hoe goed is 99% accuraat?" },
    askAt: "leverancier",
    letter: "Validatiegegevens van de tool in een Nederlandse patiëntengroep die vergelijkbaar is met de onze, of een toelichting als die er niet zijn.",
  },

  // --- Met de FG of een privacyadviseur ---
  dpia: {
    title: "Laat beoordelen of een DPIA nodig is, en voer hem zo nodig uit",
    note: "Een DPIA is een risicoanalyse voor privacy. Bij gezondheidsgegevens en nieuwe technologie zoals AI is die vaak verplicht, en moet hij klaar zijn vóórdat je begint.",
    more: "AVG artikel 35. Hieronder kun je een aanzet downloaden met je antwoorden alvast ingevuld.",
    askAt: "FG",
  },
  doorgiftetoets: {
    title: "Laat toetsen of de gegevens buiten de EU mogen",
    note: "Gegevens naar een land buiten de EU sturen mag alleen met extra waarborgen. Laat dit beoordelen voordat je begint.",
    more: "AVG hoofdstuk V. Voor de Verenigde Staten kan het EU-US Data Privacy Framework gelden, als de leverancier daarvoor is aangemeld.",
    askAt: "FG",
  },
  grondslag: {
    title: "Leg vast waarom je de gegevens mag gebruiken en hoe lang je ze bewaart",
    note: "Schrijf in een paar zinnen op waarvoor de tool gegevens gebruikt, en wanneer ze weer worden verwijderd.",
    more: "In AVG-termen: de grondslag (artikel 6 en 9) en de bewaartermijn. Bij zorgverlening hangt de grondslag meestal samen met de behandelrelatie; laat dit bij twijfel bevestigen.",
    askAt: "FG",
  },

  // --- Binnen de eigen organisatie ---
  verwerkingsregister: {
    title: "Zet de tool in jullie verwerkingsregister",
    note: "Dat is de lijst waarin jullie bijhouden welke persoonsgegevens waarvoor worden gebruikt. Voeg deze tool eraan toe.",
    more: "Verplicht onder de AVG (artikel 30). Nog geen register? Dat staat in de praktijkchecklist.",
    askAt: "eigen organisatie",
  },
  beveiliging: {
    title: "Bepaal wie in de tool mag en hoe die is beveiligd",
    note: "Wie krijgt een account, met welke rechten? Staat inloggen in twee stappen aan? Leg het kort vast.",
    more: "Gezondheidsgegevens vragen extra beveiliging (AVG artikel 32).",
    askAt: "eigen organisatie",
  },
  eindverantwoordelijk: {
    title: "Spreek af dat een zorgverlener de uitkomst altijd controleert",
    note: "De tool doet een voorstel; een mens blijft verantwoordelijk. Leg vast wie controleert en hoe.",
    askAt: "eigen organisatie",
  },
  aiGeletterdheid: {
    title: "Leg collega's uit wat de tool wel en niet kan",
    note: "Wie met de tool werkt, moet weten waar hij goed in is, waar hij fouten maakt en wat je altijd zelf moet nakijken.",
    more: "Verplicht onder de AI-verordening (AI Act, artikel 4: AI-geletterdheid), sinds februari 2025.",
    askAt: "eigen organisatie",
  },
  transparantieAi: {
    title: "Vertel patiënten dat ze met AI te maken hebben",
    note: "Bijvoorbeeld met een korte zin bij de chatbot of onder de brief: 'Deze tekst is mede opgesteld met behulp van AI.'",
    more: "Verplicht onder de AI-verordening (AI Act, artikel 50).",
    askAt: "eigen organisatie",
  },
  dossierVermelding: {
    title: "Spreek af hoe je AI-gebruik in het dossier noteert",
    note: "Zo is later terug te zien bij welke patiënt en waarvoor AI is gebruikt.",
    askAt: "eigen organisatie",
  },

  // --- Eenmalig voor de organisatie ---
  fgCheck: {
    title: "Ga na of jullie organisatie een FG moet hebben",
    note: "Een functionaris gegevensbescherming (FG) houdt binnen de organisatie toezicht op privacy. Niet elke zorgorganisatie is verplicht er een te hebben.",
    more: "Volgens de Autoriteit Persoonsgegevens moeten ziekenhuizen, zorggroepen en huisartsenposten altijd een FG hebben. Andere zorgaanbieders moeten dat als ze meer dan 10.000 patiënten ingeschreven hebben of gemiddeld meer dan 10.000 patiënten per jaar behandelen, en die gegevens in één systeem staan. Leg je besluit vast.",
    link: { href: "https://autoriteitpersoonsgegevens.nl/nl/onderwerpen/gezondheid/zorgverleners-en-de-avg", label: "Uitleg van de Autoriteit Persoonsgegevens" },
    askAt: "organisatie",
  },

  // --- Vastleggen ---
  aiRegister: {
    title: "Zet de tool in jullie AI-overzicht (AI-register)",
    note: "Een simpel overzicht van alle AI-tools in de organisatie: wat, waarvoor en wie de eigenaar is. Hieronder kun je de regel voor deze tool downloaden.",
    askAt: "register",
  },
  eigenaarEvaluatie: {
    title: "Kies een eigenaar en een datum om de tool opnieuw te bekijken",
    note: "Bijvoorbeeld over een jaar: werkt hij nog goed, en is er iets veranderd bij de leverancier?",
    askAt: "register",
  },

  // --- Eerst juridisch uitzoeken ---
  inhouseMdr: {
    title: "Laat juridisch toetsen of je een zelfgebouwde medische tool mag inzetten",
    note: "Zelf bouwen of flink aanpassen met een medisch doel valt onder strenge regels. Er is een uitzondering voor eigen gebruik, maar die heeft voorwaarden.",
    more: "Het gaat om de zogeheten in-house uitzondering uit de MDR (artikel 5 lid 5).",
    askAt: "juridisch advies",
    redFlag: true,
  },
  aanbiedersrol: {
    title: "Laat juridisch uitzoeken of jullie 'aanbieder' van de AI worden",
    note: "Wie een AI-tool zelf bouwt, of flink aanpast en onder eigen naam gebruikt, krijgt onder de AI-verordening zwaardere plichten dan een gewone gebruiker.",
    askAt: "juridisch advies",
    redFlag: true,
  },
};


/* -------------------------------------------------------------------------
   3. VRAGEN
     id            : unieke sleutel; onder deze sleutel bewaren we het antwoord
     text          : de vraag
     help          : optionele toelichting onder de vraag
     type          : "single" (keuze) of "text" (vrij tekstveld)
     showIf(a)     : optioneel; toon de vraag alleen als dit true is
     options[]     : { value, label, grants[], note?, reask?, explanation? }
     dynamicGrants(a): optioneel; extra verplichtingen op basis van alle antwoorden
   ------------------------------------------------------------------------- */
const personalData = (a) => a.v1 === "ja" || a.v1 === "weet-niet";

const QUESTIONS = [
  {
    id: "v1",
    text: "Gaat er informatie over mensen in de tool?",
    help: "Denk aan namen, geboortedata, gesprekken, verslagen, foto's of e-mails. Ook zonder naam is informatie vaak nog terug te leiden naar een persoon.",
    type: "single",
    options: [
      { value: "ja", label: "Ja",
        grants: ["verwerkersovereenkomst", "training", "verwerkingsregister", "grondslag", "nen7510", "subverwerkers"] },
      { value: "weet-niet", label: "Weet ik niet",
        grants: ["verwerkersovereenkomst", "training", "verwerkingsregister", "grondslag", "nen7510", "subverwerkers"],
        note: "Dan gaan we uit van ja. Zodra er tekst uit de zorg in de tool gaat, gaat het bijna altijd om informatie over mensen." },
      { value: "nee", label: "Nee", grants: [] },
    ],
  },
  {
    id: "v2",
    text: "Gaat het om patiënten of cliënten, of om iemands gezondheid?",
    showIf: personalData,
    type: "single",
    options: [
      { value: "ja", label: "Ja", grants: ["dpia", "beveiliging"] },
      { value: "nee", label: "Nee, bijvoorbeeld alleen over medewerkers", grants: [] },
    ],
  },
  {
    id: "vo",
    text: "Is er al een privacycontract met de leverancier getekend?",
    help: "Dit heet een verwerkersovereenkomst. Hierin spreek je af wat de leverancier met jullie gegevens mag doen.",
    showIf: personalData,
    type: "single",
    options: [
      { value: "ja", label: "Ja, die is getekend", grants: [] },
      { value: "nee", label: "Nee, nog niet", grants: [] },
      { value: "weet-niet", label: "Weet ik niet", grants: [],
        note: "Dan gaan we ervan uit dat die er nog niet is. Vraag het na bij wie de tool heeft ingekocht." },
    ],
  },
  {
    id: "v3",
    text: "Geeft de tool een advies of uitkomst over de gezondheid van een patiënt?",
    help: "Bijvoorbeeld een diagnose, een risicoscore, een triage-uitkomst of een behandeladvies. Een gesprek samenvatten of een brief schrijven telt niet.",
    type: "single",
    options: [
      { value: "ja", label: "Ja", grants: ["validatie"] },
      { value: "twijfel", label: "Twijfel", grants: [], reask: true,
        explanation: "Het gaat om wat de tool doet. Geen medisch doel: een consult samenvatten of een brief opstellen. Wel een medisch doel: advies over vervolgbeleid, een risicoscore of een triage-uitkomst. Kies op basis hiervan opnieuw." },
      { value: "nee", label: "Nee", grants: [] },
    ],
  },
  {
    id: "v3a",
    text: "Heeft de tool een CE-markering als medisch hulpmiddel, en weet je de risicoklasse?",
    help: "Staat vaak op de website of in de documentatie van de leverancier, bijvoorbeeld als 'CE klasse IIa'.",
    showIf: (a) => a.v3 === "ja",
    type: "single",
    options: [
      { value: "ja", label: "Ja, inclusief risicoklasse", grants: ["ceBekend"],
        note: "Dan is dit geen blokkade. Bewaar de CE-verklaring en noteer de risicoklasse." },
      { value: "nee", label: "Nee, of weet ik niet", grants: ["ceVerklaring"],
        note: "Zolang dat niet bevestigd is: niet in gebruik nemen. De vraag komt in de mail aan de leverancier." },
    ],
  },
  {
    id: "v4",
    text: "Ziet of leest de patiënt iets wat de tool maakt?",
    help: "Bijvoorbeeld een chatbot op de website, of een brief of uitslag die de tool (mede) schrijft.",
    type: "single",
    options: [
      { value: "ja", label: "Ja", grants: ["transparantieAi", "dossierVermelding"] },
      { value: "nee", label: "Nee", grants: [] },
    ],
  },
  {
    id: "v5",
    text: "Weet je waar de leverancier de gegevens bewaart?",
    help: "Staat vaak in de verwerkersovereenkomst of de privacyverklaring van de leverancier. Weet je het niet? Geen probleem: dan komt de vraag in de mail aan de leverancier.",
    showIf: personalData,
    type: "single",
    options: [
      { value: "binnen-eu", label: "Ja, binnen de EU", grants: [] },
      { value: "buiten-eu", label: "Ja, (ook) buiten de EU", grants: ["hostinglocatie", "doorgiftetoets"] },
      { value: "onbekend", label: "Weet ik niet", grants: ["hostinglocatie"] },
    ],
  },
  {
    id: "v6",
    text: "Heeft jullie organisatie de tool zelf gebouwd, of flink aangepast en onder eigen naam in gebruik?",
    help: "Voor de meeste organisaties is het antwoord nee: je koopt een tool van een leverancier en gebruikt hem zoals hij is.",
    type: "single",
    options: [
      { value: "nee", label: "Nee", grants: [] },
      { value: "ja", label: "Ja", grants: ["aanbiedersrol"] },
    ],
    dynamicGrants: (a) => (a.v6 === "ja" && a.v3 === "ja") ? ["inhouseMdr"] : [],
  },
  {
    id: "fg",
    text: "Heeft jullie organisatie een functionaris gegevensbescherming (FG)?",
    help: "Een FG houdt binnen de organisatie toezicht op privacy. Ziekenhuizen, zorggroepen en huisartsenposten hebben er altijd een; kleinere praktijken vaak niet.",
    showIf: personalData,
    type: "single",
    options: [
      { value: "ja", label: "Ja", grants: [] },
      { value: "nee", label: "Nee", grants: ["fgCheck"] },
      { value: "weet-niet", label: "Weet ik niet", grants: ["fgCheck"] },
    ],
  },
  {
    id: "v7",
    text: "Wie wordt eigenaar van deze tool binnen jullie organisatie?",
    help: "Optioneel. Vul alleen een rol in, bijvoorbeeld 'praktijkmanager' of 'teamleider'. Geen namen.",
    type: "text",
    placeholder: "Bijvoorbeeld: praktijkmanager",
  },
];

// Het privacycontract staat op de lijst, behalve als het al getekend is.
const VO_ID = "verwerkersovereenkomst";


/* -------------------------------------------------------------------------
   4. ALTIJD: verplichtingen die gelden ongeacht de antwoorden
   ------------------------------------------------------------------------- */
const ALWAYS = ["aiGeletterdheid", "eindverantwoordelijk", "aiRegister", "eigenaarEvaluatie"];


/* -------------------------------------------------------------------------
   5. HARDE VOORWAARDEN
   Zolang deze open staan, is het oordeel: nog niet gebruiken met echte
   gegevens. Elke voorwaarde hoort bij een actiepunt; vink je dat af, dan
   vervalt de voorwaarde.
     when(a) : geldt deze voorwaarde bij deze antwoorden?
     id      : het bijbehorende actiepunt
     text    : wat er nog ontbreekt, in gewone taal
   ------------------------------------------------------------------------- */
const CONDITIONS = [
  { id: "verwerkersovereenkomst",
    when: (a) => personalData(a) && a.vo !== "ja",
    text: "Er is nog geen privacycontract (verwerkersovereenkomst) met de leverancier." },
  { id: "hostinglocatie",
    when: (a) => personalData(a) && a.v5 === "onbekend",
    text: "Het is nog niet bevestigd waar de gegevens worden bewaard." },
  { id: "doorgiftetoets",
    when: (a) => personalData(a) && a.v5 === "buiten-eu",
    text: "De gegevens gaan (ook) buiten de EU. Laat eerst toetsen of dat mag." },
  { id: "dpia",
    when: (a) => personalData(a) && a.v2 === "ja",
    text: "Er is nog niet beoordeeld of een DPIA (privacy-risicoanalyse) nodig is." },
];


/* -------------------------------------------------------------------------
   6. DPIA-AANZET
   Wordt aangeboden zodra het actiepunt "dpia" op de lijst staat. De indeling
   volgt het Model DPIA Rijksdienst. Per onderdeel:
     nr, title, hint, prefill(ctx) => regels; ctx = { answers, toolName, vendorName }
   Regels die de organisatie zelf moet invullen markeren we met OPEN_MARKER.
   ------------------------------------------------------------------------- */
const OPEN_MARKER = "[Nog invullen door de organisatie]";

const DPIA_TEMPLATE = {
  docTitle: "Aanzet voor een DPIA",
  modelRef:
    "Deze aanzet volgt de indeling van het Model DPIA Rijksdienst. Het is een " +
    "voorzet op basis van de intakechecklist, geen ingevulde DPIA. De " +
    "beoordeling van risico's en maatregelen vraagt om een inhoudelijk oordeel " +
    "van de organisatie, samen met de functionaris gegevensbescherming (FG). " +
    "Heeft de organisatie geen FG, betrek dan een externe privacyadviseur. " +
    "Volgens de Autoriteit Persoonsgegevens is een FG verplicht voor " +
    "ziekenhuizen, zorggroepen en huisartsenposten, en voor andere " +
    "zorgaanbieders met meer dan 10.000 ingeschreven of jaarlijks behandelde " +
    "patiënten van wie de gegevens in één systeem staan.",
  sections: [
    {
      nr: 1, title: "Voorstel",
      hint: "Beschrijf de tool, wat hij doet en waarom de organisatie hem wil gebruiken.",
      prefill: (ctx) => {
        const r = [];
        if (ctx.toolName) r.push("Naam van de tool: " + ctx.toolName);
        if (ctx.vendorName) r.push("Leverancier: " + ctx.vendorName);
        r.push(ctx.answers.v3 === "ja"
          ? "De tool heeft volgens de intake een medisch doel (triage, diagnostiek, risicoscore of behandeladvies)."
          : "De tool heeft volgens de intake geen medisch doel; een zorgverlener controleert de uitkomst en blijft verantwoordelijk.");
        r.push("Doel en gewenste werking: " + OPEN_MARKER);
        return r;
      },
    },
    {
      nr: 2, title: "Persoonsgegevens",
      hint: "Welke soorten persoonsgegevens gaan er in de tool, van wie, en hoe gevoelig zijn ze?",
      prefill: (ctx) => {
        const r = [];
        if (ctx.answers.v1 === "weet-niet") {
          r.push("Bij de intake was onduidelijk of er persoonsgegevens worden verwerkt. Uitgangspunt is dat dit wel zo is zodra er tekst uit de zorg in de tool gaat. Stel dit eerst definitief vast.");
        }
        if (ctx.answers.v2 === "ja") {
          r.push("Er worden patiënt- of gezondheidsgegevens verwerkt. Dit zijn bijzondere persoonsgegevens (artikel 9 AVG).");
        }
        r.push("Precieze soorten gegevens en betrokkenen: " + OPEN_MARKER);
        return r;
      },
    },
    {
      nr: 3, title: "Gegevensverwerkingen",
      hint: "Welke verwerkingen vinden plaats: invoer, analyse, opslag, teruglevering, hergebruik voor training?",
      prefill: () => ["Vraag de leverancier expliciet of invoer wordt bewaard of gebruikt om modellen te trainen. " + OPEN_MARKER],
    },
    {
      nr: 4, title: "Verwerkingsdoeleinden",
      hint: "Waarvoor worden de gegevens precies verwerkt? Wees concreet per verwerking.",
      prefill: () => [OPEN_MARKER],
    },
    {
      nr: 5, title: "Betrokken partijen",
      hint: "Wie zijn verwerkingsverantwoordelijke, verwerker en subverwerkers, en wat is hun rol?",
      prefill: (ctx) => {
        const r = ["Verwerkingsverantwoordelijke: de eigen organisatie."];
        if (ctx.vendorName) r.push("Beoogd verwerker: " + ctx.vendorName + ".");
        r.push(ctx.answers.vo === "ja"
          ? "Volgens de intake is er een verwerkersovereenkomst getekend."
          : "Volgens de intake is er nog geen verwerkersovereenkomst getekend.");
        r.push("Vraag de actuele subverwerkerslijst op bij de leverancier en neem die hier op. " + OPEN_MARKER);
        return r;
      },
    },
    {
      nr: 6, title: "Belangen bij de gegevensverwerking",
      hint: "Welke belangen hebben de organisatie, de patiënt en de leverancier bij deze verwerking?",
      prefill: () => [OPEN_MARKER],
    },
    {
      nr: 7, title: "Verwerkingslocaties",
      hint: "Waar worden de gegevens opgeslagen en verwerkt, en vindt er doorgifte buiten de EU plaats?",
      prefill: (ctx) => {
        const v5 = ctx.answers.v5;
        if (v5 === "binnen-eu") return ["Volgens de intake worden de gegevens binnen de EU bewaard. Laat dit schriftelijk bevestigen door de leverancier."];
        if (v5 === "buiten-eu") return ["Volgens de intake gaan de gegevens (ook) buiten de EU.", "Voer een doorgiftetoets uit. " + OPEN_MARKER];
        return ["Bij de intake was de verwerkingslocatie onbekend. Laat die eerst schriftelijk bevestigen. " + OPEN_MARKER];
      },
    },
    {
      nr: 8, title: "Technieken en methoden",
      hint: "Welke techniek gebruikt de tool (AI-model, beslisregels) en hoe komt de uitkomst tot stand?",
      prefill: (ctx) => {
        const r = ["Het gaat om een AI-toepassing. Beschrijf het type model en hoe de uitkomst tot stand komt. " + OPEN_MARKER];
        if (ctx.answers.v6 === "ja") {
          r.push("Let op: de tool is zelf gebouwd of flink aangepast. Mogelijk geldt een aanbiedersrol onder de AI Act. Win eerst juridisch advies in.");
        }
        return r;
      },
    },
    {
      nr: 9, title: "Juridisch en beleidsmatig kader",
      hint: "Welke wet- en regelgeving is van toepassing op deze verwerking?",
      prefill: (ctx) => {
        const kaders = ["AVG", "WGBO"];
        kaders.push("AI-verordening (AI Act), waaronder artikel 4 (AI-geletterdheid)");
        if (ctx.answers.v4 === "ja") kaders[kaders.length - 1] += " en artikel 50 (transparantie)";
        if (ctx.answers.v3 === "ja") kaders.push("MDR (medische hulpmiddelen), inclusief CE-markering");
        return ["Van toepassing zijn in elk geval: " + kaders.join(", ") + ".", "Aanvullen met interne kaders en beroepsnormen: " + OPEN_MARKER];
      },
    },
    {
      nr: 10, title: "Bewaartermijnen",
      hint: "Hoe lang worden de gegevens bewaard en waarom die termijn?",
      prefill: () => [OPEN_MARKER],
    },
    {
      nr: 11, title: "Rechtsgrond",
      hint: "Op welke grondslag uit artikel 6 AVG is de verwerking gebaseerd?",
      prefill: () => [OPEN_MARKER],
    },
    {
      nr: 12, title: "Bijzondere persoonsgegevens",
      hint: "Als er bijzondere persoonsgegevens worden verwerkt: welke uitzondering uit artikel 9 AVG geldt?",
      prefill: (ctx) => ctx.answers.v2 === "ja"
        ? ["Er worden gezondheidsgegevens verwerkt. Onderbouw de uitzondering, doorgaans artikel 9 lid 2 onder h AVG (verlening van gezondheidszorg). " + OPEN_MARKER]
        : ["Volgens de intake geen bijzondere persoonsgegevens. Bevestig dit hier. " + OPEN_MARKER],
    },
    {
      nr: 13, title: "Doelbinding",
      hint: "Blijft de verwerking binnen het doel waarvoor de gegevens oorspronkelijk zijn verzameld?",
      prefill: () => [OPEN_MARKER],
    },
    {
      nr: 14, title: "Noodzaak en evenredigheid",
      hint: "Is de verwerking noodzakelijk voor het doel, en is er geen minder ingrijpend alternatief?",
      prefill: () => [OPEN_MARKER],
    },
    {
      nr: 15, title: "Rechten van de betrokkene",
      hint: "Hoe worden patiënten geïnformeerd en hoe kunnen zij hun rechten uitoefenen?",
      prefill: (ctx) => {
        const r = [];
        if (ctx.answers.v4 === "ja") {
          r.push("De patiënt ziet de tool of tekst die de tool maakt. Regel hoe kenbaar wordt gemaakt dat het om AI gaat en hoe AI-gebruik in het dossier wordt vermeld.");
        }
        r.push("Informatievoorziening en uitoefening van rechten: " + OPEN_MARKER);
        return r;
      },
    },
    {
      nr: 16, title: "Risico's voor de betrokkenen",
      hint: "Beschrijf de risico's voor patiënten: kans, impact en oorzaak. Dit is de kern van de DPIA en vraagt een eigen inhoudelijke beoordeling.",
      prefill: (ctx) => {
        const r = ["Aandachtspunten uit de intake om in de risicoanalyse te betrekken:"];
        if (ctx.answers.v2 === "ja") r.push("- Gevoeligheid: het gaat om gezondheidsgegevens.");
        if (ctx.answers.v3 === "ja") r.push("- Medisch doel: risico op onjuiste of niet-gevalideerde uitkomsten met gevolgen voor de zorg.");
        if (ctx.answers.v5 !== "binnen-eu") r.push("- Verwerkingslocatie buiten de EU of onbekend.");
        if (ctx.answers.v6 === "ja") r.push("- Zelfbouw of flinke aanpassing van de tool.");
        r.push("Volledige risicobeoordeling (kans en impact per risico): " + OPEN_MARKER);
        return r;
      },
    },
    {
      nr: 17, title: "Maatregelen",
      hint: "Welke maatregelen beperken de risico's, wie voert ze uit en wanneer?",
      prefill: () => [
        "Neem de actielijst uit de intakechecklist als startpunt en vul aan per risico uit onderdeel 16.",
        "Maatregelen, eigenaar en planning: " + OPEN_MARKER,
      ],
    },
  ],
};


/* -------------------------------------------------------------------------
   7. VOORBEELDPROFIELEN (startscherm)
   Vooringevulde antwoorden als startpunt; de gebruiker loopt daarna alle
   vragen gewoon na. Generieke categorieën, geen productnamen. Locatie en
   contract staan bewust op "weet ik niet": dat dwingt tot navragen.
   ------------------------------------------------------------------------- */
const PROFILES = [
  { label: "AI die meeluistert en het verslag schrijft",
    answers: { v1: "ja", v2: "ja", vo: "weet-niet", v3: "nee", v4: "nee", v5: "onbekend", v6: "nee" } },
  { label: "Schrijfhulp voor brieven en e-mails",
    answers: { v1: "ja", v2: "ja", vo: "weet-niet", v3: "nee", v4: "ja", v5: "onbekend", v6: "nee" } },
  { label: "Chatbot op de website",
    answers: { v1: "ja", v2: "ja", vo: "weet-niet", v3: "nee", v4: "ja", v5: "onbekend", v6: "nee" } },
  { label: "Tool die een risicoscore of triage-advies geeft",
    answers: { v1: "ja", v2: "ja", vo: "weet-niet", v3: "ja", v3a: "nee", v4: "nee", v5: "onbekend", v6: "nee" } },
];


/* -------------------------------------------------------------------------
   8. MAIL AAN DE LEVERANCIER
   De punten komen uit de intake: alle actiepunten met askAt "leverancier".
   ------------------------------------------------------------------------- */
const LETTER = {
  subject: (ctx) => "Aanvraag documenten voor " + (ctx.toolName || "een AI-tool"),
  aanhef: "Geachte heer of mevrouw,",
  intro: (ctx) =>
    "Onze organisatie bereidt de ingebruikname voor van " +
    (ctx.toolName ? ctx.toolName : "een AI-tool") +
    (ctx.vendorName ? " van " + ctx.vendorName : "") +
    ". Voordat we de tool in gebruik nemen, ontvangen we graag de " +
    "volgende documenten en bevestigingen van u:",
  outro:
    "Wij ontvangen deze stukken graag schriftelijk. Zonder deze informatie " +
    "kunnen wij de tool niet in gebruik nemen. Alvast dank voor uw reactie.",
  groet: "Met vriendelijke groet,",
};


/* -------------------------------------------------------------------------
   9. REGISTERREGEL (CSV-download voor het AI-register)
   Puntkomma als scheidingsteken (Nederlandse Excel-instelling).
   ------------------------------------------------------------------------- */
const REGISTER_COLUMNS = [
  { label: "Tool",                     value: (c) => c.toolName },
  { label: "Leverancier",              value: (c) => c.vendorName },
  { label: "Eigenaar (rol)",           value: (c) => c.answers.v7 || "" },
  { label: "Datum intake",             value: (c) => c.date },
  { label: "Persoonsgegevens",         value: (c) => c.answerLabel("v1") },
  { label: "Gezondheidsgegevens",      value: (c) => c.answerLabel("v2") },
  { label: "Verwerkersovereenkomst",   value: (c) => c.answerLabel("vo") },
  { label: "Medisch doel",             value: (c) => c.answerLabel("v3") },
  { label: "CE-markering bekend",      value: (c) => c.answerLabel("v3a") },
  { label: "Zichtbaar voor patiënt",   value: (c) => c.answerLabel("v4") },
  { label: "Verwerkingslocatie",       value: (c) => c.answerLabel("v5") },
  { label: "Zelfbouw of aangepast",    value: (c) => c.answerLabel("v6") },
  { label: "Status",                   value: (c) => c.statusText },
  { label: "Nog te regelen",           value: (c) => c.openItems.map((o) => o.title).join(" | ") },
  { label: "Evaluatiedatum",           value: (c) => c.evalDate },
];


/* -------------------------------------------------------------------------
   10. VASTE TEKSTEN
   ------------------------------------------------------------------------- */
const DISCLAIMER =
  "Dit is een hulpmiddel om te bepalen wat er geregeld moet worden. Het is geen " +
  "juridisch advies en geen vervanging van een DPIA. Een DPIA is een onderbouwd " +
  "oordeel over risico's en maatregelen en vraagt om een inhoudelijke beoordeling.";

const STATUS = {
  stop: {
    headline: "Nog niet in gebruik nemen",
    sub: "Er moet eerst iets fundamenteels worden uitgezocht. Zie 'Eerst uitzoeken' hieronder.",
  },
  wait: {
    headline: (a) => "Nog niet gebruiken met echte " + (a.v2 === "ja" ? "patiëntgegevens" : "persoonsgegevens"),
    sub: "Dit moet eerst geregeld zijn:",
    tip: "Tip: in de tussentijd kun je de tool al uitproberen met verzonnen voorbeelden, zonder echte gegevens.",
  },
  go: {
    headline: "Je kunt verantwoord starten",
    sub: "Er zijn geen blokkades. Rond de stappen hieronder af en vink af wat klaar is.",
  },
};


/* =========================================================================
   ================  RENDERLOGICA: hieronder niet nodig aan te passen  =====
   ========================================================================= */

const state = {
  answers: {},      // { v1: "ja", v2: "nee", ... , v7: "praktijkmanager" }
  toolName: "",
  vendorName: "",
  checked: new Set(),
  stepIndex: 0,     // positie binnen QUESTIONS
  pendingReask: false,
};

const el = (id) => document.getElementById(id);
const resolve = (v) => (typeof v === "function" ? v(state.answers) : v);

/* ---- Zichtbaarheid & navigatie ---- */
function isVisible(q) {
  return typeof q.showIf !== "function" || q.showIf(state.answers);
}
function visibleQuestions() {
  return QUESTIONS.filter(isVisible);
}

/* ---- Schermwisseling ---- */
function showScreen(name) {
  ["start", "question", "result"].forEach((s) => {
    el("screen-" + s).hidden = (s !== name);
  });
  el("btn-restart-top").hidden = (name === "start");
  el("link-home").hidden = (name !== "start");
  el("main").focus();
  window.scrollTo(0, 0);
}

/* Wis alle state en keer terug naar het startscherm. */
function restartTool() {
  state.answers = {};
  state.toolName = "";
  state.vendorName = "";
  state.checked = new Set();
  state.stepIndex = 0;
  el("start-form").reset();
  history.replaceState(null, "", location.pathname + location.search);
  showScreen("start");
}

/* ---- Startscherm ---- */
function initStart() {
  el("disclaimer-footer").textContent = DISCLAIMER;

  el("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    startWizard(null);
  });

  const chips = el("profile-chips");
  PROFILES.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = p.label;
    btn.addEventListener("click", () => startWizard(p));
    chips.appendChild(btn);
  });

  const share = el("btn-share");
  if (share) {
    share.addEventListener("click", async () => {
      const url = location.origin + location.pathname;
      const data = { title: "AI-intakechecklist voor de zorg", text: "Mag deze AI-tool in gebruik? Check het in een paar minuten.", url };
      if (navigator.share) {
        try { await navigator.share(data); return; } catch (e) { /* geannuleerd */ }
      }
      await copyText(url);
      flashStatus("share-status", "Link gekopieerd.");
    });
  }
}

function startWizard(profile) {
  state.toolName = el("tool-name").value.trim();
  state.vendorName = el("vendor-name").value.trim();
  state.answers = profile ? { ...profile.answers } : {};
  state.checked = new Set();
  state.stepIndex = firstVisibleIndex(0, +1);
  renderQuestion();
  showScreen("question");
}

function firstVisibleIndex(from, dir) {
  let i = from;
  while (i >= 0 && i < QUESTIONS.length) {
    if (isVisible(QUESTIONS[i])) return i;
    i += dir;
  }
  return i;
}

/* ---- Vraagscherm ---- */
function renderQuestion() {
  const q = QUESTIONS[state.stepIndex];
  state.pendingReask = false;

  const vis = visibleQuestions();
  const pos = vis.indexOf(q) + 1;
  const total = vis.length;
  el("progress-fill").style.width = (pos / total * 100) + "%";
  el("progress-text").textContent = "Vraag " + pos + " van " + total;

  el("q-title").textContent = q.text;

  const help = el("q-help");
  if (q.help) { help.textContent = q.help; help.hidden = false; }
  else { help.hidden = true; }

  const optionsWrap = el("q-options");
  const textWrap = el("q-textwrap");
  const explanation = el("q-explanation");
  explanation.hidden = true;
  explanation.textContent = "";

  optionsWrap.innerHTML = "";

  if (q.type === "text") {
    optionsWrap.hidden = true;
    textWrap.hidden = false;
    el("q-text-label").textContent = q.text;
    const input = el("q-textinput");
    input.value = state.answers[q.id] || "";
    input.placeholder = q.placeholder || "";
    setTimeout(() => input.focus(), 0);
  } else {
    textWrap.hidden = true;
    optionsWrap.hidden = false;
    const current = state.answers[q.id];
    q.options.forEach((opt) => {
      const optId = q.id + "-" + opt.value;
      const label = document.createElement("label");
      label.className = "option";
      label.setAttribute("for", optId);

      const input = document.createElement("input");
      input.type = "radio";
      input.name = q.id;
      input.id = optId;
      input.value = opt.value;
      if (current === opt.value) input.checked = true;
      input.addEventListener("change", () => onOptionChange(q, opt));

      const span = document.createElement("span");
      span.className = "option-label";
      span.textContent = opt.label;

      label.appendChild(input);
      label.appendChild(span);
      optionsWrap.appendChild(label);
    });
    setTimeout(() => {
      const first = optionsWrap.querySelector("input");
      if (first) first.focus();
    }, 0);
  }

  el("btn-back").hidden = (firstVisibleIndex(state.stepIndex - 1, -1) < 0);
}

function onOptionChange(q, opt) {
  const explanation = el("q-explanation");
  if (opt.reask && opt.explanation) {
    explanation.textContent = opt.explanation;
    explanation.hidden = false;
    state.pendingReask = true;
  } else if (opt.note) {
    explanation.textContent = opt.note;
    explanation.hidden = false;
    state.pendingReask = false;
  } else {
    explanation.hidden = true;
    explanation.textContent = "";
    state.pendingReask = false;
  }
}

function initQuestionNav() {
  el("question-form").addEventListener("submit", (e) => {
    e.preventDefault();
    goNext();
  });
  el("btn-back").addEventListener("click", goBack);
}

function goNext() {
  const q = QUESTIONS[state.stepIndex];

  if (q.type === "text") {
    state.answers[q.id] = el("q-textinput").value.trim().slice(0, 80);
  } else {
    const checked = document.querySelector('input[name="' + q.id + '"]:checked');
    if (!checked) {
      flashHint("Kies een antwoord om verder te gaan.");
      return;
    }
    const opt = q.options.find((o) => o.value === checked.value);
    if (opt && opt.reask) {
      onOptionChange(q, opt);
      flashHint("Kies op basis van de uitleg alsnog ja of nee.");
      return;
    }
    state.answers[q.id] = checked.value;
    clearHiddenAnswers();
  }

  const nextIdx = firstVisibleIndex(state.stepIndex + 1, +1);
  if (nextIdx >= QUESTIONS.length) {
    renderResult();
    showScreen("result");
  } else {
    state.stepIndex = nextIdx;
    renderQuestion();
  }
}

function goBack() {
  const prevIdx = firstVisibleIndex(state.stepIndex - 1, -1);
  if (prevIdx < 0) return;
  state.stepIndex = prevIdx;
  renderQuestion();
}

function clearHiddenAnswers() {
  QUESTIONS.forEach((q) => {
    if (!isVisible(q) && q.id in state.answers) delete state.answers[q.id];
  });
}

function flashHint(msg) {
  const explanation = el("q-explanation");
  explanation.textContent = msg;
  explanation.hidden = false;
}

/* ---- Verzamel actiepunten op basis van de antwoorden ---- */
function collectObligationIds() {
  const ids = new Set(ALWAYS);
  visibleQuestions().forEach((q) => {
    const ans = state.answers[q.id];
    if (q.type === "single" && ans) {
      const opt = q.options.find((o) => o.value === ans);
      if (opt && opt.grants) opt.grants.forEach((g) => ids.add(g));
    }
    if (typeof q.dynamicGrants === "function") {
      q.dynamicGrants(state.answers).forEach((g) => ids.add(g));
    }
  });
  if (state.answers.vo === "ja") ids.delete(VO_ID);
  return [...ids].filter((id) => OBLIGATIONS[id]);
}

function grantedObligations() {
  return collectObligationIds().map((id) => ({ id, ...OBLIGATIONS[id] }));
}

function vendorItems() {
  return grantedObligations().filter((o) => o.askAt === "leverancier");
}

/* ---- Oordeel ---- */
function computeStatus() {
  const items = grantedObligations();
  const openFlags = items.filter((it) => it.redFlag && !state.checked.has(it.id));
  const openConditions = CONDITIONS.filter((c) =>
    c.when(state.answers) && !state.checked.has(c.id));
  const level = openFlags.length ? "stop" : (openConditions.length ? "wait" : "go");
  return { level, openFlags, openConditions };
}

function statusHeadline(level) {
  return resolve(STATUS[level].headline);
}

/* ---- Resultaatscherm ---- */
function renderResult() {
  const items = grantedObligations();
  const flags = items.filter((it) => it.redFlag);

  const subjectParts = [];
  if (state.toolName) subjectParts.push("Tool: " + state.toolName);
  if (state.vendorName) subjectParts.push("Leverancier: " + state.vendorName);
  if (state.answers.v7) subjectParts.push("Eigenaar: " + state.answers.v7);
  el("result-subject").textContent = subjectParts.join("  ·  ");
  el("result-subject").hidden = subjectParts.length === 0;
  el("result-date").textContent = "Ingevuld op " + todayNl();

  // Eerst uitzoeken.
  const flagsCard = el("result-flags");
  flagsCard.hidden = flags.length === 0;
  el("flags-list").innerHTML = "";
  flags.forEach((it) => el("flags-list").appendChild(renderItem(it)));

  // Stappenplan, gegroepeerd op wie het regelt. De actieknoppen gaan eerst
  // terug naar hun verborgen houder, zodat ze het leegmaken overleven.
  const holder = el("action-holder");
  ["letter-actions", "dpia-actions", "register-actions"].forEach((id) => holder.appendChild(el(id)));
  const stepsWrap = el("result-steps");
  stepsWrap.innerHTML = "";
  let nr = 0;
  STEPS.forEach((step) => {
    const conditionIds = CONDITIONS.filter((c) => c.when(state.answers)).map((c) => c.id);
    const stepItems = items.filter((it) => it.askAt === step.askAt && !it.redFlag)
      .sort((a, b) => conditionIds.includes(b.id) - conditionIds.includes(a.id));
    const vendorStepWithFlag = step.askAt === "leverancier" && vendorItems().length > 0;
    if (stepItems.length === 0 && !vendorStepWithFlag) return;
    nr += 1;

    const card = document.createElement("section");
    card.className = "card step";

    const head = document.createElement("div");
    head.className = "step-head";
    const num = document.createElement("span");
    num.className = "step-nr";
    num.textContent = String(nr);
    const h3 = document.createElement("h3");
    h3.textContent = resolve(step.title);
    head.appendChild(num);
    head.appendChild(h3);
    card.appendChild(head);

    const intro = document.createElement("p");
    intro.className = "step-intro";
    intro.textContent = resolve(step.intro);
    card.appendChild(intro);

    if (stepItems.length) {
      const ul = document.createElement("ul");
      ul.className = "artefact-list";
      stepItems.forEach((it) => ul.appendChild(renderItem(it)));
      card.appendChild(ul);
    }

    // Acties horen bij de stap waar ze nodig zijn.
    if (step.askAt === "leverancier") card.appendChild(el("letter-actions"));
    if (step.askAt === "FG" && items.some((it) => it.id === "dpia")) card.appendChild(el("dpia-actions"));
    if (step.askAt === "register") card.appendChild(el("register-actions"));

    stepsWrap.appendChild(card);
  });

  renderStatus();
  syncHash();
}

function renderItem(it) {
  const li = document.createElement("li");
  li.className = "artefact" + (state.checked.has(it.id) ? " check-done" : "");

  const label = document.createElement("label");
  label.className = "check-label";
  const box = document.createElement("input");
  box.type = "checkbox";
  box.checked = state.checked.has(it.id);
  box.addEventListener("change", () => {
    if (box.checked) state.checked.add(it.id); else state.checked.delete(it.id);
    li.classList.toggle("check-done", box.checked);
    renderStatus();
    syncHash();
  });
  const text = document.createElement("span");
  const title = document.createElement("span");
  title.className = "artefact-title";
  title.textContent = it.title;
  const note = document.createElement("span");
  note.className = "artefact-note";
  note.textContent = it.note;
  text.appendChild(title);
  text.appendChild(note);
  label.appendChild(box);
  label.appendChild(text);
  li.appendChild(label);

  if (it.more || it.link) {
    const det = document.createElement("details");
    det.className = "artefact-more";
    const sum = document.createElement("summary");
    sum.textContent = "Meer uitleg";
    det.appendChild(sum);
    if (it.more) {
      const p = document.createElement("p");
      p.textContent = it.more;
      det.appendChild(p);
    }
    if (it.link) {
      const a = document.createElement("a");
      a.href = it.link.href;
      a.rel = "noopener";
      a.target = "_blank";
      a.textContent = it.link.label;
      det.appendChild(a);
    }
    li.appendChild(det);
  }
  return li;
}

function renderStatus() {
  const s = computeStatus();
  const box = el("result-status");
  box.className = "status status-" + s.level;
  el("status-headline").textContent = statusHeadline(s.level);
  el("status-sub").textContent = STATUS[s.level].sub;

  const list = el("status-list");
  list.innerHTML = "";
  if (s.level === "wait") {
    s.openConditions.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = c.text;
      list.appendChild(li);
    });
  }
  list.hidden = s.level !== "wait";
  el("status-tip").textContent = s.level === "wait" ? STATUS.wait.tip : "";
  el("status-tip").hidden = s.level !== "wait";

  // Voortgang.
  const all = grantedObligations();
  const done = all.filter((it) => state.checked.has(it.id)).length;
  el("progress-done-fill").style.width = (all.length ? done / all.length * 100 : 0) + "%";
  el("progress-done-text").textContent = done + " van " + all.length + " punten afgevinkt";
}

/* ---- Voortgang in de link (#) ---- */
function syncHash() {
  const p = new URLSearchParams();
  QUESTIONS.forEach((q) => {
    if (state.answers[q.id]) p.set(q.id, state.answers[q.id]);
  });
  if (state.toolName) p.set("t", state.toolName);
  if (state.vendorName) p.set("l", state.vendorName);
  if (state.checked.size) p.set("c", [...state.checked].join(","));
  history.replaceState(null, "", "#" + p.toString());
}

function restoreFromHash() {
  if (!location.hash || location.hash.length < 3) return false;
  const p = new URLSearchParams(location.hash.slice(1));
  const answers = {};
  QUESTIONS.forEach((q) => {
    const v = p.get(q.id);
    if (v == null) return;
    if (q.type === "text") answers[q.id] = v.slice(0, 80);
    else if (q.options.some((o) => o.value === v && !o.reask)) answers[q.id] = v;
  });
  if (!answers.v1) return false;
  state.answers = answers;
  state.toolName = (p.get("t") || "").slice(0, 80);
  state.vendorName = (p.get("l") || "").slice(0, 80);
  state.checked = new Set((p.get("c") || "").split(",").filter((id) => OBLIGATIONS[id]));
  clearHiddenAnswers();
  renderResult();
  showScreen("result");
  return true;
}

/* ---- Gedeelde helpers voor uitvoer ---- */
function todayNl() {
  return new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
}

function answerLabel(qid) {
  const q = QUESTIONS.find((x) => x.id === qid);
  if (!q || q.type !== "single") return "";
  const opt = q.options.find((o) => o.value === state.answers[qid]);
  return opt ? opt.label : "";
}

function downloadBlob(content, mime, filename) {
  const blob = new Blob([content], { type: mime });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

function fileSlug() {
  return (state.toolName || "tool").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "tool";
}

async function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch (e) { /* val terug */ }
  legacyCopy(text);
}

function flashStatus(id, msg) {
  const s = el(id);
  if (!s) return;
  s.textContent = msg;
  setTimeout(() => { s.textContent = ""; }, 4000);
}

/* ---- Mail aan de leverancier ---- */
function buildLetterText() {
  const ctx = { toolName: state.toolName, vendorName: state.vendorName };
  const lines = [];
  lines.push(LETTER.aanhef);
  lines.push("");
  lines.push(LETTER.intro(ctx));
  lines.push("");
  vendorItems().forEach((it, i) => {
    lines.push((i + 1) + ". " + (it.letter || it.title));
  });
  lines.push("");
  lines.push(LETTER.outro);
  lines.push("");
  lines.push(LETTER.groet);
  lines.push(state.answers.v7 ? "[Naam], " + state.answers.v7 : "[Naam en functie]");
  return lines.join("\n");
}

function mailtoLetter() {
  const subject = LETTER.subject({ toolName: state.toolName, vendorName: state.vendorName });
  return "mailto:?subject=" + encodeURIComponent(subject) +
         "&body=" + encodeURIComponent(buildLetterText());
}

/* ---- Registerregel als CSV ---- */
function registerContext() {
  const items = grantedObligations();
  const evalDate = new Date();
  evalDate.setFullYear(evalDate.getFullYear() + 1);
  return {
    answers: state.answers,
    toolName: state.toolName,
    vendorName: state.vendorName,
    date: todayNl(),
    evalDate: evalDate.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" }),
    openItems: items.filter((it) => !state.checked.has(it.id)),
    statusText: statusHeadline(computeStatus().level),
    answerLabel,
  };
}

function csvField(v) {
  return '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
}

function buildRegisterCsv() {
  const ctx = registerContext();
  const header = REGISTER_COLUMNS.map((c) => csvField(c.label)).join(";");
  const row = REGISTER_COLUMNS.map((c) => csvField(c.value(ctx))).join(";");
  return "﻿" + header + "\r\n" + row + "\r\n";
}

/* ---- DPIA-aanzet als Word-document (volledig client-side) ---- */
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function buildDpiaHtml() {
  const ctx = { answers: state.answers, toolName: state.toolName, vendorName: state.vendorName };
  const datum = todayNl();

  const head =
    "<h1>" + escapeHtml(DPIA_TEMPLATE.docTitle) + "</h1>" +
    "<p class='meta'>" +
    (ctx.toolName ? "Tool: " + escapeHtml(ctx.toolName) + "<br>" : "") +
    (ctx.vendorName ? "Leverancier: " + escapeHtml(ctx.vendorName) + "<br>" : "") +
    (ctx.answers.v7 ? "Eigenaar: " + escapeHtml(ctx.answers.v7) + "<br>" : "") +
    "Datum aanzet: " + escapeHtml(datum) +
    "</p>" +
    "<p class='intro'>" + escapeHtml(DPIA_TEMPLATE.modelRef) + "</p>";

  const body = DPIA_TEMPLATE.sections.map((sec) => {
    const lines = sec.prefill(ctx).map((line) => {
      const esc = escapeHtml(line).replace(
        escapeHtml(OPEN_MARKER),
        "<strong>" + escapeHtml(OPEN_MARKER) + "</strong>"
      );
      return "<p>" + esc + "</p>";
    }).join("");
    return "<h2>" + sec.nr + ". " + escapeHtml(sec.title) + "</h2>" +
           "<p class='hint'>" + escapeHtml(sec.hint) + "</p>" + lines;
  }).join("");

  const footer = "<hr><p class='disclaimer'>" + escapeHtml(DISCLAIMER) + "</p>";

  return "<!DOCTYPE html><html lang='nl'><head><meta charset='utf-8'>" +
    "<title>" + escapeHtml(DPIA_TEMPLATE.docTitle) + "</title>" +
    "<style>" +
    "body{font-family:Georgia,serif;font-size:11pt;line-height:1.45;color:#000;max-width:17cm;}" +
    "h1{font-size:17pt;font-weight:normal;margin:0 0 4pt;}" +
    "h2{font-size:12.5pt;font-weight:bold;margin:14pt 0 2pt;}" +
    ".meta{margin:0 0 10pt;}" +
    ".intro,.hint{font-style:italic;color:#444;margin:0 0 6pt;}" +
    "p{margin:0 0 5pt;}" +
    ".disclaimer{font-size:9pt;color:#444;}" +
    "</style></head><body>" + head + body + footer + "</body></html>";
}

function downloadDpia() {
  downloadBlob("﻿" + buildDpiaHtml(), "application/msword", "DPIA-aanzet-" + fileSlug() + ".doc");
}

/* ---- Platte tekst voor klembord ---- */
function buildPlainText() {
  const items = grantedObligations();
  const flags = items.filter((it) => it.redFlag);
  const s = computeStatus();

  const lines = [];
  lines.push("AI-INTAKECHECKLIST");
  if (state.toolName) lines.push("Tool: " + state.toolName);
  if (state.vendorName) lines.push("Leverancier: " + state.vendorName);
  if (state.answers.v7) lines.push("Eigenaar: " + state.answers.v7);
  lines.push("");
  lines.push(statusHeadline(s.level).toUpperCase());
  if (s.level === "wait") s.openConditions.forEach((c) => lines.push("- " + c.text));
  lines.push("");

  if (flags.length) {
    lines.push("EERST UITZOEKEN");
    flags.forEach((it) => pushItemLines(lines, it));
    lines.push("");
  }

  let nr = 0;
  STEPS.forEach((step) => {
    const stepItems = items.filter((it) => it.askAt === step.askAt && !it.redFlag);
    if (!stepItems.length) return;
    nr += 1;
    lines.push("STAP " + nr + ": " + resolve(step.title).toUpperCase());
    stepItems.forEach((it) => pushItemLines(lines, it));
    lines.push("");
  });

  lines.push("Verder werken aan deze checklist: " + location.href);
  lines.push("---");
  lines.push(DISCLAIMER);
  return lines.join("\n");
}

function pushItemLines(lines, it) {
  lines.push((state.checked.has(it.id) ? "[x] " : "[ ] ") + it.title);
  lines.push("    " + it.note);
}

/* ---- Acties op het resultaatscherm ---- */
function initResultActions() {
  el("btn-copy").addEventListener("click", async () => {
    await copyText(buildPlainText());
    flashStatus("copy-status", "Gekopieerd naar het klembord.");
  });

  el("btn-link").addEventListener("click", async () => {
    syncHash();
    await copyText(location.href);
    flashStatus("link-status", "Link gekopieerd. Bewaar of deel hem om later verder te gaan.");
  });

  el("btn-print").addEventListener("click", () => window.print());
  el("btn-dpia").addEventListener("click", downloadDpia);
  el("btn-csv").addEventListener("click", () => {
    downloadBlob(buildRegisterCsv(), "text/csv;charset=utf-8", "AI-register-" + fileSlug() + ".csv");
  });

  el("btn-letter-mail").addEventListener("click", () => {
    window.location.href = mailtoLetter();
  });
  el("btn-letter-copy").addEventListener("click", async () => {
    await copyText(buildLetterText());
    flashStatus("letter-status", "Tekst van de mail gekopieerd.");
  });

  el("btn-restart").addEventListener("click", restartTool);
  el("btn-restart-top").addEventListener("click", restartTool);
}

function legacyCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "absolute";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) { /* stil falen */ }
  document.body.removeChild(ta);
}

/* ---- Opstarten (idempotent: init mag maar één keer draaien) ---- */
let appInitialized = false;
function initApp() {
  if (appInitialized) return;
  appInitialized = true;
  initStart();
  initQuestionNav();
  initResultActions();
  restoreFromHash();
}
if (document.readyState !== "loading") {
  initApp();
} else {
  document.addEventListener("DOMContentLoaded", initApp);
}
