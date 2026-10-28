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
| `tools/NAME/` | Werkzeuge (Rechner, FPS, Geräteinfo, Netzwerk, Speedtest, Datenvolumen, Bildschirmlicht, Palette, Verknüpfungen) |
| `apps/NAME/` | Spiele, Unterhaltung, Alltag, Technik & Lernen |
| `einstellungen/` | Hell/Dunkel, OLED, Offline-Status, Daten löschen |
| `offline.appcache` | Liste aller Seiten für die Offline-Nutzung (Application Cache) |

## Apps

**Spiele:** Minesweeper, 2048, Snake, Tetris (Touch-Tasten), Sudoku, Memory, Schiebepuzzle, Tic-Tac-Toe, Vier in einer Reihe, Reversi, Code knacken, Galgenmännchen, Mauerbrecher, Flattervogel, Farbfolge, Lichter aus, Reaktionstest, Solitär, Kopfrechnen-Duell, Fünf Würfel, Ping-Pong

**Unterhaltung:** Zeichenblock, Glücksrad, Laufschrift, Social (Bluesky und Mastodon)

**Alltag:** Notizen, To-do-Liste, Stoppuhr, Timer & Pomodoro, Würfel & Münze, Passwortgenerator, Einheitenrechner, Prozentrechner, Trinkgeldrechner, Zähler, Datum & Fristen, Textwerkzeuge

**Technik & Lernen:** Subnetzrechner (IPv4), Zahlensysteme mit Übungsmodus, Ports, Lernkarten Netzwerk, Befehle (Windows/Linux), Buchstabieren & Morse

## Social (Bluesky und Mastodon)

`apps/social/` spricht die öffentlichen Schnittstellen direkt aus dem Browser an (CORS, kein eigener Server):

- **Bluesky** ohne Konto: Feed „Discover“, Profile mit Beiträgen (`public.api.bsky.app`). Mit Anmeldung per App-Passwort zusätzlich die eigene Timeline und neue Beiträge (Text, Links und Hashtags werden als Facetten gesetzt). Gespeichert werden nur die Sitzungsschlüssel im `localStorage`, nicht das Passwort. Bilder werden mit `@jpeg` angefordert, weil das CDN sonst WebP liefert, das IE11 nicht anzeigt.
- **Mastodon** nur lesend: Trends, Hashtags und Profile einer frei wählbaren Instanz. Der HTML-Inhalt der Beiträge wird nicht übernommen, sondern auf Text, Absätze, Umbrüche und http(s)-Links reduziert neu aufgebaut. Eine Anmeldung fehlt, weil Mastodon dafür eine eigene Anmeldeseite im Browser öffnet.
- Vor dem ersten Laden erklärt die App, welche Dienste die IP-Adresse sehen; Bilder lassen sich abschalten.

Andere Plattformen (X, Instagram, Facebook, TikTok) sind nicht enthalten: Deren Schnittstellen setzen nach bisherigem Stand registrierte Entwickler-Apps mit geheimen Schlüsseln voraus, die eine statische Seite ohne Server nicht sicher verwahren kann.

## Datenvolumen (Telekom)

`tools/datenvolumen/` fragt `https://pass.telekom.de/api/service/generic/v1/status` per XHR ab. Außerhalb des Telekom-Mobilfunknetzes leitet die Telekom auf eine HTML-Hinweisseite um. pass.telekom.de sendet (zumindest außerhalb des Netzes geprüft) keine CORS-Freigabe und verbietet Einbetten (`X-Frame-Options: deny`). Scheitert die Abfrage im Browser, zeigt das Werkzeug das an und bietet den direkten Link zu pass.telekom.de an. Die technischen Details auf der Seite zeigen, woran es liegt.

## Nicht enthalten

Akku, Sensoren, Blitz-Taschenlampe, Wach halten, Vibration, Geräteliste (Kamera, Mikrofon, USB, Bluetooth), Transkription (WebAssembly/WebGPU) und Netzwerkscan: Der Browser des Windows Phones bietet die nötigen Schnittstellen nicht.

## Offline

Alle Seiten verweisen per `<html manifest="…offline.appcache">` auf den Application Cache, den IE11 auf Windows Phone 8.1 unterstützt. Nach dem ersten Aufruf mit Internet sind alle Apps auf dem Gerät gespeichert und laufen ohne Verbindung (außer Netzwerk, Speedtest, Datenvolumen und Social). Den Status zeigt `einstellungen/`.

- **Nach jeder Änderung** an einer Datei die Zeile `# Version …` in `offline.appcache` erhöhen, sonst lädt IE11 die neue Fassung nicht.
- Fehlt eine in `offline.appcache` gelistete Datei, schlägt der ganze Offline-Speicher fehl.
- Der Server muss `.appcache` als `text/cache-manifest` ausliefern (GitHub Pages tut das).
- Moderne Browser ignorieren den Application Cache; dort ändert sich nichts.

## Neue App anlegen

1. Ordner `apps/NAME/index.html` nach dem Muster einer bestehenden App anlegen (`ROOT="../../"`, Titel `<title>NAME · Windows Phone 8.1 Web Apps</title>`).
2. Eintrag in `TOOLS` in `assets/common.js` und Kachel in `index.html` ergänzen, Pfad in `offline.appcache` eintragen und dort die Version erhöhen.
3. Nur ES5 verwenden (kein `let`/`const`, keine Pfeilfunktionen, kein `Array.prototype.find/includes`, kein `Element.closest` – dafür gibt es `closest()` aus `common.js`).

@Edding-cc 2026 Alle Rechte vorbehalten. All rights reserved.
