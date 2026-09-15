import React, { useEffect, useState } from 'react';
import { CadastralMap } from './LocationMap.jsx';
import { DIRECTIONS, fetchTerrain } from './terrainContext.js';
import { fetchUrbanism, safeDocumentUrl, URBAN_LAYERS } from './urbanismContext.js';

const dateLabel = (date) => new Date(date).toLocaleString('fr-FR');
export function Compass({ direction = '' }) {
  const selected = DIRECTIONS.find(([key]) => key === direction);
  return <svg className="site-compass" viewBox="0 0 160 160" role="img"
    aria-label={selected ? `Nord en haut ; façade orientée ${selected[1]} selon votre saisie` : 'Rose des vents : nord en haut, orientation de la façade non renseignée'}>
    <circle cx="80" cy="80" r="52" fill="#f8fafc" stroke="#cbd5e1" />
    <path d="M80 25 L89 80 L80 72 L71 80 Z" fill="#dc2626" />
    <path d="M80 135 L89 80 L80 88 L71 80 Z" fill="#94a3b8" />
    <path d="M25 80 L80 71 L72 80 L80 89 Z M135 80 L80 71 L88 80 L80 89 Z" fill="#cbd5e1" />
    {selected && <g transform={`rotate(${selected[2]} 80 80)`}><path d="M80 80 L80 43 M72 53 L80 43 L88 53" fill="none" stroke="#1d4ed8" strokeWidth="5" strokeLinecap="round" /></g>}
    <circle cx="80" cy="80" r="5" fill="#172033" />
    <g textAnchor="middle" fontSize="14" fontWeight="700" fill="#334155">
      <text x="80" y="16" fill="#b91c1c">N</text><text x="148" y="85">E</text>
      <text x="80" y="157">S</text><text x="12" y="85">O</text>
    </g>
  </svg>;
}

