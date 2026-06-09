# Karteikarten — Versicherungsaufsichtsrecht

Interaktive Lern-WebApp zum Versicherungsaufsichtsrecht & Versicherungsvertrieb (DHBW, BWL Versicherung). Reines HTML/CSS/JS — **kein Build, kein Server**. Optimiert für iPhone & iPad.

## Zwei Stapel

- **Karteikarten** — 91 Karten, gefiltert nach 10 Themenblöcken (C.1–C.10)
- **Prüfungsfragen** — 16 Klausuraufgaben (Teil D)

## Zwei Modi

- **Lernen** — Karte antippen / Leertaste → Lösung aufdecken (Flip)
- **Prüfung** — eigene Antwort eintippen → „Lösung vergleichen” zeigt deine Antwort neben der Musterlösung

## Lernplanung (SM-2 / Anki-Stil)

Jede Karte wird einzeln terminiert. Nach dem Aufdecken bewertest du mit vier Buttons; darauf steht jeweils das **nächste Intervall** als Vorschau.

| Button | Neue Karte | Wiederholung | Ease |
|---|---|---|---|
| **Nochmal** | 1 Min | Reset auf 1 Min | −0,20 |
| **Schwer** | 8 Min | Intervall × 1,2 | −0,15 |
| **Gut** | 10 Min | Intervall × Ease | ±0 |
| **Einfach** | 15 Min | Intervall × Ease × 1,3 | +0,15 |

- **Ease** startet bei **2,5** und wird bei jeder Bewertung nachgeführt (Untergrenze 1,3). Sie steuert, wie stark „Gut“ und „Einfach“ das Intervall strecken.
- **Fälligkeit:** Nach der Bewertung bekommt die Karte ein Fälligkeitsdatum (`jetzt + Intervall`). Die Queue zeigt **fällige + neue Karten, nach Fälligkeit sortiert** (neue zuerst).
- **Nochmal** setzt das Intervall auf 1 Min und legt die Karte ein paar Plätze später erneut in die Sitzung.
- **Nichts fällig?** Dann erscheint ein **Countdown** bis zur nächsten fälligen Karte plus **„Vorziehen“**, um trotzdem vorab zu lernen. Läuft der Countdown ab, wird die fällige Karte automatisch geladen.
- Ein kleiner Chip auf der Karte zeigt den Status: **Neu**, **Fällig** oder das aktuelle **Intervall**.

Der Lernstand wird je Stapel lokal im Browser gespeichert (`localStorage`).

## Bedienung

- **Nur fällige / Alle Karten** umschalten · **Mischen** · **Zurücksetzen** (setzt die Planung des aktuellen Stapels zurück)
- **Wischen** links/rechts zum Blättern (Touch)
- Tastatur: `Leertaste` aufdecken · `← →` blättern · `1` Nochmal · `2` Schwer · `3` Gut · `4` Einfach · `S` Mischen · `T` Design
- Drei Designs per Tipp auf das Symbol oben rechts: **Hell → Dunkel → OLED**

### OLED-Darkmode

Eigenes Design mit **echtem Schwarz (#000)** für Seite und Karten, damit die Pixel auf OLED-Displays abschalten. Nur winzige Bedienelemente behalten einen Hauch Grau, damit sie auf Schwarz sichtbar bleiben.

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

## Planungs-Parameter anpassen

Die Werte stehen gebündelt oben in `app.js`:

```js
var NEW_STEPS = { again: 1, hard: 8, good: 10, easy: 15 }; // Startintervalle (Min)
var EASE_START = 2.5;   // Start-Ease
var EASE_MIN   = 1.3;   // Untergrenze
var EASE_DELTA = { again: -0.20, hard: -0.15, good: 0, easy: 0.15 };
var HARD_MULT  = 1.2;   // Schwer: × 1,2
var EASY_BONUS = 1.3;   // Einfach: × Ease × 1,3
var AGAIN_MIN  = 1;     // Nochmal: Reset (Min)
```
