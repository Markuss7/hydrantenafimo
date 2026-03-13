# Hydranten Nürnberg — Product Specification

**Version:** v0.1.4 (draft)
**Status:** In Entwicklung
**Plattform:** Browser · Single-File HTML5
**Kartenbibliothek:** Leaflet.js 1.9.4
**Datensatz:** 353 Hydranten · Altenfurt, Moorenbrunn, Fischbach

---

## 1. Projektübersicht

Die Hydranten-Karte ist eine schlanke, single-file HTML-Webanwendung zur Visualisierung von 353 Feuerwehr-Hydranten im Nürnberger Süden. Sie erlaubt Feuerwehrkräften und Einsatzpersonal, über GPS den nächstgelegenen Hydranten sofort zu identifizieren, zu filtern und eine Route zu starten.

### 1.1 Zielgruppe

- Feuerwehr-Einsatzkräfte unterwegs
- Leitstellen-Personal zur Vorbereitung
- Technische Koordinatoren

### 1.2 Kernziele

- Schnelle Orientierung: nächster Hydrant in < 2 Sekunden auffindbar
- GPS-Integration mit Kompass-Heading und Entfernungsringen
- Offline-fähig: alle Daten embedded, kein Backend nötig
- Performance: 353 Punkte flüssig auf mobilen Geräten

---

## 2. Technischer Stack

| Bereich | Detail |
|---|---|
| Delivery | Single HTML-Datei (kein Build-Step, kein Backend) |
| Karten-Framework | Leaflet.js 1.9.4 (CDN) |
| Kartenmaterial | OpenStreetMap tile.openstreetmap.org |
| Schrift | DM Sans (Google Fonts) |
| GPS | navigator.geolocation.watchPosition — High Accuracy |
| Kompass | DeviceOrientationEvent (alpha) — iOS Permission-Flow enthalten |
| Rendering | Canvas-Layer (Alle-Modus) + Leaflet-Marker (Filter-Modi) |
| Datenspeicherung | Embedded JSON im HTML — kein Server, kein localStorage |

> **Migrations-Notiz:** Ursprünglich mit Cesium.js 1.114.0 gebaut. Aufgrund von Web-Worker/Blob-URL-Fehlern in eingebetteten Browser-Kontexten zu Leaflet.js migriert. Leaflet läuft vollständig im Main-Thread ohne Worker-Dependencies.

---

## 3. Datensatz

### 3.1 Quelle & Format

Quelldatei: `hydranten.csv` — 353 Einträge mit Feldern: `Latitude`, `Longitude`, `Bauart`, `Straßenname`, `Hausnr`, `Ortsteilname`.

### 3.2 Hydrant-Typen

| Kürzel | Bezeichnung | Farbe |
|---|---|---|
| UH | Unterflurhydrant | `#1E88E5` Blau |
| OH | Überflurhydrant | `#E53935` Rot |
| GH | Gartenhydrant | `#43A047` Grün |
| TWB | Trinkwasserbrunnen | `#FB8C00` Orange |

---

## 4. UI / UX Spezifikation

Design-Sprache: **Google Material Design**. Schrift: DM Sans. Kein App-Header. Karte füllt den gesamten Bildschirm.

---

### 4.1 Permissions-Dialog beim App-Start ⬅ NEU (v0.1.4)

**Anforderung:** Sobald die Seite geladen wird, soll die App **sofort und aktiv** um GPS- und Kompass-Zugriff bitten — nicht erst bei der ersten Interaktion.

**Verhalten:**

- `navigator.geolocation.watchPosition()` wird unmittelbar beim `DOMContentLoaded`-Event aufgerufen → Browser zeigt GPS-Permission-Dialog automatisch
- `DeviceOrientationEvent.requestPermission()` (iOS) wird **direkt danach** getriggert, ohne auf einen User-Tap zu warten
  - Da iOS einen User-Gesture erfordert: einen unauffälligen "Kompass aktivieren"-Toast oder Mini-Banner einblenden, der beim ersten Tap verschwindet und dabei die Permission anfrägt
- Android: `deviceorientation`-Event funktioniert ohne Permission — direkt abhören
- Reihenfolge: GPS zuerst (automatisch) → Kompass direkt danach oder beim ersten Tap

**UI-Feedback:**

- GPS-FAB pulsiert (Animation) solange GPS noch nicht eingeht
- Nach erfolgreichem GPS-Fix: FAB wird solid, Puls stoppt
- Toast (unten, leicht über Footer): `"Tippen Sie auf die Karte um den Kompass zu aktivieren"` — nur auf iOS sichtbar, verschwindet nach erstem Tap

---

### 4.2 Filter-Pill-Bar (oben, zentriert)

Position: `absolute top: 12px`, horizontal zentriert.

