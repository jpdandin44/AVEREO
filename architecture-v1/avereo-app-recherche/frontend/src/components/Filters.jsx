import { CLIENT } from '../config/referentiels.js';

const GROUPS = [
  { key: 'origin', label: 'Origine' },
  { key: 'type', label: 'Type' },
  { key: 'domain', label: 'Domaine' },
  { key: 'client', label: 'Usage client', display: v => CLIENT[v]?.label || v },
];

export const EMPTY_FILTERS = { origin: [], type: [], domain: [], client: [] };

export function applyFilters(results, filters) {
  return results.filter(({ resource }) => Object.entries(filters).every(([k, vals]) => !vals.length || vals.includes(resource[k])));
}

export default function Filters({ pool, filters, onChange }) {
  const toggle = (key, value) => {
    const cur = filters[key];
    onChange({ ...filters, [key]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] });
  };
  const active = Object.values(filters).some(v => v.length);
  return (
    <aside className="filters" aria-label="Filtres">
      {GROUPS.map(g => {
        const counts = new Map();
        pool.forEach(({ resource }) => counts.set(resource[g.key], (counts.get(resource[g.key]) || 0) + 1));
        filters[g.key].forEach(v => counts.has(v) || counts.set(v, 0));
        if (!counts.size) return null;
        return (
          <div className="fgroup" key={g.key}>
            <h4>{g.label}</h4>
            {[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value, n]) => {
              const id = `f-${g.key}-${String(value).replace(/\W+/g, '-')}`;
              return (
                <label key={value} htmlFor={id}>
                  <span><input id={id} type="checkbox" checked={filters[g.key].includes(value)} onChange={() => toggle(g.key, value)} /> {g.display ? g.display(value) : value}</span>
                  <span className="n">{n}</span>
                </label>
              );
            })}
          </div>
        );
      })}
      {active && <button className="btn ghost small" onClick={() => onChange(EMPTY_FILTERS)}>Effacer les filtres</button>}
    </aside>
  );
}
