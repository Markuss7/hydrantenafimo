export default function ZoomControls({ onZoomIn, onZoomOut, bottom, showRings, onToggleRings, ringsHidden, zoomHidden }) {
  return (
    <div className="zoom-controls-wrap" style={bottom != null ? { bottom } : undefined}>
      <button
        className={`rings-toggle ${showRings ? 'active' : ''}`}
        onClick={onToggleRings}
        aria-label="Abstandsringe ein/ausblenden"
        style={{ opacity: ringsHidden ? 0 : 1, pointerEvents: ringsHidden ? 'none' : undefined, transition: 'opacity 0.25s ease' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="8" x2="4" y2="16" />
          <line x1="20" y1="8" x2="20" y2="16" />
          <line x1="9.5" y1="10" x2="9.5" y2="14" />
          <line x1="14.5" y1="10" x2="14.5" y2="14" />
        </svg>
      </button>
      <div className="zoom-controls" style={{ opacity: zoomHidden ? 0 : 1, pointerEvents: zoomHidden ? 'none' : undefined, transition: 'opacity 0.25s ease' }}>
        <button onClick={onZoomIn} aria-label="Zoom in">+</button>
        <button onClick={onZoomOut} aria-label="Zoom out">−</button>
      </div>
    </div>
  );
}
