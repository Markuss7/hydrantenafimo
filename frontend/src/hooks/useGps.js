import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for GPS position tracking with high accuracy.
 * Returns { position: {lat, lng, accuracy} | null, error, hasfix }
 */
export function useGps() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const watchId = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation wird nicht unterstützt');
      return;
    }

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setError(null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    );

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return { position, error, hasFix: position !== null };
}

/**
 * Custom hook for device compass heading.
 * Returns heading in degrees (0-360, 0=North), or null.
 */
export function useCompass() {
  const [heading, setHeading] = useState(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const permissionGranted = useRef(false);

  const requestPermission = useCallback(async () => {
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const result = await DeviceOrientationEvent.requestPermission();
        if (result === 'granted') {
          permissionGranted.current = true;
          setNeedsPermission(false);
          startListening();
        }
      } catch {
        // User denied
      }
    }
  }, []);

  function startListening() {
    const handler = (e) => {
      // iOS: webkitCompassHeading is more reliable
      if (e.webkitCompassHeading !== undefined) {
        setHeading(e.webkitCompassHeading);
      } else if (e.alpha !== null) {
        // Android: alpha is reverse (0=North when alpha=0)
        setHeading(360 - e.alpha);
      }
    };
    window.addEventListener('deviceorientation', handler, true);
    return () => window.removeEventListener('deviceorientation', handler, true);
  }

  useEffect(() => {
    // Check if iOS permission flow is needed
    if (typeof DeviceOrientationEvent !== 'undefined' &&
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      setNeedsPermission(true);
    } else {
      // Android / desktop: just listen
      const cleanup = startListening();
      return cleanup;
    }
  }, []);

  return { heading, needsPermission, requestPermission };
}
