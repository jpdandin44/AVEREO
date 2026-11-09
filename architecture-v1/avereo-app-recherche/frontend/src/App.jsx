import { useEffect, useState } from 'react';
import Toast from './components/Toast.jsx';
import { useStore } from './hooks/useStore.js';
import AddPage from './pages/AddPage.jsx';
import ImprovePage, { exportResearchBackup } from './pages/ImprovePage.jsx';
import RegistryPage from './pages/RegistryPage.jsx';
import ReviewPage from './pages/ReviewPage.jsx';
import SearchPage from './pages/SearchPage.jsx';

const CONNECT_URL = import.meta.env.VITE_CONNECT_URL || 'https://connect.avereo.fr';

const PAGES = [
  { id: 'recherche', label: 'Rechercher', Component: SearchPage },
  { id: 'ajouter', label: 'Ajouter', Component: AddPage },
  { id: 'valider', label: 'À valider', Component: ReviewPage },
  { id: 'sources', label: 'Sources', Component: RegistryPage },
  { id: 'amelioration', label: 'Amélioration', Component: ImprovePage },
];

// Navigation par ancre (#/ajouter?id=…) : compatible hébergement statique O2Switch
function parseHash() {
  const [path, query = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
  const page = PAGES.some(p => p.id === path) ? path : 'recherche';
  return { page, params: Object.fromEntries(new URLSearchParams(query)) };
}

export default function App() {
  const loaded = useStore(s => s.loaded);
  const canExport = useStore(s => s.loaded && s.resources.length > 0);
  const pendingCount = useStore(s => s.resources.filter(r => r.client === 'ELIGIBLE_FOR_REVIEW').length);
  const [route, setRoute] = useState(parseHash);

  useEffect(() => { useStore.getState().hydrate(); }, []);
  useEffect(() => {
    const onHash = () => { setRoute(parseHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (page, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    window.location.hash = `/${page}${qs ? `?${qs}` : ''}`;
  };

  const Current = PAGES.find(p => p.id === route.page).Component;

  return (
    <div className="wrap">
      <div className="section-navigation">
        <nav className="tabs" aria-label="Sections">
          <a href={CONNECT_URL}>← CONNECT</a>
          {PAGES.map(p => (
            <a key={p.id} href={`#/${p.id}`} aria-current={route.page === p.id ? 'page' : undefined}>
              {p.label}{p.id === 'valider' && pendingCount > 0 && <span className="count-pill">{pendingCount}</span>}
            </a>
          ))}
        </nav>
        <avereo-account-menu app-name="Recherche"><button slot="local-copy" data-avereo-save="local" data-avereo-proxy="" onClick={exportResearchBackup} disabled={!canExport}>Exporter la sauvegarde JSON</button><a slot="items" href="#/amelioration">Sauvegardes</a></avereo-account-menu>
      </div>
      {loaded ? <Current key={`${route.page}-${JSON.stringify(route.params)}`} params={route.params} navigate={navigate} /> : <p className="loading">Chargement du corpus…</p>}
      <footer className="foot">V0 · données stockées dans ce navigateur · <a href="#/amelioration">sauvegarder</a></footer>
      <Toast />
    </div>
  );
}
