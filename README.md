# WP-web.apps
Apps und Tools über Internet Explorer 11 an Windows Phone 8.1 nutzbar

Reines HTML, CSS und ES5-JavaScript ohne Build-Schritt und ohne externe Abhängigkeiten. Jede App ist eine eigene Seite; Daten bleiben im `localStorage` des Browsers (Präfix `wp.`).

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `index.html` | Startseite mit Suche, gruppiert |
| `assets/common.js` | Theme, Speicher, Touch-Helfer (`onPress`, `onSwipe`), Zufall (`crypto`/`msCrypto`), Formatierung, App-Liste `TOOLS` |
| `assets/style.css` | Layout für IE11 Mobile (Flexbox mit `-ms-`-Präfix, kein Grid, keine CSS-Variablen) |
| `tools/NAME/` | System-Werkzeuge |
| `apps/NAME/` | Spiele, Alltag, Technik & Lernen |
| `einstellungen/` | Hell/Dunkel, OLED, Daten löschen |

## Apps

**Spiele:** Minesweeper, 2048, Snake, Tetris (Touch-Tasten), Sudoku, Memory, Schiebepuzzle, Tic-Tac-Toe

**Alltag:** Notizen, To-do-Liste, Stoppuhr, Timer & Pomodoro, Würfel & Münze, Passwortgenerator, Einheitenrechner, Prozentrechner, Trinkgeldrechner, Zähler, Datum & Fristen, Textwerkzeuge

**Technik & Lernen:** Subnetzrechner (IPv4), Zahlensysteme mit Übungsmodus, Ports, Lernkarten Netzwerk, Befehle (Windows/Linux), Buchstabieren & Morse

## Neue App anlegen

1. Ordner `apps/NAME/index.html` nach dem Muster einer bestehenden App anlegen (`ROOT="../../"`).
2. Eintrag in `TOOLS` in `assets/common.js` und Kachel in `index.html` ergänzen.
3. Nur ES5 verwenden (kein `let`/`const`, keine Pfeilfunktionen, kein `Array.prototype.find/includes`, kein `Element.closest` – dafür gibt es `closest()` aus `common.js`).

@Edding-cc 2026 Alle Rechte vorbehalten. All rights reserved.
