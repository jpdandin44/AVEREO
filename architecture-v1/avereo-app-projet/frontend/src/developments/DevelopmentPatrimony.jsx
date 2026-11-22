import {useState} from 'react';

const stamp=s=>s?new Date(s).toLocaleString('fr-FR'):'Non renseignée';
const status={observed:'Inventorié',partial:'Inventaire partiel',unavailable:'Indisponible',not_configured:'Non raccordé'};
const amount=m=>m.value===null?'Inconnu':(m.status==='partial'?'≥ ':'')+m.value.toLocaleString('fr-FR');

export default function DevelopmentPatrimony({data,applications=[],onOpen}){
  const [tab,setTab]=useState('synthesis'),[selected,setSelected]=useState('applications'),[appId,setAppId]=useState(''),[query,setQuery]=useState('');
  if(!data)return <section className="development-section" aria-label="Patrimoine & qualité"><h2>Patrimoine & qualité</h2><p role="status">Inventaire non disponible ou non raccordé. Aucun total n’est supposé nul ou conforme.</p><p>Collecter les métadonnées sur le poste puis publier une copie privée ; Actualiser la vue ne parcourt pas le disque.</p></section>;
  const metrics=data.metrics,metric=metrics.find(m=>m.id===selected),source=metric&&data.sources.find(s=>s.id===metric.sourceId);
  const folders=metrics.filter(m=>m.id.startsWith('folder-'));
  const apps=metrics.find(m=>m.id==='applications')?.items||[],iterations=metrics.find(m=>m.id==='iterations')?.items||[];
  const index=metrics.find(m=>m.id==='folder-depot'),references=metrics.find(m=>m.id==='references')?.items||[];
  const filtered=(metric?.items||[]).filter(i=>!query||i.label.toLocaleLowerCase('fr-FR').includes(query.toLocaleLowerCase('fr-FR')));
  function choose(id){setSelected(id);setQuery('');}
  function navigate(id){setTab(id);if(id==='folders'&&!selected.startsWith('folder-')&&folders[0])choose(folders[0].id);if(id==='synthesis'&&selected.startsWith('folder-'))choose('applications');}
  return <section className="patrimony" aria-label="Patrimoine & qualité">
    <header className="patrimony-heading"><div><span className="development-eyebrow">PQ-01 · INVENTAIRE CONSULTATIF</span><h2>Patrimoine & qualité</h2><p>Le parent de <code>depot</code> : AVEREO-reference. Les sources actives, copies et archives restent distinctes.</p></div><small>Collecte locale : {stamp(data.collectedAt)}<br/>Chaque source conserve sa propre date.</small></header>
    <p className="development-notice">Métadonnées seulement. Les volumes ne sont ni des résultats de tests, ni une certification de qualité ou de restauration. Aucun contenu client ou secret n’est publié par cette vue.</p>
    <nav className="development-actions patrimony-tabs" aria-label="Rubriques du patrimoine">{[['synthesis','Synthèse'],['applications','Par application'],['folders','Dossiers & ressources'],['sources','Sources & limites']].map(([id,label])=><button key={id} aria-pressed={tab===id} onClick={()=>navigate(id)}>{label}</button>)}</nav>
    {tab==='synthesis'&&<><div className="patrimony-cards">{metrics.filter(m=>!m.id.startsWith('folder-')).map(m=><button key={m.id} className="patrimony-card" aria-pressed={selected===m.id} onClick={()=>choose(m.id)}><span>{m.label}</span><strong>{amount(m)}</strong><small>{status[m.status]} · {m.unit}</small></button>)}</div><p>Tests exécutés, bugs et améliorations seront raccordés dans leurs lots dédiés. Un état inconnu ne vaut pas zéro.</p></>}
    {tab==='folders'&&<section className="development-section"><h3>Dossiers du parent — fichiers admissibles</h3><p>Seuls les noms et métadonnées des dossiers autorisés sont lus. Le clone, les archives et les copies Git ne sont pas parcourus récursivement.</p><div className="development-table"><table><thead><tr><th>Dossier</th><th>Fichiers</th><th>Qualification</th><th>Détail</th></tr></thead><tbody>{folders.map(m=><tr key={m.id}><th scope="row">{m.label}</th><td>{amount(m)}</td><td>{status[m.status]}</td><td><button onClick={()=>choose(m.id)}>Lister {m.label}</button></td></tr>)}</tbody></table></div></section>}
    {tab==='applications'&&<section className="development-section">
      <h3>Applications et suivis référencés</h3>
      <label>Filtrer l’application<select aria-label="Filtrer l’application" value={appId} onChange={e=>setAppId(e.target.value)}><option value="">Toutes les applications</option>{apps.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}</select></label>
      <p>Un suivi ou fichier partagé peut apparaître dans plusieurs applications ; le total global le compte une seule fois.</p>
      {apps.filter(a=>!appId||a.id===appId).map(a=>{
        const items=iterations.filter(i=>i.applicationIds.includes(a.id)),app=applications.find(p=>p.id===a.id),files=index?.items.filter(i=>i.applicationIds.includes(a.id))||[];
        const inClone=references.some(r=>r.id===a.id),known=index?.status==='observed'&&inClone;
        return <article className="patrimony-app" key={a.id}><h4>{a.label}</h4><p>{items.length} suivi(s) référencé(s) dans cette copie datée.</p>
          <p>{known?`${files.length} fichier(s) admissible(s) suivi(s) dans le clone, dont ${files.filter(f=>f.label.endsWith('.md')).length} Markdown, ${files.filter(f=>/\/tests?\//i.test(f.label)).length} fichier(s) sous tests et ${files.filter(f=>/\/prompts\//i.test(f.label)).length} sous prompts.`:inClone?'Inventaire Git partiel ou indisponible : total applicatif inconnu.':'Source extérieure au clone : fichiers non inventoriés ici.'} Aucun nombre de tests exécutés n’en est déduit.</p>
          {!!files.length&&<details><summary>Fichiers suivis admissibles de {a.label}</summary><ul className="patrimony-items">{files.map(f=><li key={f.id}>{f.label}</li>)}</ul></details>}
          <ul>{items.map(i=><li key={i.id}>{i.label}</li>)}</ul>{app&&onOpen&&<button onClick={()=>onOpen(app)}>Consulter les développements de {a.label}</button>}
        </article>;
      })}
    </section>}
    {['synthesis','folders'].includes(tab)&&metric&&<section className="development-section" aria-label="Justification du comptage"><h3>{metric.label} — {amount(metric)}</h3><p>{metric.meaning}</p><small>{status[metric.status]} · Source : {source?.label} · Date de la source : {stamp(metric.asOf)}</small><label>Rechercher dans cette liste<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label><p>{filtered.length} ligne(s) affichée(s){metric.status==='partial'?' ; comptage borné, total complet inconnu':''}.</p>{!filtered.length?<p>{metric.value===null?'Aucune valeur vérifiée disponible.':'Aucun élément admissible correspondant.'}</p>:<ul className="patrimony-items">{filtered.map(i=><li key={i.id}><span>{i.label}</span><small>{i.kind} · {i.id}</small></li>)}</ul>}</section>}
    {tab==='sources'&&<><section className="development-section"><h3>Sources datées</h3><p>Une collecte récente ne rend pas récents les inventaires qu’elle relit.</p>{data.sources.map(s=><article key={s.id}><strong>{s.label}</strong><p>{status[s.status]} · {stamp(s.asOf)}</p>{s.sha256&&<small>Empreinte de la source : <code>{s.sha256}</code></small>}</article>)}</section><section className="development-section"><h3>Exclusions et limites</h3><ul>{[...data.exclusions,...data.limitations].map((s,n)=><li key={n}>{s}</li>)}</ul></section></>}
  </section>;
}
