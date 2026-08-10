"use strict";

/* =========================================================================
   AI-INTAKECHECKLIST VOOR DE ZORG
   -------------------------------------------------------------------------
   Alles draait client-side. Er wordt niets opgeslagen (geen localStorage,
   sessionStorage of cookies) en niets verzonden. De state leeft uitsluitend
   in het geheugen, in het object `state` onderaan.

   DATA-BLOK  (dit deel pas je aan om vragen of teksten te wijzigen)
   RENDER     (dit deel hoef je niet aan te raken)
   ========================================================================= */


/* -------------------------------------------------------------------------
   1. THEMA'S: waaronder de artefacten op de eindlijst worden gegroepeerd
   ------------------------------------------------------------------------- */
const THEMES = {
  privacy: "Privacy en AVG",
  medisch: "Medisch hulpmiddel en CE",
  aiact:   "AI Act",
  beheer:  "Registratie en beheer",
};

// Volgorde waarin de thema's op het resultaatscherm verschijnen.
const THEME_ORDER = ["privacy", "medisch", "aiact", "beheer"];


/* -------------------------------------------------------------------------
   2. VERPLICHTINGEN (artefacten)
   Eén catalogus, verwijzingen via id. Zo staat elke tekst op één plek en
   kunnen meerdere antwoorden naar dezelfde verplichting wijzen.

     theme   : sleutel uit THEMES
     title   : de regel die op de lijst komt
     note    : één regel toelichting in gewone taal
     askAt   : bij wie je het opvraagt/regelt (optioneel)
     redFlag : true = wordt apart en bovenaan getoond
   ------------------------------------------------------------------------- */
