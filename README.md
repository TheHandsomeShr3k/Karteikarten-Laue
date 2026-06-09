# Karteikarten — Versicherungsaufsichtsrecht

Interaktive Lern-WebApp zum Versicherungsaufsichtsrecht & Versicherungsvertrieb (DHBW, BWL Versicherung). Reines HTML/CSS/JS — **kein Build, kein Server**. Optimiert für iPhone & iPad.

## Zwei Stapel

- **Karteikarten** — 91 Karten, gefiltert nach 10 Themenblöcken (C.1–C.10)
- **Prüfungsfragen** — 16 Klausuraufgaben (Teil D)

## Zwei Modi

- **Lernen** — Karte antippen / Leertaste → Lösung aufdecken (3D-Flip)
- **Prüfung** — eigene Antwort eintippen → „Lösung vergleichen” zeigt deine Antwort neben der Musterlösung

## Bedienung

- **Gewusst / Nochmal** markieren — Fortschritt je Stapel lokal gespeichert
- **Mischen**, **Nur unbekannte**, **Zurücksetzen**
- **Wischen** links/rechts zum Blättern (Touch)
- Tastatur: `Leertaste` aufdecken · `← →` blättern · `1` Nochmal · `2` Gewusst · `S` Mischen · `T` Design
- Hell-/Dunkel-Design, Safe-Area-Unterstützung (Notch/Home-Indicator)

## Dateien

`index.html` · `styles.css` · `app.js` · `cards.js` (Inhalt aus der Lernunterlage)

## Auf GitHub Pages veröffentlichen

1. Repository anlegen (z. B. `versicherungsaufsicht-karten`).
1. Die vier Dateien ins **Repo-Root** hochladen (`index.html` muss im Root liegen).
1. **Settings → Pages → Source: „Deploy from a branch” → `main` / `/ (root)` → Save**.
1. Nach ein paar Minuten: `https://<benutzername>.github.io/<repo>/`.

Lokal testen: `index.html` einfach im Browser öffnen.

## Inhalt ändern

`cards.js` enthält `FLASHCARDS` und `EXAMQS` als Listen `{ id, cat, label, q, a }`.
In `q`/`a` markiert `**Text**` Schlüsselbegriffe (Frage = Leuchtmarker, Antwort = fett).
