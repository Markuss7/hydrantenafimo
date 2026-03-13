export default function TopSearchBar() {
  return (
    <div className="top-search-wrap">
      <div className="top-search-field" role="search" aria-label="Einsatzort suchen">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </svg>
        <span>Einsatzort</span>
      </div>
    </div>
  );
}
