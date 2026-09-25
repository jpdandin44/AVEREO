import { lazy, Suspense, useState } from 'react';
import './review/review.css';

const ReviewWorkspace = import.meta.env.DEV ? lazy(() => import('./review/ReviewWorkspace.jsx')) : null;

export default function App() {
  const [tab, setTab] = useState(import.meta.env.DEV ? 'reviews' : 'planning');
  const [planningOpened, setPlanningOpened] = useState(!import.meta.env.DEV);
  return <>
    {import.meta.env.DEV && <header className="project-header">
      <a className="project-brand" href="#revues" onClick={() => setTab('reviews')}><span className="brand-symbol">A</span><span>AVEREO <b>Projet</b></span></a>
      <nav aria-label="Espaces de Projet">
        <button type="button" className={tab === 'reviews' ? 'active' : ''} onClick={() => setTab('reviews')}>Revues & approbations</button>
        <button type="button" className={tab === 'planning' ? 'active' : ''} onClick={() => { setPlanningOpened(true); setTab('planning'); }}>Planning & risques</button>
      </nav>
      <span className="local-chip"><i /> Espace local</span>
    </header>}
    {ReviewWorkspace && <div hidden={tab !== 'reviews'}><Suspense fallback={<p className="loading">Ouverture des revues…</p>}><ReviewWorkspace /></Suspense></div>}
    {planningOpened && <iframe
      title="Projet AVEREO Pro"
      src="/legacy-app.html"
      style={{
        width: '100%',
        height: import.meta.env.DEV ? 'calc(100vh - 76px)' : '100vh',
        border: 0,
        display: tab === 'planning' ? 'block' : 'none',
      }}
    />}
  </>;
}
