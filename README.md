# Windows Phone 8.1 Web Apps
Apps und Tools über Internet Explorer 11 an Windows Phone 8.1 nutzbar

Repository: `WP-web.apps`

Reines HTML, CSS und ES5-JavaScript ohne Build-Schritt und ohne externe Abhängigkeiten. Jede App ist eine eigene Seite; Daten bleiben im `localStorage` des Browsers (Präfix `wp.`).

## Aufbau

| Pfad | Inhalt |
| --- | --- |
| `index.html` | Startseite mit Suche, gruppiert |
| `assets/common.js` | Theme, Speicher, Touch-Helfer (`onPress`, `onSwipe`), Zufall (`crypto`/`msCrypto`), Formatierung, App-Liste `TOOLS` |
| `assets/style.css` | Layout für IE11 Mobile (Flexbox mit `-ms-`-Präfix, kein Grid, keine CSS-Variablen) |
| `tools/NAME/` | Werkzeuge (Rechner, FPS, Geräteinfo, Netzwerk, Speedtest, Bildschirmlicht, Palette, Verknüpfungen) |
| `apps/NAME/` | Spiele, Alltag, Technik & Lernen |
| `einstellungen/` | Hell/Dunkel, OLED, Offline-Status, Daten löschen |
| `offline.appcache` | Liste aller Seiten für die Offline-Nutzung (Application Cache) |

## Apps

**Spiele:** Minesweeper, 2048, Snake, Tetris (Touch-Tasten), Sudoku, Memory, Schiebepuzzle, Tic-Tac-Toe

**Alltag:** Notizen, To-do-Liste, Stoppuhr, Timer & Pomodoro, Würfel & Münze, Passwortgenerator, Einheitenrechner, Prozentrechner, Trinkgeldrechner, Zähler, Datum & Fristen, Textwerkzeuge

**Technik & Lernen:** Subnetzrechner (IPv4), Zahlensysteme mit Übungsmodus, Ports, Lernkarten Netzwerk, Befehle (Windows/Linux), Buchstabieren & Morse

## Nicht enthalten

Akku, Sensoren, Blitz-Taschenlampe, Wach halten, Vibration, Geräteliste (Kamera, Mikrofon, USB, Bluetooth), Transkription (WebAssembly/WebGPU) und Netzwerkscan: Der Browser des Windows Phones bietet die nötigen Schnittstellen nicht.

## Offline

Alle Seiten verweisen per `<html manifest="…offline.appcache">` auf den Application Cache, den IE11 auf Windows Phone 8.1 unterstützt. Nach dem ersten Aufruf mit Internet sind alle Apps auf dem Gerät gespeichert und laufen ohne Verbindung (außer Netzwerk und Speedtest). Den Status zeigt `einstellungen/`.

- **Nach jeder Änderung** an einer Datei die Zeile `# Version …` in `offline.appcache` erhöhen, sonst lädt IE11 die neue Fassung nicht.
- Fehlt eine in `offline.appcache` gelistete Datei, schlägt der ganze Offline-Speicher fehl.
- Der Server muss `.appcache` als `text/cache-manifest` ausliefern (GitHub Pages tut das).
- Moderne Browser ignorieren den Application Cache; dort ändert sich nichts.

## Neue App anlegen

1. Ordner `apps/NAME/index.html` nach dem Muster einer bestehenden App anlegen (`ROOT="../../"`, Titel `<title>NAME · Windows Phone 8.1 Web Apps</title>`).
2. Eintrag in `TOOLS` in `assets/common.js` und Kachel in `index.html` ergänzen, Pfad in `offline.appcache` eintragen und dort die Version erhöhen.
3. Nur ES5 verwenden (kein `let`/`const`, keine Pfeilfunktionen, kein `Array.prototype.find/includes`, kein `Element.closest` – dafür gibt es `closest()` aus `common.js`).

@Edding-cc 2026 Alle Rechte vorbehalten. All rights reserved.
