# Hydranten Nürnberg

Interaktive Karte zur Visualisierung von 353 Feuerwehr-Hydranten im Nürnberger Süden (Altenfurt, Moorenbrunn, Fischbach).

## Projektstruktur

```
├── Assets/                  # Quelldaten & Spezifikation
│   ├── 260301-Hydranten-…-formatiert.csv
│   └── Hydranten_Spec.md
├── backend/                 # FastAPI-Server
│   ├── main.py
│   ├── requirements.txt
│   └── venv/
└── frontend/                # React + Vite
    ├── src/
    │   ├── components/      # UI-Komponenten
    │   ├── hooks/           # GPS & Kompass Hooks
    │   ├── api.js           # API-Client
    │   ├── utils.js         # Hilfsfunktionen
    │   └── App.jsx          # Haupt-App
    └── vite.config.js
```

## Starten

### Backend (FastAPI)

```bash
cd backend
python3 -m venv venv          # nur beim ersten Mal
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install                   # nur beim ersten Mal
npm run dev
```

Die App ist dann unter **http://localhost:5173** erreichbar.  
Das Frontend proxied `/api/*`-Requests automatisch an den Backend-Server auf Port 8000.

## API-Endpunkte

| Endpunkt | Beschreibung |
|---|---|
| `GET /api/hydrants` | Alle Hydranten (optional `?typ=UH\|OH\|GH\|TWB`) |
| `GET /api/hydrants/{id}` | Einzelner Hydrant nach ID |
| `GET /api/hydrants/nearest?lat=…&lng=…` | Nächste Hydranten zu einer Position |
| `GET /api/stats` | Statistiken (Anzahl nach Typ und Ortsteil) |
| `GET /docs` | Swagger-UI (automatisch von FastAPI) |

## Features

- **Leaflet-Karte** mit farbcodierten Hydrantenmarkern (UH=Blau, OH=Rot, GH=Grün, TWB=Orange)
- **Filter-Pill-Bar** (Alle / Überflur / Unterflur / Garten)
- **GPS-Tracking** mit Kompass-Heading und Entfernungsringen
- **Nächster Hydrant**: automatische Berechnung + gestrichelte Richtungslinie
- **Footer-Card**: zeigt permanent Adresse, Distanz und Route-Button (Google Maps)
- **Material Design**: DM Sans Font, Material-Cards, FAB mit Pulse-Animation
- **iOS Kompass-Permission Flow**
