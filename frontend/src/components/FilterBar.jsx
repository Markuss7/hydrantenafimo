const FILTERS = [
  { key: null, label: 'Alle', dotClass: 'dot-all' },
  { key: 'OH', label: 'Überflur H.', dotClass: 'dot-oh' },
  { key: 'UH', label: 'Unterflur H.', dotClass: 'dot-uh' },
  { key: 'GH', label: 'Fallm. H.', dotClass: 'dot-gh' },
];

export default function FilterBar({ activeFilter, onChange }) {
  return (
    <div className="pill-bar">
      {FILTERS.map((f) => (
        <button
          key={f.label}
          className={activeFilter === f.key ? 'filter-active' : ''}
          onClick={() => onChange(f.key)}
        >
          <span className={`pill-dot ${f.dotClass}`} />
          <span>{f.label}</span>
        </button>
      ))}
    </div>
  );
}
