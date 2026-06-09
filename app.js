/* =========================================================
   Karteikarten-WebApp — Logik (Vanilla JS, kein Build)
   Decks: Karteikarten (C.1–C.10) + Prüfungsfragen (Teil D)
   Modi:  Lernen (Halb-Flip, iPad-sicher) + Prüfung (eigene Antwort)
   ========================================================= */
(function () {
  "use strict";

  var SHORT = {
    "C.1": "Grundlagen", "C.2": "Behörden & Quellen", "C.3": "Solvency II",
    "C.4": "Zulassung", "C.5": "Organisation", "C.6": "Laufende Aufsicht",
    "C.7": "Vertrieb", "C.8": "Jahresbericht", "C.9": "Beispiel-Fälle", "C.10": "Detailwissen"
  };
  var COLOR = {
    "C.1": "#3f6fb0", "C.2": "#7a5bb0", "C.3": "#1f8a8a", "C.4": "#c0612e", "C.5": "#2e8b6b",
    "C.6": "#b0463f", "C.7": "#a8852a", "C.8": "#4f7d3a", "C.9": "#a14d86", "C.10": "#5b6b8c"
  };
  var EXAM_COLOR = "#15233c";

  var DECKS = {
    cards: { items: (typeof FLASHCARDS !== "undefined" ? FLASHCARDS : []), cats: true },
    exam:  { items: (typeof EXAMQS !== "undefined" ? EXAMQS : []),       cats: false }
  };

  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  // ---- State ----
  var deckKey = store.get("kk-deck", "cards");
  var mode = store.get("kk-mode", "learn");
  if (!DECKS[deckKey]) deckKey = "cards";
  var filter = "all";
  var onlyUnknown = false;
  var deck = [], idx = 0, revealed = false, finished = false, animating = false;
  var knownStore = {
    cards: new Set(store.get("kk-known-cards", [])),
    exam:  new Set(store.get("kk-known-exam", []))
  };
  var answers = store.get("kk-answers", {});

  // ---- DOM ----
  var $ = function (s) { return document.querySelector(s); };
  var filtersEl = $("#filters"), stageEl = $("#stage"), barEl = $("#bar"), counterEl = $("#counter");
  var prevBtn = $("#prev"), flipBtn = $("#flip"), nextBtn = $("#next"), goodBtn = $("#good"), againBtn = $("#again");
  var shuffleBtn = $("#shuffle"), unknownBtn = $("#onlyUnknown"), resetBtn = $("#reset"), themeBtn = $("#theme");
  var deckSeg = $("#deckSeg"), modeSeg = $("#modeSeg");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Helpers ----
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function fmt(s, tag) { return esc(s).replace(/\*\*(.+?)\*\*/g, "<" + tag + ">$1</" + tag + ">"); }
  function known() { return knownStore[deckKey]; }
  function saveKnown() { store.set("kk-known-" + deckKey, Array.from(known())); }
  function cats() {
    var seen = [], set = {};
    DECKS.cards.items.forEach(function (c) { if (!set[c.cat]) { set[c.cat] = 1; seen.push(c.cat); } });
    return seen;
  }
  function scope() {
    var items = DECKS[deckKey].items;
    if (deckKey === "cards" && filter !== "all") return items.filter(function (c) { return c.cat === filter; });
    return items.slice();
  }
  function colorFor(c) { return deckKey === "exam" ? EXAM_COLOR : (COLOR[c.cat] || EXAM_COLOR); }
  function tagFor(c) { return deckKey === "exam" ? ("Prüfungsfrage " + c.id) : (c.cat + " · " + (SHORT[c.cat] || "")); }
  function ansKey(c) { return deckKey + ":" + c.id; }
  function metaHTML(c) {
    return '<div class="meta"><span class="tag">' + esc(tagFor(c)) + '</span><span class="pos">#' + c.id + "</span></div>";
  }

  function buildDeck(shuffle) {
    deck = scope().filter(function (c) { return !onlyUnknown || !known().has(c.id); });
    if (shuffle) for (var i = deck.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0; var t = deck[i]; deck[i] = deck[j]; deck[j] = t; }
    idx = 0; revealed = false; finished = deck.length === 0; animating = false;
  }

  // ---- Segmented controls + filters ----
  function syncSegs() {
    Array.prototype.forEach.call(deckSeg.children, function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-deck") === deckKey)); });
    Array.prototype.forEach.call(modeSeg.children, function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-mode") === mode)); });
  }
  function renderFilters() {
    if (deckKey !== "cards") { filtersEl.style.display = "none"; filtersEl.innerHTML = ""; return; }
    filtersEl.style.display = "";
    var html = '<button class="chip" data-f="all" aria-pressed="' + (filter === "all") + '">Alle <span class="n">' + DECKS.cards.items.length + "</span></button>";
    cats().forEach(function (cat) {
      var n = DECKS.cards.items.filter(function (c) { return c.cat === cat; }).length;
      var on = filter === cat;
      var st = on ? ' style="background:' + COLOR[cat] + ';border-color:' + COLOR[cat] + ';color:#fff"' : "";
      html += '<button class="chip" data-f="' + cat + '" aria-pressed="' + on + '"' + st + '>' + esc(SHORT[cat] || cat) + ' <span class="n">' + n + "</span></button>";
    });
    filtersEl.innerHTML = html;
    Array.prototype.forEach.call(filtersEl.querySelectorAll(".chip"), function (b) {
      b.addEventListener("click", function () { filter = b.getAttribute("data-f"); buildDeck(false); renderFilters(); render(); });
    });
  }

  function renderProgress() {
    var sc = scope(), done = sc.filter(function (c) { return known().has(c.id); }).length;
    barEl.style.width = (sc.length ? Math.round(done / sc.length * 100) : 0) + "%";
    counterEl.innerHTML = finished
      ? "<b>" + done + "</b> / " + sc.length + " gewusst"
      : "Karte <b>" + (idx + 1) + "</b> / " + deck.length + " · " + done + " gewusst";
  }

  // ---- Card content (single surface) ----
  function surfaceHTML(c, showAnswer) {
    if (!showAnswer) {
      return '<div class="surface">' +
        metaHTML(c) +
        '<span class="badge">✓ gewusst</span>' +
        '<div class="role">Frage</div>' +
        '<div class="q">' + fmt(c.q, "mark") + "</div>" +
        '<div class="hint">Tippen oder <kbd>Leertaste</kbd> → Lösung</div>' +
      "</div>";
    }
    return '<div class="surface">' +
      metaHTML(c) +
      '<div class="role ans">' + (deckKey === "exam" ? "Musterlösung" : "Antwort") + "</div>" +
      '<div class="a">' + fmt(c.a, "strong") + "</div>" +
      '<div class="hint"><kbd>2</kbd> Gewusst · <kbd>1</kbd> Nochmal · <kbd>→</kbd> Weiter</div>' +
    "</div>";
  }

  function render() {
    animating = false;
    syncSegs();
    renderProgress();
    if (finished) { renderDone(); syncButtons(); return; }
    mode === "exam" ? renderExam() : renderLearn();
    syncButtons();
  }

  function renderLearn() {
    var c = deck[idx], col = colorFor(c), isKnown = known().has(c.id);
    stageEl.innerHTML =
      '<div class="flipcard' + (isKnown ? " known" : "") + '" id="card" style="--cat:' + col + '">' +
        surfaceHTML(c, revealed) +
      "</div>";
    $("#card").addEventListener("click", function (e) { if (!e.target.closest("a")) flip(); });
  }

  function renderExam() {
    var c = deck[idx], col = colorFor(c), isKnown = known().has(c.id);
    var saved = answers[ansKey(c)] || "";
    var body;
    if (!revealed) {
      body =
        '<textarea class="exam-field" id="examField" placeholder="Deine Antwort hier eintippen … (Stichpunkte genügen)">' + esc(saved) + "</textarea>" +
        '<div class="hint">Tippe deine Antwort, dann <b>Lösung vergleichen</b>.</div>';
    } else {
      body =
        '<div class="reveal">' +
          '<div class="block mine"><div class="lab">Deine Antwort</div><div class="txt">' +
            (saved.trim() ? esc(saved) : "<em>(keine Antwort eingetippt)</em>") + "</div></div>" +
          '<div class="block model"><div class="lab">Musterlösung</div><div class="txt">' + fmt(c.a, "strong") + "</div></div>" +
          '<div class="hint"><kbd>2</kbd> Gewusst · <kbd>1</kbd> Nochmal · <kbd>→</kbd> Weiter</div>' +
        "</div>";
    }
    stageEl.innerHTML =
      '<div class="examcard surface' + (isKnown ? " known" : "") + '" id="card" style="--cat:' + col + '">' +
        metaHTML(c) +
        '<span class="badge">✓ gewusst</span>' +
        '<div class="role">Prüfungsfrage</div>' +
        '<div class="q">' + fmt(c.q, "mark") + "</div>" +
        body +
      "</div>";
    var f = $("#examField");
    if (f) f.addEventListener("input", function () { answers[ansKey(c)] = f.value; });
  }

  function renderDone() {
    var sc = scope(), done = sc.filter(function (c) { return known().has(c.id); }).length;
    var all = done === sc.length && sc.length > 0;
    stageEl.innerHTML =
      '<div class="done">' +
        "<h2>" + (all ? "Stapel gemeistert 🎓" : "Durch!") + "</h2>" +
        "<p>" + done + " von " + sc.length + " als „gewusst\u201C markiert.</p>" +
        '<div class="row center">' +
          '<button class="btn primary" id="d-all">Alle wiederholen</button>' +
          '<button class="btn again" id="d-unknown">Nur „Nochmal\u201C</button>' +
          '<button class="btn" id="d-shuffle">Mischen</button>' +
        "</div></div>";
    $("#d-all").addEventListener("click", function () { onlyUnknown = false; syncUnknownBtn(); buildDeck(false); render(); });
    $("#d-unknown").addEventListener("click", function () { onlyUnknown = true; syncUnknownBtn(); buildDeck(false); render(); });
    $("#d-shuffle").addEventListener("click", function () { onlyUnknown = false; syncUnknownBtn(); buildDeck(true); render(); });
  }

  // ---- Flip (Halb-Drehung, nur eine Fläche im DOM) ----
  function flip() {
    if (finished) return;
    if (mode === "exam") {
      saveField();
      revealed = !revealed;
      render();
      store.set("kk-answers", answers);
      return;
    }
    if (animating) return;
    revealed = !revealed;
    var card = $("#card");
    if (!card) { render(); return; }
    if (reduceMotion) { card.innerHTML = surfaceHTML(deck[idx], revealed); syncButtons(); return; }
    animating = true;
    card.style.transition = "transform .15s ease-in";
    card.style.transform = "rotateY(90deg)";
    setTimeout(function () {
      card.innerHTML = surfaceHTML(deck[idx], revealed);
      card.style.transition = "none";
      card.style.transform = "rotateY(-90deg)";
      void card.offsetWidth;          // reflow
      card.style.transition = "transform .15s ease-out";
      card.style.transform = "rotateY(0deg)";
      syncButtons();
      setTimeout(function () { animating = false; card.style.transition = ""; card.style.transform = ""; }, 170);
    }, 150);
  }

  function saveField() { var f = $("#examField"); if (f) answers[ansKey(deck[idx])] = f.value; }
  function grade(good) {
    if (finished) return;
    saveField();
    var c = deck[idx];
    if (good) known().add(c.id); else known().delete(c.id);
    saveKnown();
    next();
  }
  function next() {
    if (finished) return;
    saveField(); store.set("kk-answers", answers);
    if (idx < deck.length - 1) { idx++; revealed = false; render(); }
    else { finished = true; render(); }
  }
  function prev() {
    if (finished) { finished = false; idx = Math.max(0, deck.length - 1); revealed = false; render(); return; }
    saveField();
    if (idx > 0) { idx--; revealed = false; render(); }
  }
  function syncUnknownBtn() {
    unknownBtn.setAttribute("aria-pressed", String(onlyUnknown));
    unknownBtn.textContent = onlyUnknown ? "Alle Karten" : "Nur unbekannte";
  }
  function syncButtons() {
    prevBtn.disabled = !finished && idx === 0;
    nextBtn.disabled = finished;
    flipBtn.disabled = finished;
    goodBtn.disabled = finished;
    againBtn.disabled = finished;
    flipBtn.textContent = mode === "exam"
      ? (revealed ? "Antwort ausblenden" : "Lösung vergleichen")
      : (revealed ? "Frage zeigen" : "Lösung zeigen");
  }

  // ---- Events ----
  prevBtn.addEventListener("click", prev);
  nextBtn.addEventListener("click", next);
  flipBtn.addEventListener("click", flip);
  goodBtn.addEventListener("click", function () { grade(true); });
  againBtn.addEventListener("click", function () { grade(false); });
  shuffleBtn.addEventListener("click", function () { saveField(); buildDeck(true); render(); });
  unknownBtn.addEventListener("click", function () { saveField(); onlyUnknown = !onlyUnknown; syncUnknownBtn(); buildDeck(false); render(); });
  resetBtn.addEventListener("click", function () {
    if (!confirm("Fortschritt dieses Stapels zurücksetzen?")) return;
    knownStore[deckKey] = new Set(); saveKnown();
    onlyUnknown = false; syncUnknownBtn(); buildDeck(false); renderFilters(); render();
  });

  Array.prototype.forEach.call(deckSeg.children, function (b) {
    b.addEventListener("click", function () {
      saveField();
      deckKey = b.getAttribute("data-deck"); store.set("kk-deck", deckKey);
      filter = "all"; onlyUnknown = false; syncUnknownBtn();
      buildDeck(false); renderFilters(); render();
    });
  });
  Array.prototype.forEach.call(modeSeg.children, function (b) {
    b.addEventListener("click", function () {
      saveField();
      mode = b.getAttribute("data-mode"); store.set("kk-mode", mode);
      revealed = false; render();
    });
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
  });

  // ---- Keyboard ----
  document.addEventListener("keydown", function (e) {
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || "")) return;
    var k = e.key;
    if (k === " " || k === "Enter") { e.preventDefault(); flip(); }
    else if (k === "ArrowRight") { e.preventDefault(); next(); }
    else if (k === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (k === "1") grade(false);
    else if (k === "2") grade(true);
    else if (k.toLowerCase() === "s") { buildDeck(true); render(); }
    else if (k.toLowerCase() === "t") themeBtn.click();
  });

  // ---- Swipe (Touch) ----
  var tsx = 0, tsy = 0, tracking = false;
  stageEl.addEventListener("touchstart", function (e) {
    if (e.target.closest("textarea")) { tracking = false; return; }
    var t = e.changedTouches[0]; tsx = t.clientX; tsy = t.clientY; tracking = true;
  }, { passive: true });
  stageEl.addEventListener("touchend", function (e) {
    if (!tracking) return; tracking = false;
    var t = e.changedTouches[0], dx = t.clientX - tsx, dy = t.clientY - tsy;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.6) { dx < 0 ? next() : prev(); }
  }, { passive: true });

  // ---- Init ----
  applyTheme(store.get("kk-theme", (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark" : "light"));
  syncUnknownBtn();
  buildDeck(false);
  renderFilters();
  render();
})();