const OBLIGATIONS = {
  // --- Privacy en AVG ---
  verwerkersovereenkomst: {
    theme: "privacy",
    title: "Verwerkersovereenkomst sluiten met de leverancier",
    note: "Leg schriftelijk vast welke gegevens de leverancier voor je verwerkt en onder welke voorwaarden.",
    askAt: "leverancier",
  },
  verwerkingsregister: {
    theme: "privacy",
    title: "Opnemen in het verwerkingsregister",
    note: "Voeg de verwerking toe aan het register van verwerkingsactiviteiten van de praktijk.",
    askAt: "eigen organisatie",
  },
  grondslagBewaartermijn: {
    theme: "privacy",
    title: "Grondslag en bewaartermijn vastleggen",
    note: "Bepaal op welke grondslag je de gegevens verwerkt en hoe lang je ze bewaart.",
    askAt: "eigen organisatie",
  },
  dpiaToets: {
    theme: "privacy",
    title: "DPIA-toets (pre-scan) uitvoeren",
    note: "Ga na of een DPIA nodig is: een korte inschatting van het risico voor betrokkenen.",
    askAt: "FG",
  },
  dpiaVolledig: {
    theme: "privacy",
    title: "Volledige DPIA uitvoeren bij hoog risico",
    note: "Bij hoog risico: een onderbouwd oordeel over risico's en maatregelen. Laat dit inhoudelijk beoordelen.",
    askAt: "FG",
  },
  beveiligingToegang: {
    theme: "privacy",
    title: "Beveiligingsmaatregelen en toegangsrechten vastleggen",
    note: "Leg vast hoe de gegevens beveiligd zijn en wie er bij mag, passend bij gezondheidsgegevens.",
    askAt: "eigen organisatie",
  },
  doorgiftetoets: {
    theme: "privacy",
    title: "Doorgiftetoets uitvoeren",
    note: "Bij verwerking buiten de EU: beoordeel of de doorgifte is toegestaan en welke waarborgen nodig zijn.",
    askAt: "FG",
  },
  hostinglocatie: {
    theme: "privacy",
    title: "Hostinglocatie schriftelijk laten bevestigen",
    note: "Vraag de leverancier schriftelijk waar de gegevens fysiek worden opgeslagen en verwerkt.",
    askAt: "leverancier",
  },
  subverwerkers: {
    theme: "privacy",
    title: "Actuele subverwerkerslijst opvragen",
    note: "Vraag welke andere partijen de leverancier inschakelt om jouw gegevens te verwerken.",
    askAt: "leverancier",
  },

  // --- Medisch hulpmiddel en CE ---
  ceVerklaring: {
    theme: "medisch",
    title: "CE-verklaring en risicoklasse opvragen",
    note: "Zonder CE-markering voor een medisch doel: niet in gebruik nemen. Vraag de verklaring en de risicoklasse op.",
    askAt: "leverancier",
    redFlag: true,
  },
  validatie: {
    theme: "medisch",
    title: "Validatiegegevens in een Nederlandse eerstelijnspopulatie opvragen",
    note: "Vraag of de tool is gevalideerd in een populatie die op jouw patiënten lijkt, niet alleen in het buitenland.",
    askAt: "leverancier",
  },
  eindverantwoordelijk: {
    theme: "medisch",
    title: "Vastleggen dat de zorgverlener de output controleert",
    note: "Leg vast dat de zorgverlener de uitkomst controleert en eindverantwoordelijk blijft.",
    askAt: "eigen organisatie",
  },
  inhouseMdr: {
    theme: "medisch",
    title: "Toets aan de in-house uitzondering (MDR artikel 5 lid 5)",
    note: "Bij een zelfgebouwde of aangepaste tool met een medisch doel: beoordeel of de in-house uitzondering geldt. Win eerst juridisch advies in.",
    askAt: "juridisch advies",
    redFlag: true,
  },

  // --- AI Act ---
  transparantieAi: {
    theme: "aiact",
    title: "Kenbaar maken dat het om AI gaat",
    note: "Transparantieplicht (AI Act artikel 50): maak duidelijk dat de patiënt met AI-gegenereerde tekst te maken heeft.",
    askAt: "eigen organisatie",
  },
  dossierVermelding: {
    theme: "aiact",
    title: "Afspraak over vermelding van AI-gebruik in het dossier",
    note: "Spreek af hoe je in het dossier noteert dat AI is gebruikt bij deze patiënt.",
    askAt: "eigen organisatie",
  },
  aiGeletterdheid: {
    theme: "aiact",
    title: "Betrokken medewerkers instrueren over wat de tool wel en niet kan",
    note: "AI-geletterdheid (AI Act artikel 4): zorg dat gebruikers de mogelijkheden én grenzen van de tool kennen.",
    askAt: "eigen organisatie",
  },
  aanbiedersrol: {
    theme: "aiact",
    title: "Mogelijke aanbiedersrol onder de AI Act, geen gebruiksverantwoordelijke",
    note: "Door zelf bouwen of wezenlijk aanpassen kun je 'aanbieder' worden, met zwaardere plichten. Win eerst juridisch advies in.",
    askAt: "juridisch advies",
    redFlag: true,
  },

  // --- Registratie en beheer ---
  aiRegister: {
    theme: "beheer",
    title: "Opnemen in het AI-register",
    note: "Neem de tool op in het AI-register van de organisatie.",
    askAt: "eigen organisatie",
  },
  eigenaarEvaluatie: {
    theme: "beheer",
    title: "Eigenaar en evaluatiedatum vastleggen in het register",
    note: "Leg vast wie binnen de organisatie eigenaar is en wanneer de tool opnieuw wordt beoordeeld.",
    askAt: "eigen organisatie",
  },
};


/* -------------------------------------------------------------------------
   3. VRAGEN
   Elke vraag heeft opties; elke optie kent 'grants': de id's van
   verplichtingen die dat antwoord activeert.

     id            : unieke sleutel; onder deze sleutel bewaren we het antwoord
     text          : de vraag
     help          : optionele toelichting onder de vraag
     type          : "single" (keuze) of "text" (vrij tekstveld)
     showIf(a)     : optioneel; toon de vraag alleen als dit true is (a = antwoorden)
     options[]     : { value, label, grants[], note?, reask?, explanation? }
                       - note        : toelichting die bij dit antwoord hoort
                       - reask       : true = toon uitleg en stel de vraag opnieuw
                       - explanation : tekst bij een reask-antwoord
     dynamicGrants(a): optioneel; extra verplichtingen op basis van álle antwoorden
     placeholder   : hint-tekst voor een tekstveld (type "text")
   ------------------------------------------------------------------------- */