export function UrbanismPanel({ report, setReport }) {
  const { lon, lat } = report.cadastre;
  const [revision, setRevision] = useState(0);
  const [status, setStatus] = useState('');
  const data = report.urbanisme.context;
  useEffect(() => {
    if (data && revision === 0) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    setStatus('loading');
    fetchUrbanism(lon, lat, controller.signal).then((context) => {
      if (!active) return;
      setReport((prev) => Number(prev.cadastre.lon) === Number(lon) && Number(prev.cadastre.lat) === Number(lat)
        ? { ...prev, urbanisme: { ...prev.urbanisme, context } } : prev);
      setStatus('');
    }).catch(() => { if (active) setStatus('error'); }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [lon, lat, revision, setReport]);
  const officialMap = `https://www.geoportail-urbanisme.gouv.fr/map/#tile=1&lon=${lon}&lat=${lat}&zoom=19`;
  const documentUrl = safeDocumentUrl(report.urbanisme.pdfUrl);
  return <section className="site-insight" aria-labelledby="urbanism-title">
    <div className="insight-heading"><div><p className="property-map-eyebrow">CARTE ET URBANISME</p>
      <h3 id="urbanism-title">Points de vigilance connus</h3></div>
      <button type="button" className="button secondary" disabled={status === 'loading'} onClick={() => setRevision((n) => n + 1)}>Actualiser l’urbanisme</button></div>
    <p>Interrogation au point de visite, pas sur toute la parcelle. Les informations ci-dessous signalent des éléments à vérifier avant travaux.</p>
    {status === 'loading' && <p role="status">Recherche des prescriptions et servitudes…</p>}
    {status === 'error' && <p className="status-line warning" role="alert">Récupération indisponible. Réessayez ou consultez la carte officielle. {data ? 'La dernière consultation est conservée ci-dessous.' : 'Aucune conclusion réglementaire possible.'}</p>}
    {data && <><p className="muted">Source : {data.source} · consultée le {dateLabel(data.fetchedAt)}</p>
      {URBAN_LAYERS.map(([key, title]) => {
        const group = data.results?.find((r) => r.layer === key);
        return <details key={key} className="urban-group" open={key === 'zone-urba' || key === 'prescription-surf'}>
          <summary>{title} · {group?.error ? 'indisponible' : `${group?.items?.length || 0} élément(s)`}</summary>
          {group?.error ? <p>Cette source n’a pas répondu ; cela ne signifie pas absence de contrainte.</p>
            : !group?.items?.length ? <p>Aucun élément retourné au point interrogé. Cela ne prouve pas l’absence de règle sur le bien.</p>
            : <ul className="urban-items">{group.items.map((item) => <li key={item.id}>
              <strong>{item.title}</strong>{item.code && <span className="urban-code"> {item.code}</span>}
              {item.detail && <p>{item.detail}</p>}
              <small>{item.document}{item.sourceDate && ` · Date source : ${item.sourceDate}`}</small>
              {safeDocumentUrl(item.url) && <a href={safeDocumentUrl(item.url)} target="_blank" rel="noopener noreferrer">Consulter le texte source</a>}
            </li>)}</ul>}
          {group?.partial && <p className="status-line warning">Résultat partiel : consulter le GPU pour la liste complète.</p>}
        </details>;
      })}</>}
    <p className="insight-caution">Les libellés ne sont pas une synthèse juridique du PLU. Les hauteurs, retraits, autorisations et interdictions doivent être confirmés dans les textes et auprès du service urbanisme. Les servitudes linéaires/ponctuelles et d’autres règles ne sont pas couvertes par ce repérage.</p>
    <div className="toolbar"><a className="button ghost" href={officialMap} target="_blank" rel="noopener noreferrer">Ouvrir la carte réglementaire GPU</a>
      {documentUrl && <a className="button ghost" href={documentUrl} target="_blank" rel="noopener noreferrer">Consulter le règlement</a>}</div>
    <label className="insight-notes">Règles / interdictions confirmées et référence du texte
      <textarea rows={3} value={report.urbanisme.notes || ''} placeholder="À compléter après lecture : règle, article/page, source et date de vérification."
        onChange={(e) => setReport((prev) => ({ ...prev, urbanisme: { ...prev.urbanisme, notes: e.target.value } }))} />
    </label>
    <details className="urban-group"><summary>Repérer le bien sur le plan cadastral</summary>
      <p>Fond cadastral IGN, sans superposition du zonage PLU. Le nord est en haut.</p>
      <CadastralMap lon={lon} lat={lat} mode="cadastre" revision={0} />
    </details>
  </section>;
}

export function TerrainPanel({ report, setReport }) {
  const { lon, lat } = report.cadastre;
  const terrain = report.terrain || {};
  const [width, setWidth] = useState(terrain.analysis?.width || 50);
  const [status, setStatus] = useState('');
  const [request, setRequest] = useState(0);
  const data = terrain.analysis;
  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    let active = true;
    setStatus('loading');
    fetchTerrain(lon, lat, width, controller.signal).then((analysis) => {
      if (!active) return;
      setReport((prev) => Number(prev.cadastre.lon) === Number(lon) && Number(prev.cadastre.lat) === Number(lat)
        ? { ...prev, terrain: { ...prev.terrain, analysis } } : prev);
      setStatus('');
    }).catch(() => { if (active) setStatus('error'); }).finally(() => clearTimeout(timeout));
    return () => { active = false; controller.abort(); clearTimeout(timeout); };
  }, [request, lon, lat, width, setReport]);
  const update = (field, value) => setReport((prev) => ({ ...prev, terrain: { ...prev.terrain, [field]: value } }));
  const selected = DIRECTIONS.find(([key]) => key === terrain.orientation);
  return <section className="site-insight" aria-labelledby="terrain-title">
    <p className="property-map-eyebrow">RELIEF ET ORIENTATION</p><h3 id="terrain-title">Comprendre les abords du bien</h3>
    <div className="orientation-row"><Compass direction={terrain.orientation} /><div>
      <h4>Orientation de la maison</h4><p>Nord en haut des cartes. La flèche bleue représente la direction extérieure de la façade choisie, selon votre saisie.</p>
      <div className="form-grid two">
        <label>Façade repérée<input value={terrain.facade || ''} placeholder="Ex. entrée ou façade du séjour" onChange={(e) => update('facade', e.target.value)} /></label>
        <label>Direction de cette façade<select value={selected?.[0] || ''} onChange={(e) => update('orientation', e.target.value)}>
          <option value="">À relever sur place / sur le plan</option>{DIRECTIONS.map(([key, name]) => <option key={key} value={key}>{name}</option>)}</select></label>
      </div><small>Aucune orientation du bâtiment ni direction de vent n’est déduite automatiquement.</small>
    </div></div>
    <h4>Repérage altimétrique indicatif</h4>
    <p>Neuf altitudes du terrain autour du point de visite. L’emprise peut dépasser le bien et inclure la voirie ou les parcelles voisines.</p>
    <div className="toolbar"><label>Emprise du repérage <select value={width} disabled={status === 'loading'}
      onChange={(e) => { setRequest(0); setWidth(Number(e.target.value)); }}>
      <option value={50}>50 m × 50 m</option><option value={100}>100 m × 100 m</option></select></label>
      <button className="button secondary" type="button" disabled={status === 'loading'} onClick={() => setRequest((n) => n + 1)}>Étudier le relief</button></div>
    {status === 'loading' && <p role="status">Récupération des neuf altitudes IGN…</p>}
    {status === 'error' && <p className="status-line warning" role="alert">Données altimétriques indisponibles ou incomplètes. Aucune nouvelle estimation produite. {data && 'Le dernier relevé reste affiché.'}</p>}
    {data && <><p className="muted">{data.source} · {dateLabel(data.fetchedAt)} · emprise du résultat : {data.width} m × {data.width} m</p>
      <div className="terrain-metrics"><div><small>Altitude minimale</small><strong>{data.min.toFixed(2)} m</strong></div>
        <div><small>Altitude maximale</small><strong>{data.max.toFixed(2)} m</strong></div>
        <div><small>Écart observé</small><strong>{data.range.toFixed(2)} m</strong></div></div>
      <div className="terrain-grid" role="group" aria-label="Neuf altitudes, nord en haut">{data.samples.map((p) =>
        <div key={p.label} className={p.label === 'Centre' ? 'terrain-center' : ''}><small>{p.label}</small><strong>{p.z.toFixed(2)} m</strong></div>)}</div>
      <p>{data.descent ? `Baisse relative la plus forte depuis le centre parmi ces points : vers ${data.descent.direction}, pente entre deux points ≈ ${data.descent.percent.toFixed(1)} %.`
        : 'Aucun des huit points périphériques n’est plus bas que le centre. Cela ne permet pas de conclure sur le drainage.'}</p>
    </>}
    <p className="insight-caution">Ce n’est pas une étude hydrologique ni un relevé de géomètre. Le modèle de terrain ne décrit pas les gouttières, seuils, murs, drains ou sols imperméables. Un dénivelé est un indice à vérifier ; il ne prouve ni un sens d’écoulement réel ni l’absence de risque. La précision des altitudes varie suivant la source.</p>
    <label className="insight-notes">Vérifications terrain / eaux pluviales<textarea rows={3} value={terrain.notes || ''}
      placeholder="Pentes observées, points bas, ruissellement, obstacles et évacuations à vérifier…"
      onChange={(e) => update('notes', e.target.value)} /></label>
  </section>;
}
