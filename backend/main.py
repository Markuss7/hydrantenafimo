"""FastAPI backend – serves hydrant data parsed from CSV."""

from __future__ import annotations

import csv
import math
import re
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Hydranten Nürnberg API", version="0.1.4")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# CSV parsing
# ---------------------------------------------------------------------------

CSV_PATH = Path(__file__).resolve().parent.parent / "Assets" / "260301-Hydranten-Fi-Al-Mo-formatiert.csv"

BAUART_MAP = {
    "(UH) Unterflurhydrant": "UH",
    "(OH) Überflurhydrant": "OH",
    "( ) Gartenhydrant": "GH",
    "(TWB) Trinkwasserbrunnen": "TWB",
}


def _parse_float(val: str) -> Optional[float]:
    """Parse a German-formatted float: '50,625' → 50.625, '657476.452 m' → 657476.452."""
    if not val or not val.strip():
        return None
    cleaned = val.strip().replace(" m", "").replace("\xa0", "")
    cleaned = cleaned.replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def _load_hydrants() -> list[dict]:
    hydrants: list[dict] = []
    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.reader(f, delimiter=";")
        headers = next(reader)
        for row in reader:
            if len(row) < 33:
                continue
            lat = _parse_float(row[31])
            lng = _parse_float(row[32])
            if lat is None or lng is None:
                continue

            bauart_raw = row[5].strip()
            typ = BAUART_MAP.get(bauart_raw, "UH")

            leistung = _parse_float(row[7])
            nennweite = _parse_float(row[9])

            hydrants.append(
                {
                    "id": int(row[30]) if row[30].strip() else None,
                    "latitude": lat,
                    "longitude": lng,
                    "typ": typ,
                    "typ_label": bauart_raw,
                    "strasse": row[16].strip(),
                    "hausnr": row[18].strip(),
                    "hausnr_zusatz": row[19].strip(),
                    "ortsteil": row[15].strip(),
                    "gemeinde": row[14].strip(),
                    "plz": row[13].strip(),
                    "teilnetz": row[3].strip(),
                    "druckzone": row[4].strip(),
                    "leitungsfunktion": row[0].strip(),
                    "eigentum": row[2].strip(),
                    "leistung_m3h": leistung,
                    "nennweite_dn": nennweite,
                    "nenndruck": row[10].strip(),
                    "verbindungsart": row[11].strip(),
                    "einbaujahr": int(row[12]) if row[12].strip().isdigit() else None,
                    "vorschieber": row[6].strip().lower() == "ja",
                }
            )
    return hydrants


HYDRANTS = _load_hydrants()


# ---------------------------------------------------------------------------
# Haversine helper
# ---------------------------------------------------------------------------

def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Distance in metres between two lat/lon points."""
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/api/hydrants")
def get_hydrants(typ: Optional[str] = Query(None, description="Filter by type: UH, OH, GH, TWB")):
    """Return all hydrants, optionally filtered by type."""
    if typ:
        return [h for h in HYDRANTS if h["typ"] == typ.upper()]
    return HYDRANTS


@app.get("/api/hydrants/{hydrant_id}")
def get_hydrant(hydrant_id: int):
    """Return a single hydrant by ID."""
    for h in HYDRANTS:
        if h["id"] == hydrant_id:
            return h
    return {"error": "Not found"}, 404


@app.get("/api/hydrants/nearest")
def get_nearest(
    lat: float = Query(..., description="User latitude"),
    lng: float = Query(..., description="User longitude"),
    typ: Optional[str] = Query(None),
    limit: int = Query(5, ge=1, le=50),
):
    """Return the N nearest hydrants to a lat/lng point."""
    pool = HYDRANTS if not typ else [h for h in HYDRANTS if h["typ"] == typ.upper()]
    ranked = sorted(pool, key=lambda h: _haversine(lat, lng, h["latitude"], h["longitude"]))
    result = []
    for h in ranked[:limit]:
        entry = {**h, "distance_m": round(_haversine(lat, lng, h["latitude"], h["longitude"]), 1)}
        result.append(entry)
    return result


@app.get("/api/stats")
def get_stats():
    """Basic dataset statistics."""
    types: dict[str, int] = {}
    ortsteile: dict[str, int] = {}
    for h in HYDRANTS:
        types[h["typ"]] = types.get(h["typ"], 0) + 1
        ortsteile[h["ortsteil"]] = ortsteile.get(h["ortsteil"], 0) + 1
    return {
        "total": len(HYDRANTS),
        "by_type": types,
        "by_ortsteil": ortsteile,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