const QUESTIONS = [
  {
    id: "v1",
    text: "Worden er persoonsgegevens verwerkt?",
    type: "single",
    options: [
      { value: "ja", label: "Ja",
        grants: ["verwerkersovereenkomst", "verwerkingsregister", "grondslagBewaartermijn"] },
      { value: "weet-niet", label: "Weet ik niet",
        grants: ["verwerkersovereenkomst", "verwerkingsregister", "grondslagBewaartermijn"],
        note: "“Weet ik niet” telt hier als ja: zodra er tekst uit de praktijk in de tool gaat, zijn het in de praktijk bijna altijd persoonsgegevens." },
      { value: "nee", label: "Nee", grants: [] },
    ],
  },
  {
    id: "v2",
    text: "Gaat het om patiënt- of gezondheidsgegevens?",
    showIf: (a) => a.v1 === "ja" || a.v1 === "weet-niet",
    type: "single",
    options: [
      { value: "ja", label: "Ja",
        grants: ["dpiaToets", "dpiaVolledig", "beveiligingToegang"] },
      { value: "nee", label: "Nee", grants: [] },
    ],
  },
  {
    id: "v3",
    text: "Heeft de tool een medisch doel, zoals triage, diagnostiek, risicoscore of behandeladvies?",
    type: "single",
    options: [
      { value: "ja", label: "Ja",
        grants: ["ceVerklaring", "validatie"] },
      { value: "twijfel", label: "Twijfel", grants: [], reask: true,
        explanation: "Het gaat om het dóél van de tool. Géén medisch doel: een consult of gesprek samenvatten. Wél een medisch doel: een advies over vervolgbeleid, een risicoscore of een triage-uitkomst. Kies op basis hiervan opnieuw." },
      { value: "nee", label: "Nee",
        grants: ["eindverantwoordelijk"] },
    ],
  },
  {
    id: "v4",
    text: "Is de tool zichtbaar voor de patiënt, of ziet de patiënt gegenereerde tekst?",
    type: "single",
    options: [
      { value: "ja", label: "Ja",
        grants: ["transparantieAi", "dossierVermelding"] },
      { value: "nee", label: "Nee", grants: [] },
    ],
  },
  {
    id: "v5",
    text: "Waar draaien de gegevens?",
    type: "single",
    options: [
      { value: "binnen-eu", label: "Binnen de EU",
        grants: ["subverwerkers"] },
      { value: "buiten-eu", label: "Buiten de EU",
        grants: ["doorgiftetoets", "hostinglocatie", "subverwerkers"] },
      { value: "onbekend", label: "Onbekend",
        grants: ["doorgiftetoets", "hostinglocatie", "subverwerkers"],
        note: "Onbekend telt hier als “buiten de EU”: zolang de locatie niet bevestigd is, ga je uit van het strengere scenario." },
    ],
  },
  {
    id: "v6",
    text: "Is de tool zelf gebouwd of wezenlijk aangepast en onder eigen naam in gebruik genomen?",
    help: "Denk aan: zelf een AI-toepassing bouwen, of een bestaande tool zo aanpassen dat je hem onder je eigen naam aanbiedt.",
    type: "single",
    options: [
      { value: "nee", label: "Nee", grants: [] },
      { value: "ja", label: "Ja", grants: ["aanbiedersrol"] },
    ],
    // Bij een medisch doel (v3 = ja) komt de MDR-toets er als extra rode vlag bij.
    dynamicGrants: (a) => (a.v6 === "ja" && a.v3 === "ja") ? ["inhouseMdr"] : [],
  },
  {
    id: "v7",
    text: "Wie binnen de organisatie is eigenaar van deze tool?",
    help: "Optioneel. Vul uitsluitend een rol in, bijvoorbeeld “praktijkmanager”. Geen namen.",
    type: "text",
    placeholder: "Bijvoorbeeld: praktijkmanager",
  },
];


/* -------------------------------------------------------------------------
   4. ALTIJD: verplichtingen die gelden ongeacht de antwoorden
   ------------------------------------------------------------------------- */
const ALWAYS = ["aiRegister", "aiGeletterdheid", "eigenaarEvaluatie"];


/* -------------------------------------------------------------------------
   5. VASTE TEKSTEN
   ------------------------------------------------------------------------- */
const DISCLAIMER =
  "Dit is een hulpmiddel om te bepalen wat er geregeld moet worden. Het is geen " +
  "juridisch advies en geen vervanging van een DPIA. Een DPIA is een onderbouwd " +
  "oordeel over risico's en maatregelen en vraagt om een inhoudelijke beoordeling.";

