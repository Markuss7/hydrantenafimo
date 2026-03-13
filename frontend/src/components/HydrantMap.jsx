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
const RING_DISTANCES = [20, 40, 60, 80, 100];

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

  useEffect(() => {
    if (!position || heading == null) return;

    const icon = L.divIcon({
      className: '',
      iconSize: [90, 90],
      iconAnchor: [45, 45],
      html: `<svg width="90" height="90" viewBox="0 0 90 90" style="transform:rotate(${heading}deg);transform-origin:center;">
        <defs>
          <radialGradient id="hcone" cx="50%" cy="100%" r="100%">
            <stop offset="0%" stop-color="#1A73E8" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#1A73E8" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path d="M45,45 L25,0 L65,0 Z" fill="url(#hcone)"/>
      </svg>`,
    });

    const marker = L.marker([position.lat, position.lng], {
      icon,
      interactive: false,
      zIndexOffset: -100,
    }).addTo(map);

    return () => {
      map.removeLayer(marker);
    };
  }, [map, position, heading]);

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
        radius={12}
        pathOptions={{
          fillColor: '#1A73E8',
          fillOpacity: 1,
          color: '#fff',
          weight: 3,
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
      zoomControl={false}
      attributionControl={false}
      style={{ width: '100%', height: '100%' }}
    >
      <MapController mapRef={mapRef} />

      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
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
      <GpsDot position={gpsPosition} />
      {showRings && <DistanceRings position={gpsPosition} />}
      {showRings && <RingLabels position={gpsPosition} />}
      <HeadingCone position={gpsPosition} heading={heading} />
    </MapContainer>
  );
}
