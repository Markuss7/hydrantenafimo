export default function GpsFab({ hasFix, onClick, bottom }) {
  return (
    <div className="gps-fab-wrapper" style={bottom != null ? { bottom } : undefined}>
      <button
        className={`gps-fab ${hasFix ? '' : 'disabled'}`}
        onClick={onClick}
        aria-label="Mein Standort"
      >
        {!hasFix && <span className="pulse-ring" />}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="4" fill="#fff" />
          <path
            d="M12 2v3m0 14v3M2 12h3m14 0h3"
            stroke="#fff"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="12" r="8" stroke="#fff" strokeWidth="1.5" fill="none" />
        </svg>
      </button>
      <span className="gps-fab-label">Mein Standort</span>
    </div>
  );
}
