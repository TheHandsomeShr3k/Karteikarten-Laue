/* =========================================================
   Karteikarten-WebApp — Logik (Vanilla JS, kein Build nötig)
   ========================================================= */
(function () {
  "use strict";

  // ---- Kurzbezeichnungen & Farben je Themenblock ----
  var SHORT = {
    "C.1": "Grundlagen", "C.2": "Behörden & Quellen", "C.3": "Solvency II",
    "C.4": "Zulassung", "C.5": "Organisation", "C.6": "Laufende Aufsicht",
    "C.7": "Vertrieb", "C.8": "Jahresbericht", "C.9": "Beispiel-Fälle", "C.10": "Detailwissen"
  };
  var COLOR = {
    "C.1": "#3f6fb0", "C.2": "#7a5bb0", "C.3": "#1f8a8a", "C.4": "#c0612e", "C.5": "#2e8b6b",
    "C.6": "#b0463f", "C.7": "#a8852a", "C.8": "#4f7d3a", "C.9": "#a14d86", "C.10": "#5b6b8c"
  };

  // ---- LocalStorage (auf eigener Seite erlaubt; defensiv) ----
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---- State ----
  var known = new Set(store.get("kk-known", []));
  var filter = "all";
  var onlyUnknown = false;
  var deck = [];
  var idx = 0;
  var flipped = false;
  var finished = false;

  // ---- DOM ----
  var $ = function (s) { return document.querySelector(s); };
  var filtersEl = $("#filters");
  var stageEl = $("#stage");
  var barEl = $("#bar");
  var counterEl = $("#counter");
  var prevBtn = $("#prev");
  var flipBtn = $("#flip");
  var nextBtn = $("#next");
  var goodBtn = $("#good");
  var againBtn = $("#again");
  var shuffleBtn = $("#shuffle");
  var unknownBtn = $("#onlyUnknown");
  var resetBtn = $("#reset");
  var themeBtn = $("#theme");

  // ---- Helpers ----
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function fmt(s, tag) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<" + tag + ">$1</" + tag + ">"); }
  function categories() {
    var seen = [], set = {};
    FLASHCARDS.forEach(function (c) { if (!set[c.cat]) { set[c.cat] = 1; seen.push(c.cat); } });
    return seen;
  }
  function scope() { return FLASHCARDS.filter(function (c) { return filter === "all" || c.cat === filter; }); }

  function buildDeck(shuffle) {
    deck = scope().filter(function (c) { return !onlyUnknown || !known.has(c.id); });
    if (shuffle) {
      for (var i = deck.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
      }
    }
    idx = 0; flipped = false; finished = deck.length === 0;
  }

  // ---- Filter chips ----
  function renderFilters() {
    var cats = categories();
    var html = '<button class="chip" data-f="all" aria-pressed="' + (filter === "all") + '">Alle <span class="n">' + FLASHCARDS.length + "</span></button>";
    cats.forEach(function (cat) {
      var n = FLASHCARDS.filter(function (c) { return c.cat === cat; }).length;
      html += '<button class="chip" data-f="' + cat + '" title="' + esc(cat + " — " + (FLASHCARDS.find(function (c) { return c.cat === cat; }).label)) + '" aria-pressed="' + (filter === cat) + '" style="--cat:' + COLOR[cat] + '">' +
        esc(SHORT[cat] || cat) + ' <span class="n">' + n + "</span></button>";
    });
    filtersEl.innerHTML = html;
    Array.prototype.forEach.call(filtersEl.querySelectorAll(".chip"), function (b) {
      b.addEventListener("click", function () {
        filter = b.getAttribute("data-f");
        buildDeck(false); renderFilters(); render();
      });
    });
    // aktiver Chip bekommt seine Themenfarbe als Rahmen
    var active = filtersEl.querySelector('[data-f="' + filter + '"]');
    if (active && filter !== "all") active.style.background = COLOR[filter], active.style.borderColor = COLOR[filter], active.style.color = "#fff";
  }

  // ---- Progress ----
  function renderProgress() {
    var sc = scope();
    var done = sc.filter(function (c) { return known.has(c.id); }).length;
    var pct = sc.length ? Math.round(done / sc.length * 100) : 0;
    barEl.style.width = pct + "%";
    if (finished) {
      counterEl.innerHTML = "<b>" + done + "</b> / " + sc.length + " gewusst";
    } else {
      counterEl.innerHTML = "Karte <b>" + (idx + 1) + "</b> / " + deck.length + " &nbsp;·&nbsp; " + done + " gewusst";
    }
  }

  // ---- Card ----
  function render() {
    renderProgress();
    if (finished) { renderDone(); syncButtons(); return; }
    var c = deck[idx];
    var tag = (c.cat + " · " + (SHORT[c.cat] || ""));
    var isKnown = known.has(c.id);

    stageEl.innerHTML =
      '<div class="card' + (flipped ? " flip" : "") + (isKnown ? " known" : "") + '" id="card" style="--cat:' + (COLOR[c.cat] || "#16243f") + '">' +
        '<div class="face front">' +
          '<div class="meta"><span class="tag">' + esc(tag) + '</span><span class="pos">#' + c.id + "</span></div>" +
          '<span class="badge-known">✓ gewusst</span>' +
          '<div class="role">Frage</div>' +
          '<div class="q">' + fmt(c.q, "mark") + "</div>" +
          '<div class="hint">Tippen oder <kbd>Leertaste</kbd> &rarr; Lösung</div>' +
        "</div>" +
        '<div class="face back">' +
          '<div class="meta"><span class="tag">' + esc(tag) + '</span><span class="pos">#' + c.id + "</span></div>" +
          '<div class="role">Antwort</div>' +
          '<div class="a">' + fmt(c.a, "strong") + "</div>" +
          '<div class="hint"><kbd>2</kbd> Gewusst · <kbd>1</kbd> Nochmal · <kbd>&rarr;</kbd> Weiter</div>' +
        "</div>" +
      "</div>";

    var card = $("#card");
    card.addEventListener("click", flip);
    fit();
    syncButtons();
  }

  function renderDone() {
    var sc = scope();
    var done = sc.filter(function (c) { return known.has(c.id); }).length;
    var allKnown = done === sc.length && sc.length > 0;
    stageEl.innerHTML =
      '<div class="done">' +
        "<h2>" + (allKnown ? "Stapel gemeistert 🎓" : "Durch!") + "</h2>" +
        "<p>" + done + " von " + sc.length + " Karten als „gewusst" + '\u201C markiert' +
          (filter === "all" ? "" : " im Block " + esc(filter)) + ".</p>" +
        '<div class="row center" style="flex-wrap:wrap">' +
          '<button class="btn primary" id="d-all">Alle wiederholen</button>' +
          '<button class="btn again" id="d-unknown">Nur „Nochmal"-Karten</button>' +
          '<button class="btn" id="d-shuffle">Mischen &amp; neu</button>' +
        "</div>" +
      "</div>";
    $("#d-all").addEventListener("click", function () { onlyUnknown = false; unknownBtn.setAttribute("aria-pressed", "false"); buildDeck(false); render(); });
    $("#d-unknown").addEventListener("click", function () { onlyUnknown = true; unknownBtn.setAttribute("aria-pressed", "true"); buildDeck(false); render(); });
    $("#d-shuffle").addEventListener("click", function () { buildDeck(true); render(); });
  }

  // Höhe an die größere Kartenseite anpassen (sauberes 3D-Flip)
  function fit() {
    var card = $("#card");
    if (!card) return;
    var faces = card.querySelectorAll(".face");
    card.style.height = "0px";
    var h = 0;
    Array.prototype.forEach.call(faces, function (f) { h = Math.max(h, f.scrollHeight); });
    card.style.height = (h + 4) + "px";
  }

  function flip() {
    if (finished) return;
    flipped = !flipped;
    var card = $("#card");
    if (card) card.classList.toggle("flip", flipped);
    syncButtons();
  }

  function grade(good) {
    if (finished) return;
    var c = deck[idx];
    if (good) known.add(c.id); else known.delete(c.id);
    store.set("kk-known", Array.from(known));
    next();
  }

  function next() {
    if (finished) return;
    if (idx < deck.length - 1) { idx++; flipped = false; render(); }
    else { finished = true; render(); }
  }
  function prev() {
    if (finished) { finished = false; idx = Math.max(0, deck.length - 1); flipped = false; render(); return; }
    if (idx > 0) { idx--; flipped = false; render(); }
  }

  function syncButtons() {
    prevBtn.disabled = !finished && idx === 0;
    nextBtn.disabled = finished;
    flipBtn.disabled = finished;
    goodBtn.disabled = finished;
    againBtn.disabled = finished;
    flipBtn.textContent = flipped ? "Frage zeigen" : "Lösung zeigen";
  }

  // ---- Controls ----
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  flipBtn.addEventListener("click", flip);
  goodBtn.addEventListener("click", function () { grade(true); });
  againBtn.addEventListener("click", function () { grade(false); });
  shuffleBtn.addEventListener("click", function () { buildDeck(true); render(); });
  unknownBtn.addEventListener("click", function () {
    onlyUnknown = !onlyUnknown;
    unknownBtn.setAttribute("aria-pressed", String(onlyUnknown));
    unknownBtn.textContent = onlyUnknown ? "Alle Karten" : "Nur unbekannte";
    buildDeck(false); render();
  });
  resetBtn.addEventListener("click", function () {
    if (!confirm("Lernfortschritt zurücksetzen? Alle „gewusst\u201C-Markierungen werden gelöscht.")) return;
    known = new Set(); store.set("kk-known", []);
    onlyUnknown = false; unknownBtn.setAttribute("aria-pressed", "false"); unknownBtn.textContent = "Nur unbekannte";
    buildDeck(false); renderFilters(); render();
  });

  // ---- Theme ----
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    themeBtn.textContent = t === "dark" ? "☀" : "☾";
    themeBtn.setAttribute("aria-label", t === "dark" ? "Helles Design" : "Dunkles Design");
    store.set("kk-theme", t);
  }
  themeBtn.addEventListener("click", function () {
    applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark");
    fit();
  });

  // ---- Keyboard ----
  document.addEventListener("keydown", function (e) {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName || ""))) return;
    var k = e.key;
    if (k === " " || k === "Enter") { e.preventDefault(); flip(); }
    else if (k === "ArrowRight") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (k === "1") { grade(false); }
    else if (k === "2") { grade(true); }
    else if (k.toLowerCase() === "s") { buildDeck(true); render(); }
    else if (k.toLowerCase() === "t") { themeBtn.click(); }
  });

  var rt;
  window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(fit, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  // ---- Init ----
  applyTheme(store.get("kk-theme", (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light"));
  buildDeck(false);
  renderFilters();
  render();
})();