const ASK_AT_LABEL = {
  "leverancier": "Opvragen bij de leverancier",
  "FG": "Regelen met de FG (functionaris gegevensbescherming)",
  "eigen organisatie": "Regelen binnen de eigen organisatie",
  "juridisch advies": "Eerst juridisch advies inwinnen",
};


/* =========================================================================
   ================  RENDERLOGICA: hieronder niet nodig aan te passen  =====
   ========================================================================= */

const state = {
  answers: {},      // { v1: "ja", v2: "nee", ... , v7: "praktijkmanager" }
  toolName: "",
  vendorName: "",
  stepIndex: 0,     // positie binnen QUESTIONS
  pendingReask: false,
};

const el = (id) => document.getElementById(id);

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
  el("main").focus();
  window.scrollTo(0, 0);
}

/* ---- Startscherm ---- */
function initStart() {
  el("disclaimer-footer").textContent = DISCLAIMER;

  el("start-form").addEventListener("submit", (e) => {
    e.preventDefault();
    state.toolName = el("tool-name").value.trim();
    state.vendorName = el("vendor-name").value.trim();
    state.stepIndex = firstVisibleIndex(0, +1);
    renderQuestion();
    showScreen("question");
  });
}

/* Zoek de eerstvolgende zichtbare vraag vanaf `from` in richting `dir`. */
function firstVisibleIndex(from, dir) {
  let i = from;
  while (i >= 0 && i < QUESTIONS.length) {
    if (isVisible(QUESTIONS[i])) return i;
    i += dir;
  }
  return i; // buiten bereik = klaar (vooruit) of start (achteruit)
}

