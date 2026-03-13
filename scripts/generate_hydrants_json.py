import csv, json
from pathlib import Path

base = Path(__file__).resolve().parent.parent
csv_path = base / 'Assets' / '260301-Hydranten-Fi-Al-Mo-formatiert.csv'
out_path = base / 'frontend' / 'public' / 'hydrants.json'

BAUART_MAP = {
    '(UH) Unterflurhydrant': 'UH',
    '(OH) Überflurhydrant': 'OH',
    '( ) Gartenhydrant': 'GH',
    '(TWB) Trinkwasserbrunnen': 'TWB',
}


def parse_float(val):
    if not val or not val.strip():
        return None
    cleaned = val.strip().replace(' m', '').replace('\xa0', '').replace(',', '.')
    try:
        return float(cleaned)
    except ValueError:
        return None


hydrants = []
with open(csv_path, encoding='utf-8') as f:
    reader = csv.reader(f, delimiter=';')
    next(reader)
    for row in reader:
        if len(row) < 33:
            continue
        lat = parse_float(row[31]); lng = parse_float(row[32])
        if lat is None or lng is None:
            continue
        bauart_raw = row[5].strip(); typ = BAUART_MAP.get(bauart_raw, 'UH')
        leistung = parse_float(row[7]); nennweite = parse_float(row[9])
        hydrants.append({
            'id': int(row[30]) if row[30].strip() else None,
            'latitude': lat,
            'longitude': lng,
            'typ': typ,
            'typ_label': bauart_raw,
            'strasse': row[16].strip(),
            'hausnr': row[18].strip(),
            'hausnr_zusatz': row[19].strip(),
            'ortsteil': row[15].strip(),
            'gemeinde': row[14].strip(),
            'plz': row[13].strip(),
            'teilnetz': row[3].strip(),
            'druckzone': row[4].strip(),
            'leitungsfunktion': row[0].strip(),
            'eigentum': row[2].strip(),
            'leistung_m3h': leistung,
            'nennweite_dn': nennweite,
            'nenndruck': row[10].strip(),
            'verbindungsart': row[11].strip(),
            'einbaujahr': int(row[12]) if row[12].strip().isdigit() else None,
            'vorschieber': row[6].strip().lower() == 'ja',
        })

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(hydrants, f, ensure_ascii=False, indent=2)

print('dumped', len(hydrants), 'hydrants to', out_path)
