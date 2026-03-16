import { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import { TYPE_CONFIG } from '../utils';

/* ─── Default centre: Altenfurt/Moorenbrunn ─── */
const DEFAULT_CENTER = [49.405, 11.178];
const DEFAULT_ZOOM = 15;

/* ─── Distance rings (metres) ─── */
const RING_DISTANCES = [20, 40, 60, 80, 100, 120, 140, 160, 180, 200];

/* ─── Sub-component that syncs map to imperative commands ─── */
function MapController({ mapRef }) {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
}

/* ─── Heading cone as a DivIcon overlay ─── */
function HeadingCone({ position, heading }) {
  const map = useMap();
  const markerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [map]);

  useEffect(() => {
    if (!position || heading == null) {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    const S = 300, H = 150;           // SVG size & centre
    const spread = 82;                 // half-width of cone at far edge (~60° opening)
    const topY = 8;
    const leftX = H - spread;
    const rightX = H + spread;
    // Arc radius: distance from centre to cone corner
    const r = Math.hypot(H - leftX, H - topY).toFixed(1);

    const html = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}"
        style="display:block;transform:rotate(${heading}deg);transform-origin:center;">
  <defs>
    <linearGradient id="hcgrad" gradientUnits="userSpaceOnUse" x1="${H}" y1="${H}" x2="${H}" y2="${topY}">
      <stop offset="0%"   stop-color="#1A73E8" stop-opacity="0.0"/>
      <stop offset="28%"  stop-color="#1A73E8" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#1A73E8" stop-opacity="0.65"/>
    </linearGradient>
    <filter id="hcarrow-shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="1" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
    </filter>
  </defs>

  <!-- Cone body (arc-capped) -->
  <path d="M${H},${H} L${leftX},${topY} A${r},${r} 0 0,1 ${rightX},${topY} Z"
        fill="url(#hcgrad)"/>

  <!-- Cone edge lines -->
  <line x1="${H}" y1="${H}" x2="${leftX}" y2="${topY}"
        stroke="#1A73E8" stroke-opacity="0.55" stroke-width="2"/>
  <line x1="${H}" y1="${H}" x2="${rightX}" y2="${topY}"
        stroke="#1A73E8" stroke-opacity="0.55" stroke-width="2"/>

  <!-- Arc cap -->
  <path d="M${leftX},${topY} A${r},${r} 0 0,1 ${rightX},${topY}"
        stroke="#1A73E8" stroke-opacity="0.65" stroke-width="2.5" fill="none"
        stroke-linecap="round"/>

  <!-- Arrowhead – prominent, white-outlined, with shadow -->
  <polygon points="${H},2 ${H - 18},32 ${H + 18},32"
           fill="#1A73E8" stroke="white" stroke-width="4"
           stroke-linejoin="round" filter="url(#hcarrow-shadow)">
    <animate attributeName="opacity" values="1;0.65;1" dur="1.8s" repeatCount="indefinite"/>
  </polygon>
</svg>`;

    const icon = L.divIcon({
      className: '',
      iconSize: [S, S],
      iconAnchor: [H, H],
      html,
    });

    // Reuse existing marker to avoid flicker on heading updates
    if (markerRef.current) {
      markerRef.current.setIcon(icon);
      markerRef.current.setLatLng([position.lat, position.lng]);
    } else {
      markerRef.current = L.marker([position.lat, position.lng], {
        icon,
        interactive: false,
        zIndexOffset: -100,
      }).addTo(map);
    }
  }, [map, position, heading]);

  return null;
}

/* ─── GPS Pulse overlay (DivIcon for CSS animation) ─── */
function GpsPulse({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    const icon = L.divIcon({
      className: '',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      html: `<div style="width:40px;height:40px;position:relative;background:transparent">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(26,115,232,0.35);animation:gps-dot-pulse 2s ease-out infinite"></div>
      </div>`,
    });

    const marker = L.marker([position.lat, position.lng], {
      icon,
      interactive: false,
      zIndexOffset: -200,
    }).addTo(map);

    return () => {
      map.removeLayer(marker);
    };
  }, [map, position]);

  return null;
}

/* ─── GPS Dot overlay ─── */
function GpsDot({ position }) {
  if (!position) return null;
  return (
    <>
      {/* Accuracy ring */}
      <Circle
        center={[position.lat, position.lng]}
        radius={position.accuracy || 10}
        pathOptions={{
          color: 'rgba(26,115,232,0.20)',
          fillColor: 'rgba(26,115,232,0.08)',
          fillOpacity: 1,
          weight: 1,
        }}
      />
      {/* Blue dot */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={14}
        pathOptions={{
          fillColor: '#1A73E8',
          fillOpacity: 1,
          color: '#fff',
          weight: 4,
          opacity: 1,
        }}
      />
      {/* Inner reflex */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={4}
        pathOptions={{
          fillColor: '#fff',
          fillOpacity: 0.35,
          color: 'transparent',
          weight: 0,
        }}
      />
    </>
  );
}

/* ─── Distance rings around GPS ─── */
function DistanceRings({ position }) {
  if (!position) return null;
  return (
    <>
      {RING_DISTANCES.map((d) => (
        <Circle
          key={d}
          center={[position.lat, position.lng]}
          radius={d}
          pathOptions={{
            color: 'rgba(26,115,232,0.50)',
            weight: 2,
            dashArray: '8 8',
            fill: false,
          }}
        />
      ))}
    </>
  );
}

/* ─── Ring Labels (rendered as DivIcon markers) ─── */
function RingLabels({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    const markers = RING_DISTANCES.map((d) => {
      // Place label to the right of ring
      const point = map.latLngToLayerPoint([position.lat, position.lng]);
      const metersPerPx =
        (40075016.686 * Math.cos((position.lat * Math.PI) / 180)) /
        Math.pow(2, map.getZoom() + 8);
      const pxOffset = d / metersPerPx;
      const labelPoint = L.point(point.x + pxOffset, point.y);
      const labelLatLng = map.layerPointToLatLng(labelPoint);

      const icon = L.divIcon({
        className: '',
        html: `<span style="font:600 11px 'DM Sans',sans-serif;color:rgba(26,115,232,0.85);white-space:nowrap;background:rgba(255,255,255,0.75);padding:1px 4px;border-radius:4px">${d}m</span>`,
        iconSize: [36, 16],
        iconAnchor: [0, 8],
      });

      return L.marker(labelLatLng, { icon, interactive: false }).addTo(map);
    });

    return () => markers.forEach((m) => map.removeLayer(m));
  }, [map, position, map.getZoom?.()]);

  return null;
}

/* ─── Main HydrantMap component ─── */
export default function HydrantMap({
  hydrants,
  activeFilter,
  gpsPosition,
  heading,
  nearestHydrant,
  mapRef,
  selectedHydrantId,
  showRings,
  onHydrantSelect,
}) {
  const filteredHydrants = useMemo(() => {
    if (!activeFilter) return hydrants;
    return hydrants.filter((h) => h.typ === activeFilter);
  }, [hydrants, activeFilter]);

  const nearestId = gpsPosition ? nearestHydrant?.id : null;

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      maxZoom={20}
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <MapController mapRef={mapRef} />

      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={20}
      />

      {/* Hydrant points */}
      {filteredHydrants.map((h) => {
        const cfg = TYPE_CONFIG[h.typ] || TYPE_CONFIG.UH;
        const isNearest = h.id === nearestId;
        const isSelected = h.id === selectedHydrantId;
        return (
          <CircleMarker
            key={h.id}
            center={[h.latitude, h.longitude]}
            radius={isSelected ? 12 : isNearest ? 9 : 7}
            pathOptions={{
              fillColor: cfg.color,
              fillOpacity: 1,
              color: isSelected ? '#121212' : '#fff',
              weight: isSelected ? 3 : 1.8,
              opacity: 1,
            }}
            eventHandlers={{
              click: () => onHydrantSelect?.(h),
            }}
          />
        );
      })}

      {selectedHydrantId != null &&
        filteredHydrants
          .filter((h) => h.id === selectedHydrantId)
          .map((h) => {
            const color = (TYPE_CONFIG[h.typ] || TYPE_CONFIG.UH).color;
            return (
              <CircleMarker
                key={`selected-ring-${h.id}`}
                center={[h.latitude, h.longitude]}
                radius={17}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.12,
                  color,
                  weight: 2,
                  opacity: 0.75,
                }}
              />
            );
          })}

      {/* Nearest hydrant highlight ring */}
      {nearestHydrant && (
        <CircleMarker
          center={[nearestHydrant.latitude, nearestHydrant.longitude]}
          radius={14}
          pathOptions={{
            fillColor: (TYPE_CONFIG[nearestHydrant.typ] || TYPE_CONFIG.UH).color,
            fillOpacity: 0.18,
            color: (TYPE_CONFIG[nearestHydrant.typ] || TYPE_CONFIG.UH).color,
            weight: 1.5,
            opacity: 0.45,
          }}
        />
      )}

      {/* Line to nearest hydrant */}
      {gpsPosition && nearestHydrant && (
        <>
          <Polyline
            positions={[
              [gpsPosition.lat, gpsPosition.lng],
              [nearestHydrant.latitude, nearestHydrant.longitude],
            ]}
            pathOptions={{
              color: '#1A73E8',
              weight: 2.5,
              dashArray: '8 6',
              opacity: 0.85,
            }}
          />
          {/* Endpoint dot at hydrant end */}
          <CircleMarker
            center={[nearestHydrant.latitude, nearestHydrant.longitude]}
            radius={4}
            pathOptions={{
              fillColor: (TYPE_CONFIG[nearestHydrant.typ] || TYPE_CONFIG.UH).color,
              fillOpacity: 1,
              color: 'transparent',
              weight: 0,
            }}
          />
        </>
      )}

      {/* GPS position elements */}
      <GpsPulse position={gpsPosition} />
      <GpsDot position={gpsPosition} />
      {showRings && <DistanceRings position={gpsPosition} />}
      {showRings && <RingLabels position={gpsPosition} />}
      <HeadingCone position={gpsPosition} heading={heading} />
    </MapContainer>
  );
}
