"use strict";

/* =========================================================================
   PRAKTIJKCHECKLIST: DE BASIS OP ORDE
   -------------------------------------------------------------------------
   Organisatiebrede punten die je één keer voor de hele praktijk regelt,
   los van individuele tools. Vinkjes leven uitsluitend in het geheugen van
   de pagina; er wordt niets opgeslagen of verzonden.

   DATA-BLOK  (dit deel pas je aan om punten of teksten te wijzigen)
   RENDER     (dit deel hoef je niet aan te raken)
   ========================================================================= */

const PRAKTIJK_INTRO =
  "Deze punten regel je één keer voor de hele organisatie, los van " +
  "individuele tools. Samen dekken ze de kern van de AVG, de AI Act, de " +
  "gebruikersverantwoordelijkheid onder de MDR en de richtlijnen van de " +
  "beroepsverenigingen (NHG, LHV, KNMG), en sluiten ze aan op wat " +
  "zorgverzekeraars bij digitale zorg verwachten.";

const PRAKTIJK_GROUPS = [
  {
    title: "Registratie en overzicht",
    items: [
      {
        id: "register",
        title: "Centraal AI- en toepassingenregister",
        note: "Eén register met alle digitale tools en AI-toepassingen van de praktijk, met per tool een eigenaar en een evaluatiedatum. De intakechecklist levert per tool een registerregel aan.",
      },
      {
        id: "verwerkingsregister",
        title: "Verwerkingsregister actueel",
        note: "Het register van verwerkingsactiviteiten (AVG) is compleet en wordt bijgewerkt zodra er een tool bij komt of afvalt.",
      },
    ],
  },
  {
    title: "Leveranciers en contracten",
    items: [
      {
        id: "verwerkersovereenkomsten",
        title: "Verwerkersovereenkomst met elke leverancier",
        note: "Voor elke leverancier die persoonsgegevens verwerkt is een verwerkersovereenkomst gesloten en vindbaar.",
      },
      {
        id: "datalocatie",
        title: "EU-datalocatie per leverancier bevestigd",
        note: "Van elke leverancier is schriftelijk bevestigd waar de gegevens draaien; bij verwerking buiten de EU is een doorgiftetoets gedaan.",
      },
      {
        id: "nen7510",
        title: "Informatiebeveiliging per leverancier aangetoond",
        note: "Elke leverancier toont naleving van NEN 7510 of ISO 27001 aan met een geldig certificaat.",
      },
      {
        id: "verzekeraars",
        title: "Verwachtingen van zorgverzekeraars in beeld",
        note: "De inkoop- en contractvoorwaarden van zorgverzekeraars rond digitale zorg zijn bekend en worden meegenomen bij de keuze voor nieuwe tools.",
      },
    ],
  },
  {
    title: "Mensen en verantwoordelijkheid",
    items: [
      {
        id: "eindverantwoordelijkheid",
        title: "Menselijke eindverantwoordelijkheid vastgelegd",
        note: "Voor alle tools geldt en is vastgelegd: de zorgverlener controleert de output en blijft eindverantwoordelijk.",
      },
      {
        id: "geletterdheid",
        title: "AI-geletterdheid als doorlopend programma",
        note: "Medewerkers weten wat de gebruikte tools wel en niet kunnen (AI Act artikel 4): instructie bij indiensttreding en periodieke opfrissing.",
      },
    ],
  },
  {
    title: "Procedures",
    items: [
      {
        id: "incident",
        title: "Datalek- en incidentprocedure",
        note: "Er is een procedure voor het melden, vastleggen en evalueren van datalekken en incidenten met digitale tools (AVG artikel 33 en 34).",
      },
      {
        id: "dpiaWerkwijze",
        title: "Vaste DPIA-werkwijze",
        note: "Het is duidelijk wanneer een DPIA nodig is en wie daarbij betrokken wordt (FG of privacyadviseur). De intakechecklist geeft per tool een eerste aanzet.",
      },
    ],
  },
  {
    title: "FG en FRIA: proportioneel geregeld",
    items: [
      {
        id: "fgBesluit",
        title: "FG-besluit gemotiveerd vastgelegd",
        note: "Vuistregel van de Autoriteit Persoonsgegevens: bij grootschalige verwerking van gezondheidsgegevens (voor huisartsenpraktijken: meer dan 10.000 patiënten) is een FG verplicht. Daaronder in beginsel niet. Leg het besluit gemotiveerd vast en laat het bij twijfel toetsen.",
      },
      {
        id: "friaCheck",
        title: "FRIA-afweging vastgelegd",
        note: "De grondrechtentoets uit de AI Act (artikel 27) geldt voor bepaalde organisaties bij hoog-risico-AI; voor een reguliere huisartsenpraktijk in beginsel niet. Leg vast waarom die wel of niet nodig is en laat het bij twijfel toetsen.",
      },
    ],
  },
];

