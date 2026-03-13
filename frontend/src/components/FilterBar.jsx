const FILTERS = [
  { key: null, label: 'Alle', activeClass: 'active-all', dotClass: 'dot-all' },
  { key: 'OH', label: 'Überflur H.', activeClass: 'active-oh', dotClass: 'dot-oh' },
  { key: 'UH', label: 'Unterflur H.', activeClass: 'active-uh', dotClass: 'dot-uh' },
  { key: 'GH', label: 'Fallm. H.', activeClass: 'active-gh', dotClass: 'dot-gh' },
];

export default function FilterBar({ activeFilter, onChange }) {
  return (
    <div className="pill-bar">
      {FILTERS.map((f) => (
        <button
          key={f.label}
          className={activeFilter === f.key ? f.activeClass : ''}
          onClick={() => onChange(f.key)}
        >
          <span className={`pill-dot ${f.dotClass}`} />
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}