| Pill | Filter | Rendering |
|---|---|---|
| Alle (Standard) | Alle 353 Punkte | Canvas-Layer |
| Überflur H. | Nur OH-Typen | Leaflet-Marker |
| Unterflur H. | Nur UH-Typen | Leaflet-Marker |

- **Aktiver Zustand:** Farbiger Border + leicht getönter Hintergrund
- **Inaktiv:** Weißer Hintergrund, kein Border, Material-Schatten

---

### 4.3 Hydrant-Punkte (Marker-Stil)

- Größe normal: Radius **7px**
- Weiße Outline: `1.8px` stroke
- Drop-Shadow: `dx=0 dy=1.5 stdDeviation=1.8 rgba(0,0,0,0.28)`
- Nächster Hydrant (highlighted): Radius **9px** + semi-transparenter Farbring außen
- Farbe nach Typ (siehe Abschnitt 3.2)

---

### 4.4 GPS-Position & Heading ⬅ ÜBERARBEITET (v0.1.4)

**GPS-Dot — prominenter:**

- Radius: **12px** (bisher: 9px) → deutlich größer
- Weiße Outline: **3px** (bisher: 2.5px)
- Drop-Shadow: `dx=0 dy=2 stdDeviation=3 rgba(0,0,0,0.4)` → stärkerer Schatten
- Farbe: `#1A73E8` (Google-Blau)
- Innerer weißer Reflex-Kreis: Radius 4px, opacity 0.35

**Heading-Indikator (Kompassrichtung) — prominenter:**

- SVG-Kegel: **90×90px** (bisher: 70×70px) → größer und auffälliger
- Gradient: `#1A73E8` opacity 0.7 → transparent (bisher: 0.55)
- Öffnungswinkel: ca. 40° (breiter Fächer, klar erkennbar)
- Aktualisierung: via `deviceorientation.alpha` (Kompass), nicht GPS-Velocity

**Entfernungsringe:**

- 5 konzentrische Kreise: 20m, 40m, 60m, 80m, 100m
- Linienfarbe: `rgba(26,115,232,0.28)` (etwas dunkler als zuvor)
- Linienbreite: **1.2px** (bisher: 1px)
- DashArray: `"5 5"` (fein gestrichelt)
- Labels: rechts neben dem Ring, 9px DM Sans, `rgba(26,115,232,0.60)`

---

### 4.5 Linie zum nächsten Hydranten ⬅ ÜBERARBEITET (v0.1.4)

**Prominenter:**

- Farbe: `#1A73E8`
- Breite: **2.5px** (bisher: 1.6px)
- DashArray: `"8 6"` (größere Striche, besser lesbar)
- Opacity: **0.85** (bisher: 0.65)
- Endpunkt-Marker: kleiner Farbkreis am Hydrant-Ende der Linie (Radius 4px, gefüllt, kein Border) — visuell ankert die Linie am Ziel

---

### 4.6 Zoom-Controls

- Weiße Material-Card, border-radius 14px, Schatten
- Zwei Buttons: `+` und `−` (44×44px)
- Position: `right: 12px, bottom: ~190px` (oberhalb Footer und FAB)

---

### 4.7 GPS-FAB ⬅ ÜBERARBEITET (v0.1.4)

- Rundes Button: **52×52px**, Hintergrund `#1A1A1A`
- SVG-Icon: Standort-Kreuz (Google-Maps-Stil)
- Label darunter: `"Mein Standort"` (9.5px, DM Sans, semi-opak)
- Disabled: opacity 0.45, pulsiert (CSS-Animation) bis GPS-Fix
- Aktiv: solid, kein Puls

**Aktion beim Tippen — angepasst (v0.1.4):**

- Zoom-Level beim Zentrieren: **Zoom 18** (bisher: 17) → näher heranzoomen
- `map.flyTo(gpsLL, 18, { animate: true, duration: 0.7 })`

---

### 4.8 Versions-Badge

- Position: `absolute top: 10px right: 12px, z-index: 3000`
- Text: `"v0.1.4"` — DM Sans Mono, 10px, `rgba(0,0,0,0.32)`
- `pointer-events: none`

---

### 4.9 Footer-Card (unten, immer sichtbar)

| Element | Beschreibung |
|---|---|
| Position | `absolute bottom: 0`, full width |
| Border-radius | `20px 20px 0 0` |
| Handle | 36×4px, oben zentriert |
| Zeile 1 | Typ-Label (Overline) |
| Zeile 2 | Straße + Hausnummer, 22px fett |
| Zeile 3 | Ortsteil, 14px grau |
| Distanz | 28px fett, Luftlinie in m oder km |
| Route-Button | Schwarz, rounded-12, öffnet Google Maps Navigation |

Zeigt permanent den nächsten Hydranten — auch ohne GPS (dann: nächster zum Kartenmittelpunkt). Aktualisiert bei GPS-Update und Filter-Wechsel.

---

## 5. Performance-Strategie

### 5.1 Canvas-Layer (Alle-Modus)