const PRAKTIJK_DISCLAIMER =
  "Dit is een hulpmiddel om te bepalen wat er geregeld moet worden. Het is " +
  "geen juridisch advies. De punten over FG en FRIA zijn uitgangspunten, " +
  "geen oordeel over jouw situatie; leg besluiten gemotiveerd vast en laat " +
  "ze bij twijfel toetsen.";


/* =========================================================================
   ================  RENDERLOGICA: hieronder niet nodig aan te passen  ======
   ========================================================================= */

const checked = new Set(); // alleen in het geheugen

const el = (id) => document.getElementById(id);

function totalItems() {
  return PRAKTIJK_GROUPS.reduce((n, g) => n + g.items.length, 0);
}

function updateCounter() {
  el("praktijk-counter").textContent =
    checked.size + " van " + totalItems() + " punten op orde";
}

function renderChecklist() {
  el("praktijk-intro").textContent = PRAKTIJK_INTRO;
  el("praktijk-disclaimer").textContent = PRAKTIJK_DISCLAIMER;

  const wrap = el("praktijk-groups");
  wrap.innerHTML = "";
  PRAKTIJK_GROUPS.forEach((group) => {
    const card = document.createElement("div");
    card.className = "card group";

    const h3 = document.createElement("h3");
    h3.textContent = group.title;
    card.appendChild(h3);

    const ul = document.createElement("ul");
    ul.className = "artefact-list";

    group.items.forEach((item) => {
      const li = document.createElement("li");
      li.className = "artefact check-item";

      const label = document.createElement("label");
      label.className = "check-label";
      label.setAttribute("for", "check-" + item.id);

      const input = document.createElement("input");
      input.type = "checkbox";
      input.id = "check-" + item.id;
      input.addEventListener("change", () => {
        if (input.checked) checked.add(item.id);
        else checked.delete(item.id);
        li.classList.toggle("check-done", input.checked);
        updateCounter();
      });

      const text = document.createElement("span");
      const title = document.createElement("span");
      title.className = "artefact-title";
      title.textContent = item.title;
      const note = document.createElement("span");
      note.className = "artefact-note";
      note.textContent = item.note;
      text.appendChild(title);
      text.appendChild(note);

      label.appendChild(input);
      label.appendChild(text);
      li.appendChild(label);
      ul.appendChild(li);
    });

    card.appendChild(ul);
    wrap.appendChild(card);
  });

  updateCounter();
}

/* ---- Platte tekst voor klembord ---- */
function buildPraktijkText() {
  const lines = [];
  lines.push("PRAKTIJKCHECKLIST: DE BASIS OP ORDE");
  lines.push(checked.size + " van " + totalItems() + " punten op orde");
  lines.push("");
  PRAKTIJK_GROUPS.forEach((group) => {
    lines.push(group.title.toUpperCase());
    group.items.forEach((item) => {
      lines.push((checked.has(item.id) ? "[x] " : "[ ] ") + item.title);
      lines.push("    " + item.note);
    });
    lines.push("");
  });
  lines.push("---");
  lines.push(PRAKTIJK_DISCLAIMER);
  return lines.join("\n");
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

/* ---- Opstarten (idempotent) ---- */
let praktijkInitialized = false;
function initPraktijk() {
  if (praktijkInitialized) return;
  praktijkInitialized = true;
  renderChecklist();

  el("btn-copy").addEventListener("click", async () => {
    const text = buildPraktijkText();
    const status = el("copy-status");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        legacyCopy(text);
      }
    } catch (err) {
      legacyCopy(text);
    }
    status.textContent = "Gekopieerd naar het klembord.";
    setTimeout(() => { status.textContent = ""; }, 4000);
  });

  el("btn-print").addEventListener("click", () => window.print());
}
if (document.readyState !== "loading") {
  initPraktijk();
} else {
  document.addEventListener("DOMContentLoaded", initPraktijk);
}
