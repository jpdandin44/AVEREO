import { useEffect, useMemo, useState } from 'react';
import Basket from '../components/Basket.jsx';
import Filters, { EMPTY_FILTERS, applyFilters } from '../components/Filters.jsx';
import ResultCard from '../components/ResultCard.jsx';
import { useStore } from '../hooks/useStore.js';
import { buildIndex, search, sortResults } from '../services/searchIndex.js';

export default function SearchPage({ navigate }) {
  const resources = useStore(s => s.resources);
  const { logZeroResult, loadDemo, showToast } = useStore.getState();
  const [q, setQ] = useState(() => sessionStorage.getItem('avereo-q') || '');
  const [sort, setSort] = useState('rel');
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const index = useMemo(() => buildIndex(resources), [resources]);
  const pool = useMemo(() => search(index, resources, q), [index, resources, q]);
  const results = useMemo(() => sortResults(applyFilters(pool, filters), sort), [pool, filters, sort]);
  const maxScore = Math.max(1e-9, ...results.map(x => x.score));

  // Mots-clés les plus fréquents du corpus comme suggestions
  const suggestions = useMemo(() => {
    const count = new Map();
    resources.forEach(r => r.tags.forEach(t => count.set(t, (count.get(t) || 0) + 1)));
    return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
  }, [resources]);

  useEffect(() => {
    try { sessionStorage.setItem('avereo-q', q); } catch { /* navigation privée */ }
    const query = q.trim();
    if (!query || pool.length || !resources.length) return;
    const t = setTimeout(() => logZeroResult(query), 1200);
    return () => clearTimeout(t);
  }, [q, pool.length, resources.length, logZeroResult]);

  if (!resources.length) {
    return (
      <section className="empty">
        <h2>Votre corpus est vide</h2>
        <p>Ajoutez vos premières ressources (liens, extraits, fiches Collector), ou chargez les exemples pour découvrir l'application.</p>
        <div className="actions center">
          <button className="btn primary" onClick={() => navigate('ajouter')}>Ajouter une ressource</button>
          <button className="btn" onClick={() => navigate('ajouter', { tab: 'import' })}>Importer des fichiers</button>
          <button className="btn" onClick={() => { const r = loadDemo(); showToast(`${r.added} exemples chargés`); }}>Charger les exemples</button>
        </div>
        <p className="hint">Vos données restent dans ce navigateur. Pensez à faire une sauvegarde depuis la page Amélioration.</p>
      </section>
    );
  }

  return (
    <>
      <div className="searchbar">
        <input id="q" type="search" autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher une notion, un seuil, un document… ex. pont thermique" aria-label="Rechercher" autoComplete="off" />
        <select id="sort" value={sort} onChange={e => setSort(e.target.value)} aria-label="Trier">
          <option value="rel">Pertinence</option>
          <option value="date">Plus récent</option>
          <option value="conf">Fiabilité</option>
        </select>
      </div>
      {suggestions.length > 0 && (
        <div className="suggest">
          Essayer :
          {suggestions.map(s => <button key={s} className="chip" aria-pressed={q === s} onClick={() => setQ(s)}>{s}</button>)}
          <button className="chip" aria-pressed={q === ''} onClick={() => setQ('')}>tout afficher</button>
        </div>
      )}
      <div className="layout">
        <Filters pool={pool} filters={filters} onChange={setFilters} />
        <main>
          <div className="count">
            {results.length
              ? `${results.length} résultat${results.length > 1 ? 's' : ''}${q.trim() ? ` pour « ${q.trim()} »` : ''}`
              : 'Aucun résultat. Essayez un synonyme, retirez un filtre, ou ajoutez la ressource manquante.'}
          </div>
          {!results.length && q.trim() && (
            <div className="actions"><button className="btn" onClick={() => navigate('ajouter', { title: q.trim() })}>Ajouter une ressource sur « {q.trim()} »</button></div>
          )}
          <div className="results">
            {results.map(({ resource, score, terms }) => (
              <ResultCard key={resource.id} r={resource} terms={terms} query={q.trim()}
                relevance={q.trim() ? score / maxScore : null}
                onEdit={id => navigate('ajouter', { id })} />
            ))}
          </div>
        </main>
        <Basket />
      </div>
    </>
  );
}