Im Default-Modus ("Alle") werden alle 353 Punkte über einen custom `Leaflet.Layer` mit native Canvas-API gerendert. Kein DOM-Element pro Punkt.

- `Leaflet.Layer.extend()` — `onAdd`, `onRemove`, `_redraw`, `_reposition`
- `canvas.getContext("2d")` — `arc()` pro Punkt, `fillStyle` nach Typ
- Events: `moveend`, `zoomend` → `_redraw()`; `move` → `_reposition()` (nur translate)
- Click-Handling: `map.on("click")` prüft Screen-Distanz aller Punkte < 20px → Popup

### 5.2 Leaflet-Marker (Filter-Modi)

- Nur bei OH oder UH-Filter aktiv (max. ~150–200 Punkte)
- DivIcon mit inline SVG (shadow, ring, fill)
- Popup: Typ + Adresse, Material-Stil

### 5.3 Wechsel zwischen Modi

```
renderMarkers()
```

Räumt immer erst den aktiven Layer (canvas oder markerLayer) ab, dann baut neu. Kein Memory-Leak durch unbegrenzte Layer-Akkumulation.

---

## 6. Feature-Log & Versionierung

### v0.1.0 — Initialversion (Leaflet-Migration)

- Leaflet.js als Ersatz für Cesium.js (Web-Worker-Fehler behoben)
- 353 Hydranten als `circleMarker`, farbcodiert nach Typ
- GPS-Tracking (`watchPosition`), Accuracy-Circle
- Dark-Theme mit Syne + DM Mono Fonts
- Legende unten links, GPS-Panel unten rechts

### v0.1.1 — GPS & Nearest Hydrant

- Gestrichelte Linie zum nächsten Hydranten
- Nächster Hydrant hervorgehoben (größerer Ring)
- Heading-Indikator (GPS-Velocity-Heading)
- Google Maps GPS-Stil: blauer Dot, weiße Outline, Schatten
- Hydrant-Marker größer, weiße Outline, Drop-Shadow

### v0.1.2 — Material Design Redesign

- Vollständiges UI-Redesign: Google Material Design
- Header entfernt — Karte füllt den Bildschirm
- DM Sans als Systemschrift
- Material-Cards: Zoom-Control, GPS-FAB mit Label "Mein Standort"
- Versions-Badge v0.1.2 oben rechts

### v0.1.3 — Filter & Performance

- Filter-Pill-Bar (Alle / Überflur H. / Unterflur H.) oben zentriert
- Canvas-Layer-Performance für "Alle"-Modus (kein DOM per Punkt)
- Entfernungsringe à 20m um GPS-Standort (5 Ringe, gestrichelt, mit Labels)
- Heading via `DeviceOrientationEvent` (Kompass) statt GPS-Velocity
- iOS `DeviceOrientationEvent.requestPermission()` Flow
- Footer-Card: immer sichtbar, zeigt nächsten Hydranten + Distanz
- Route-Button: öffnet Google Maps Navigation
- Zoom-Buttons nach unten verschoben, benutzerdefiniert
- Punktgröße reduziert (Radius 7 normal / 9 highlighted)

### v0.1.4 — Geplant (diese Spec)

- Permissions-Dialog beim App-Start (GPS + Kompass sofort)
- iOS Kompass-Toast für Permission-Anfrage
- GPS-Dot prominenter: Radius 12px, stärkerer Schatten
- Heading-Kegel prominenter: 90×90px, opacity 0.7
- Linie zum nächsten Hydranten prominenter: 2.5px, opacity 0.85
- GPS-FAB: Zoom 18 statt 17 beim Zentrieren
- GPS-FAB pulsiert bis erster GPS-Fix

---

## 7. Offene Punkte & Roadmap

| Thema | Beschreibung |
|---|---|
| Legende | Kompakte Typ-Legende (Drawer oder Collapsible) |
| Suche | Straßensuche / Adresssuche via Nominatim |
| Offline-Cache | Service Worker für vollständige Offline-Funktion |
| Detail-Ansicht | Side-Sheet oder Fullscreen-Popup pro Hydrant |
| Cluster | Marker-Cluster bei sehr niedrigem Zoom |
| Nacht-Modus | Dunkles Kartenmaterial |
| Export | Nächste Hydranten als PDF/Liste |

---

## 8. Dateien & Abgabe

| Datei | Beschreibung |
|---|---|
| `hydranten_karte.html` | Einzige Delivery-Datei — komplett selbständig, kein Build-Step |
| `hydranten.csv` | Quelldatensatz — 353 Einträge, nicht im Deployment enthalten (embedded) |
| `Hydranten_Spec.md` | Dieses Dokument |

Die HTML-Datei benötigt nur CDN-Zugang (Leaflet, Google Fonts, OSM-Tiles) und einen modernen Browser. Keine Installation, kein Server.