/* ---- Vraagscherm ---- */
function renderQuestion() {
  const q = QUESTIONS[state.stepIndex];
  state.pendingReask = false;

  // Voortgang (op basis van zichtbare vragen).
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
    el("q-text-label").setAttribute("for", "q-textinput");
    const input = el("q-textinput");
    input.value = state.answers[q.id] || "";
    input.placeholder = q.placeholder || "";
    setTimeout(() => input.focus(), 0);
  } else {
    textWrap.hidden = true;
    optionsWrap.hidden = false;
    const current = state.answers[q.id];
    q.options.forEach((opt, idx) => {
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
    // Focus de eerste optie voor toetsenbordbediening.
    setTimeout(() => {
      const first = optionsWrap.querySelector("input");
      if (first) first.focus();
    }, 0);
  }

  el("btn-back").hidden = (firstVisibleIndex(state.stepIndex - 1, -1) < 0);
}

/* Reactie op het kiezen van een optie: toon eventueel uitleg (reask) of note. */
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
    state.answers[q.id] = el("q-textinput").value.trim();
  } else {
    const checked = document.querySelector('input[name="' + q.id + '"]:checked');
    if (!checked) {
      flashHint("Kies een antwoord om verder te gaan.");
      return;
    }
    const opt = q.options.find((o) => o.value === checked.value);
    if (opt && opt.reask) {
      // Twijfel: blijf op de vraag, toon uitleg, vraag opnieuw.
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

/* Als een eerder antwoord een vraag onzichtbaar maakt, wis het foutieve pad. */
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

/* ---- Verzamel verplichtingen op basis van de antwoorden ---- */
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
  return [...ids];
}

/* ---- Resultaatscherm ---- */
function renderResult() {
  const ids = collectObligationIds();
  const items = ids.map((id) => ({ id, ...OBLIGATIONS[id] }));

  const flags = items.filter((it) => it.redFlag);
  const regular = items.filter((it) => !it.redFlag);

  // Onderwerpregel.
  const subjectParts = [];
  if (state.toolName) subjectParts.push("Tool: " + state.toolName);
  if (state.vendorName) subjectParts.push("Leverancier: " + state.vendorName);
  if (state.answers.v7) subjectParts.push("Eigenaar: " + state.answers.v7);
  el("result-subject").textContent = subjectParts.join("  ·  ");
  el("result-subject").hidden = subjectParts.length === 0;

  // Conclusie in één zin.
  const conclusionEl = el("result-conclusion");
  if (flags.length > 0) {
    conclusionEl.textContent =
      "Nog niet klaar voor het register: zoek eerst de rode vlaggen uit voordat je deze tool in gebruik neemt.";
    conclusionEl.className = "conclusion conclusion-warn";
  } else {
    conclusionEl.textContent =
      "Geen rode vlaggen. Regel onderstaande punten, leg ze vast en neem de tool op in het AI-register.";
    conclusionEl.className = "conclusion conclusion-ok";
  }

  // Rode vlaggen.
  const flagsCard = el("result-flags");
  if (flags.length > 0) {
    flagsCard.hidden = false;
    el("flags-list").innerHTML = "";
    flags.forEach((it) => el("flags-list").appendChild(renderArtefact(it)));
  } else {
    flagsCard.hidden = true;
  }

  // Reguliere artefacten, gegroepeerd per thema.
  const groupsWrap = el("result-groups");
  groupsWrap.innerHTML = "";
  THEME_ORDER.forEach((themeKey) => {
    const groupItems = regular.filter((it) => it.theme === themeKey);
    if (groupItems.length === 0) return;

    const card = document.createElement("div");
    card.className = "card group";

    const h3 = document.createElement("h3");
    h3.textContent = THEMES[themeKey];
    card.appendChild(h3);

    const ul = document.createElement("ul");
    ul.className = "artefact-list";
    groupItems.forEach((it) => ul.appendChild(renderArtefact(it)));
    card.appendChild(ul);

    groupsWrap.appendChild(card);
  });
}

function renderArtefact(it) {
  const li = document.createElement("li");
  li.className = "artefact";

  const title = document.createElement("p");
  title.className = "artefact-title";
  title.textContent = it.title;
  li.appendChild(title);

  const note = document.createElement("p");
  note.className = "artefact-note";
  note.textContent = it.note;
  li.appendChild(note);

  if (it.askAt && ASK_AT_LABEL[it.askAt]) {
    const ask = document.createElement("p");
    ask.className = "artefact-ask";
    ask.textContent = ASK_AT_LABEL[it.askAt];
    li.appendChild(ask);
  }
  return li;
}

/* ---- Platte tekst voor klembord ---- */
function buildPlainText() {
  const ids = collectObligationIds();
  const items = ids.map((id) => ({ id, ...OBLIGATIONS[id] }));
  const flags = items.filter((it) => it.redFlag);
  const regular = items.filter((it) => !it.redFlag);

  const lines = [];
  lines.push("AI-INTAKECHECKLIST");
  if (state.toolName) lines.push("Tool: " + state.toolName);
  if (state.vendorName) lines.push("Leverancier: " + state.vendorName);
  if (state.answers.v7) lines.push("Eigenaar: " + state.answers.v7);
  lines.push("");

  lines.push(el("result-conclusion").textContent);
  lines.push("");

  if (flags.length > 0) {
    lines.push("RODE VLAGGEN: EERST UITZOEKEN");
    flags.forEach((it) => pushArtefactLines(lines, it));
    lines.push("");
  }

  THEME_ORDER.forEach((themeKey) => {
    const groupItems = regular.filter((it) => it.theme === themeKey);
    if (groupItems.length === 0) return;
    lines.push(THEMES[themeKey].toUpperCase());
    groupItems.forEach((it) => pushArtefactLines(lines, it));
    lines.push("");
  });

  lines.push("---");
  lines.push(DISCLAIMER);
  return lines.join("\n");
}

function pushArtefactLines(lines, it) {
  lines.push("- " + it.title);
  lines.push("  " + it.note);
  if (it.askAt && ASK_AT_LABEL[it.askAt]) lines.push("  (" + ASK_AT_LABEL[it.askAt] + ")");
}

/* ---- Acties op het resultaatscherm ---- */
function initResultActions() {
  el("btn-copy").addEventListener("click", async () => {
    const text = buildPlainText();
    const status = el("copy-status");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        legacyCopy(text);
      }
      status.textContent = "Gekopieerd naar het klembord.";
    } catch (err) {
      legacyCopy(text);
      status.textContent = "Gekopieerd naar het klembord.";
    }
    setTimeout(() => { status.textContent = ""; }, 4000);
  });

  el("btn-print").addEventListener("click", () => window.print());

  el("btn-restart").addEventListener("click", () => {
    // Wis alle state uit het geheugen.
    state.answers = {};
    state.toolName = "";
    state.vendorName = "";
    state.stepIndex = 0;
    el("start-form").reset();
    showScreen("start");
  });
}

/* Terugval voor browsers zonder clipboard-API. */
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

/* ---- Opstarten ---- */
document.addEventListener("DOMContentLoaded", () => {
  initStart();
  initQuestionNav();
  initResultActions();
});
