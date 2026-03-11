import { useEffect, useRef, useState } from 'react';
import { TYPE_CONFIG } from '../utils';

export default function FooterCard({
  hydrant,
  distance,
  isOpen = true,
  isExpanded = false,
  onClose,
  onExpandedChange,
  onVisibleHeightChange,
}) {
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef(null);
  const cardRef = useRef(null);

  const beginDrag = (clientY) => {
    dragStartY.current = clientY;
  };

  const updateDrag = (clientY) => {
    if (dragStartY.current == null) {
      return;
    }
    const delta = clientY - dragStartY.current;
    setDragY(Math.max(-180, Math.min(220, delta)));
  };

  const endDrag = () => {
    if (dragY > 110) {
      onClose?.();
      onExpandedChange?.(false);
    } else if (dragY < -60) {
      onExpandedChange?.(true);
    } else if (isExpanded && dragY > 50) {
      onExpandedChange?.(false);
    }
    dragStartY.current = null;
    setDragY(0);
  };

  useEffect(() => {
    if (!isOpen) {
      onExpandedChange?.(false);
    }
  }, [isOpen, onExpandedChange]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !onVisibleHeightChange) {
      return;
    }

    const notify = () => {
      const cardHeight = el.offsetHeight || 0;
      const visible = isOpen ? Math.max(0, cardHeight - dragY) : 0;
      onVisibleHeightChange(visible);
    };

    notify();
    const observer = new ResizeObserver(notify);
    observer.observe(el);

    return () => observer.disconnect();
  }, [isOpen, dragY, onVisibleHeightChange]);

  const cardTransform = isOpen
    ? `translateY(${dragY}px)`
    : 'translateY(calc(100% + 8px))';

  const commonProps = {
    ref: cardRef,
    className: `footer-card ${isOpen ? '' : 'is-closed'} ${isExpanded ? 'is-expanded' : ''}`.trim(),
    style: { transform: cardTransform },
    onMouseMove: (e) => updateDrag(e.clientY),
    onMouseUp: endDrag,
    onMouseLeave: endDrag,
    onTouchMove: (e) => updateDrag(e.touches[0].clientY),
    onTouchEnd: endDrag,
  };

  const nennweite = hydrant?.nennweite_dn != null ? Math.round(hydrant.nennweite_dn) : '—';
  const leistung = hydrant?.leistung_m3h != null ? `${Number(hydrant.leistung_m3h).toFixed(1)}` : '—';
  const latitude = hydrant?.latitude != null ? hydrant.latitude.toFixed(6) : '—';
  const longitude = hydrant?.longitude != null ? hydrant.longitude.toFixed(6) : '—';

  const hoseCount = distance != null ? Math.max(1, Math.ceil(distance / 20)) : null;

  if (!hydrant) {
    return (
      <div {...commonProps}>
        <button className="footer-close-btn" onClick={() => onClose?.()} aria-label="Bottom Sheet schliessen">
          ×
        </button>
        <div
          className="footer-handle"
          onMouseDown={(e) => beginDrag(e.clientY)}
          onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
          onClick={() => onExpandedChange?.(!isExpanded)}
        />
        <div className="footer-content">
          <div className="footer-left">
            <div className="footer-caption">Nächster Hydrant</div>
            <div className="footer-title">Wird geladen…</div>
            <div className="footer-address">—</div>
          </div>
          <div className="footer-right">
            <div className="footer-metric-chip">-- m</div>
            <div className="footer-submetric-chip">-- x 20m</div>
          </div>
        </div>
      </div>
    );
  }

  const cfg = TYPE_CONFIG[hydrant.typ] || TYPE_CONFIG.UH;
  const addr = [hydrant.strasse, hydrant.hausnr, hydrant.hausnr_zusatz]
    .filter(Boolean)
    .join(' ');

  return (
    <div {...commonProps}>
      <button className="footer-close-btn" onClick={() => onClose?.()} aria-label="Bottom Sheet schliessen">
        ×
      </button>
      <div
        className="footer-handle"
        onMouseDown={(e) => beginDrag(e.clientY)}
        onTouchStart={(e) => beginDrag(e.touches[0].clientY)}
        onClick={() => onExpandedChange?.(!isExpanded)}
      />
      <div className="footer-content">
        <div className="footer-left">
          <div className="footer-caption">Nächster Hydrant</div>
          <div className={`footer-title ${hydrant.typ.toLowerCase()}`}>{cfg.label}</div>
          <div className="footer-address">{addr || '—'}</div>
        </div>
        <div className="footer-right">
          {distance != null && (
            <div className="footer-metric-chip">{Math.round(distance)} m</div>
          )}
          {hoseCount != null && (
            <div className="footer-submetric-chip">{hoseCount} x 20m</div>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="footer-extra">
          <div className="footer-extra-row">
            <span>Nennweite</span>
            <strong>{nennweite === '—' ? '—' : `${nennweite} mm`}</strong>
          </div>
          <div className="footer-extra-row">
            <span>Leistung (m³/h)</span>
            <strong>{leistung}</strong>
          </div>
          <div className="footer-extra-divider" />
          <div className="footer-extra-row">
            <span>Latitude</span>
            <strong>{latitude}</strong>
          </div>
          <div className="footer-extra-row">
            <span>Longitude</span>
            <strong>{longitude}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
