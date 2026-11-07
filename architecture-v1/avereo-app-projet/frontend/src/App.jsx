import { lazy, Suspense, useState } from 'react';
import './review/review.css';

const ReviewWorkspace = import.meta.env.DEV ? lazy(() => import('./review/ReviewWorkspace.jsx')) : null;
const DevelopmentWorkspace = import.meta.env.DEV ? lazy(() => import('./developments/DevelopmentWorkspace.jsx')) : null;

export default function App() {
  const developmentMode = import.meta.env.DEV && import.meta.env.VITE_DEVELOPMENTS_LOCAL === '1';
  const [tab, setTab] = useState(developmentMode ? 'developments' : import.meta.env.DEV ? 'reviews' : 'planning');
  const [planningOpened, setPlanningOpened] = useState(!import.meta.env.DEV);
  return <>
    {import.meta.env.DEV && <header className="project-header">
      <a className="project-brand" href={developmentMode ? '#developpements' : '#revues'} onClick={() => setTab(developmentMode ? 'developments' : 'reviews')}><span className="brand-symbol">A</span><span>AVEREO <b>Projet</b></span></a>
      <nav aria-label="Espaces de Projet">
        {developmentMode ? <button type="button" className={tab === 'developments' ? 'active' : ''} onClick={() => setTab('developments')}>Développements</button> : <button type="button" className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>Revues & approbations</button>}
        <button type="button" className={tab === 'planning' ? 'active' : ''} onClick={() => { setPlanningOpened(true); setTab('planning'); }}>Planning & risques</button>
      </nav>
      <span className="local-chip"><i /> Espace local</span>
    </header>}
    {ReviewWorkspace && !developmentMode && <div hidden={tab !== 'reviews'}><Suspense fallback={<p className="loading">Ouverture des revues…</p>}><ReviewWorkspace /></Suspense></div>}
    {DevelopmentWorkspace && developmentMode && <div hidden={tab !== 'developments'}><Suspense fallback={<p className="loading">Ouverture de l’espace privé…</p>}><DevelopmentWorkspace /></Suspense></div>}
    {planningOpened && <iframe
      title="Projet AVEREO Pro"
      src="/legacy-app.html?v=interface-20261106"
      style={{
        width: '100%',
        height: import.meta.env.DEV ? 'calc(100vh - 76px)' : '100vh',
        border: 0,
        display: tab === 'planning' ? 'block' : 'none',
      }}
    />}
  </>;
}
