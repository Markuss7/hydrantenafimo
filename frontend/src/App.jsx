import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import HydrantMap from './components/HydrantMap';
import FilterBar from './components/FilterBar';
import TopSearchBar from './components/TopSearchBar';
import FooterCard from './components/FooterCard';
import ZoomControls from './components/ZoomControls';
import GpsFab from './components/GpsFab';
import VersionBadge from './components/VersionBadge';
import CompassToast from './components/CompassToast';
import { useGps, useCompass } from './hooks/useGps';
import { fetchHydrants } from './api';
import { haversine } from './utils';

function App() {
  const [hydrants, setHydrants] = useState([]);
  const [activeFilter, setActiveFilter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHydrantId, setSelectedHydrantId] = useState(null);
  const [isFooterOpen, setIsFooterOpen] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  const [sheetVisibleHeight, setSheetVisibleHeight] = useState(0);
  const [showRings, setShowRings] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const demo = query.get('demo');

    if (demo === 'rings') {
      setShowRings(true);
      setIsFooterOpen(false);
      setSelectedHydrantId(null);
    } else if (demo === 'selected') {
      setIsFooterOpen(true);
      setIsSheetExpanded(false);
      setShowRings(true);
    } else if (demo === 'expanded') {
      setIsFooterOpen(true);
      setIsSheetExpanded(true);
      setShowRings(true);
    } else if (demo === 'default') {
      setShowRings(false);
      setIsFooterOpen(false);
    }
  }, []);

  const { position: gpsPosition, hasFix } = useGps();
  const { heading, needsPermission, requestPermission } = useCompass();
  const [showCompassToast, setShowCompassToast] = useState(false);

  const mapRef = useRef(null);

  // ── Load hydrants from API ──
  useEffect(() => {
    fetchHydrants()
      .then(setHydrants)
      .catch((err) => console.error('Failed to load hydrants:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const demo = query.get('demo');

    if (hydrants.length && demo === 'selected') {
      setSelectedHydrantId(hydrants[0].id);
      setIsFooterOpen(true);
      setShowRings(true);
    }
  }, [hydrants]);

  // ── Show iOS compass toast if permission needed ──
  useEffect(() => {
    if (needsPermission) {
      setShowCompassToast(true);
    }
  }, [needsPermission]);

  // ── Request compass immediately on page visit ──
  useEffect(() => {
    if (!needsPermission) {
      return;
    }

    requestPermission().then(() => {
      setShowCompassToast(false);
    });
  }, [needsPermission, requestPermission]);

  // ── Find nearest hydrant ──
  const filteredHydrants = useMemo(() => {
    if (!activeFilter) return hydrants;
    return hydrants.filter((h) => h.typ === activeFilter);
  }, [hydrants, activeFilter]);

  const nearestResult = useMemo(() => {
    if (filteredHydrants.length === 0) return { hydrant: null, distance: null };

    let refLat, refLng;
    if (gpsPosition) {
      refLat = gpsPosition.lat;
      refLng = gpsPosition.lng;
    } else if (mapRef.current) {
      const c = mapRef.current.getCenter();
      refLat = c.lat;
      refLng = c.lng;
    } else {
      return { hydrant: filteredHydrants[0], distance: null };
    }

    let best = null;
    let bestDist = Infinity;
    for (const h of filteredHydrants) {
      const d = haversine(refLat, refLng, h.latitude, h.longitude);
      if (d < bestDist) {
        bestDist = d;
        best = h;
      }
    }
    return { hydrant: best, distance: bestDist };
  }, [filteredHydrants, gpsPosition]);

  const selectedHydrant = useMemo(() => {
    if (selectedHydrantId == null) {
      return null;
    }
    return filteredHydrants.find((h) => h.id === selectedHydrantId) || null;
  }, [filteredHydrants, selectedHydrantId]);

  const sheetHydrant = selectedHydrant || nearestResult.hydrant;

  const sheetDistance = useMemo(() => {
    if (!sheetHydrant) {
      return null;
    }

    if (selectedHydrant) {
      if (gpsPosition) {
        return haversine(gpsPosition.lat, gpsPosition.lng, selectedHydrant.latitude, selectedHydrant.longitude);
      }
      if (mapRef.current) {
        const c = mapRef.current.getCenter();
        return haversine(c.lat, c.lng, selectedHydrant.latitude, selectedHydrant.longitude);
      }
      return null;
    }

    return nearestResult.distance;
  }, [sheetHydrant, selectedHydrant, nearestResult.distance, gpsPosition]);

  useEffect(() => {
    if (!selectedHydrant) {
      return;
    }
    setIsFooterOpen(true);
  }, [selectedHydrant]);

  // ── Handlers ──
  const handleCenterGps = useCallback(() => {
    if (gpsPosition && mapRef.current) {
      mapRef.current.flyTo([gpsPosition.lat, gpsPosition.lng], 18, {
        animate: true,
        duration: 0.7,
      });
    }
  }, [gpsPosition]);

  const handleZoomIn = useCallback(() => {
    mapRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    mapRef.current?.zoomOut();
  }, []);

  const focusHydrantOnMap = useCallback((hydrant, options = {}) => {
    const map = mapRef.current;
    if (!map || !hydrant) {
      return;
    }

    const topInset = 164;
    const predictedBottomInset = options.openSheet
      ? Math.max(sheetVisibleHeight, isSheetExpanded ? 340 : 220)
      : isFooterOpen
        ? Math.max(sheetVisibleHeight, isSheetExpanded ? 340 : 220)
        : 0;

    if (options.includeGps && gpsPosition) {
      map.flyToBounds(
        [
          [gpsPosition.lat, gpsPosition.lng],
          [hydrant.latitude, hydrant.longitude],
        ],
        {
          paddingTopLeft: [28, topInset + 24],
          paddingBottomRight: [100, predictedBottomInset + 28],
          maxZoom: 18,
          duration: 0.7,
        }
      );
      return;
    }

    const size = map.getSize();
    const availableHeight = Math.max(80, size.y - topInset - predictedBottomInset - 20);
    const desiredY = topInset + availableHeight / 2;
    const targetZoom = Math.max(map.getZoom(), 17);
    const point = map.project([hydrant.latitude, hydrant.longitude], targetZoom);
    const centerOffset = desiredY - size.y / 2;
    const nextCenter = map.unproject([point.x, point.y - centerOffset], targetZoom);

    map.flyTo(nextCenter, targetZoom, {
      animate: true,
      duration: 0.7,
    });
  }, [gpsPosition, isFooterOpen, isSheetExpanded, sheetVisibleHeight]);

  const handleHydrantSelect = useCallback((hydrant) => {
    setSelectedHydrantId(hydrant.id);
    setIsFooterOpen(true);
    focusHydrantOnMap(hydrant, { openSheet: true });
  }, [focusHydrantOnMap]);

  const handleNearestCta = useCallback(() => {
    if (!nearestResult.hydrant) {
      return;
    }
    setSelectedHydrantId(nearestResult.hydrant.id);
    setIsFooterOpen(true);
    setIsSheetExpanded(false);
    focusHydrantOnMap(nearestResult.hydrant, { includeGps: true, openSheet: true });
  }, [nearestResult.hydrant, focusHydrantOnMap]);

  const gpsBottom = sheetVisibleHeight + 24;
  const zoomBottom = gpsBottom + 210;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <HydrantMap
        hydrants={hydrants}
        activeFilter={activeFilter}
        gpsPosition={gpsPosition}
        heading={heading}
        nearestHydrant={nearestResult.hydrant}
        mapRef={mapRef}
        selectedHydrantId={selectedHydrantId}
        showRings={showRings}
        onHydrantSelect={handleHydrantSelect}
      />

      <TopSearchBar />
      <FilterBar activeFilter={activeFilter} onChange={setActiveFilter} />
      <VersionBadge />
      <ZoomControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        bottom={zoomBottom}
        showRings={showRings}
        onToggleRings={() => setShowRings((v) => !v)}
      />
      <GpsFab hasFix={hasFix} onClick={handleCenterGps} bottom={gpsBottom} />
      <CompassToast visible={showCompassToast} />

      {!isFooterOpen && nearestResult.hydrant && (
        <button className="next-hydrant-cta" onClick={handleNearestCta}>
          Nächster Hydrant
        </button>
      )}

      <FooterCard
        hydrant={sheetHydrant}
        distance={sheetDistance}
        isOpen={isFooterOpen}
        onClose={() => setIsFooterOpen(false)}
        isExpanded={isSheetExpanded}
        onExpandedChange={setIsSheetExpanded}
        onVisibleHeightChange={setSheetVisibleHeight}
      />
    </div>
  );
}

export default App;
