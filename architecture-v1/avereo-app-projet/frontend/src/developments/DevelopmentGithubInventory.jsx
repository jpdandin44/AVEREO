import {useState} from 'react';

const short=value=>value?.slice(0,12)||'Non renseigné';
const status=pr=>pr.draft&&pr.state==='open'?'Brouillon':({open:'Ouverte',merged:'Fusionnée',closed:'Fermée'}[pr.state]||'À qualifier');
const external=(url,text)=>typeof url==='string'&&url.startsWith('https://github.com/')?<a href={url} target="_blank" rel="noopener noreferrer">{text}</a>:<span>{text}</span>;

export default function DevelopmentGithubInventory({inventory,applications=[],onOpen}){
  const [kind,setKind]=useState('projects'),[query,setQuery]=useState(''),[repository,setRepository]=useState(''),[state,setState]=useState('all'),[page,setPage]=useState(0);
  if(!inventory)return <section className="github-inventory" aria-label="Inventaire GitHub"><h2>Inventaire GitHub</h2><p>La publication consultée ne contient pas encore l’inventaire du compte. Les applications inscrites dans les suivis restent consultables dans la vue d’ensemble.</p></section>;
  const repos=inventory.repositories,prs=inventory.pullRequests;
  const branches=repos.flatMap(r=>r.branches.map(b=>({...b,repository:r.repository})));
  const groups={projects:inventory.projects,prs,branches,repositories:repos};
  const filtered=groups[kind].filter(item=>(!repository||item.repository===repository)
    &&(kind!=='prs'||state==='all'||state==='draft'&&item.draft&&item.state==='open'||state!=='draft'&&item.state===state)
    &&[item.name,item.title,item.path,item.repository,item.number].join(' ').toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  const size=50,pages=Math.max(1,Math.ceil(filtered.length/size)),current=Math.min(page,pages-1),visible=filtered.slice(current*size,(current+1)*size);
  const update=setter=>event=>{setter(event.target.value);setPage(0);};
  return <section className="github-inventory" aria-label="Inventaire GitHub">
    <div className="portfolio-intro"><div><h2>Tout le compte GitHub</h2><p>Dépôts de {inventory.owner}, composants de code, propositions de modification et branches présentes.</p></div><span className="portfolio-private">Consultation privée</span></div>
    <div className="portfolio-metrics">
      <article><strong>{repos.length}</strong><span>dépôts recensés</span></article>
      <article><strong>{inventory.projects.length}</strong><span>projets et composants détectés</span></article>
      <article><strong>{prs.length}</strong><span>propositions de modification</span></article>
      <article><strong>{branches.length}</strong><span>branches présentes</span></article>
    </div>
    <p className="portfolio-explanation">Relevé du {new Date(inventory.observedAt).toLocaleString('fr-FR')}. Dépôts publics du compte et dépôts privés autorisés par les accès existants, toutes les pages retournées parcourues. Les travaux restés sur le PC ne sont pas inclus. Une branche peut être historique ; sa présence ne signifie pas qu’un chantier est encore actif.</p>
    <div className="portfolio-controls">
      <label>Consulter<select value={kind} onChange={update(setKind)}><option value="projects">Projets et composants</option><option value="prs">Propositions de modification (PR)</option><option value="branches">Branches</option><option value="repositories">Dépôts</option></select></label>
      <label>Dépôt<select value={repository} onChange={update(setRepository)}><option value="">Tous les dépôts</option>{repos.map(r=><option key={r.repository} value={r.repository}>{r.repository}</option>)}</select></label>
      <label className="portfolio-search">Rechercher<input type="search" value={query} onChange={update(setQuery)} placeholder="Nom, chemin, développement ou numéro…"/></label>
      {kind==='prs'&&<label>État<select value={state} onChange={update(setState)}><option value="all">Tous les états</option><option value="open">Ouvertes, brouillons inclus</option><option value="draft">Brouillons</option><option value="merged">Fusionnées</option><option value="closed">Fermées sans fusion</option></select></label>}
    </div>
    <p role="status">{filtered.length} résultat(s) · page {current+1} / {pages}</p>
    <div className="development-table"><table><thead><tr><th>{kind==='prs'?'Développement':kind==='branches'?'Branche':kind==='repositories'?'Dépôt':'Projet ou composant'}</th><th>Source</th><th>État observé</th><th>Suivi</th></tr></thead><tbody>
      {visible.map(item=>{
        const app=kind==='projects'?applications.find(a=>a.id===item.id):null;
        return <tr key={kind==='branches'?item.repository+'|'+item.name:item.id||item.url||item.repository}>
          <td>{external(item.url,kind==='prs'?'#'+item.number+' — '+item.title:item.name||item.repository)}{kind==='projects'&&<><small>{item.kind} · classification issue des chemins et marqueurs</small><code>{item.path||'Racine du dépôt'}</code></>}{kind==='branches'&&<small><code>{short(item.headSha)}</code></small>}</td>
          <td>{external('https://github.com/'+item.repository,item.repository)}{kind==='repositories'&&<small>{item.visibility==='private'?'Privé':'Public'} · branche par défaut : {item.defaultBranch}</small>}</td>
          <td>{kind==='projects'?<>{item.inDefaultBranch?'Présent dans la branche par défaut':'Présent sur une autre branche'}<small>{item.historical?'Chemin historique · ':''}{item.branches.length} branche(s) · <code>{short(item.headSha)}</code></small></>:kind==='prs'?<>{status(item)}<small>{item.mergedAt?'Fusion le '+new Date(item.mergedAt).toLocaleDateString('fr-FR'):'Aucune livraison déduite'}</small></>:kind==='branches'?<>{item.isDefault?'Branche par défaut':'Branche présente'}<small>{item.openPrs.length} PR ouverte(s)</small></>:<>{item.archived?'Dépôt archivé':item.empty?'Dépôt vide':'Dépôt présent'}<small>{item.branches.length} branches · {item.pullRequestUrls.length} PR</small></>}</td>
          <td>{kind==='projects'?app?.iterations.length?<button onClick={()=>onOpen(app)}>Ouvrir les développements</button>:<span>Suivi métier à raccorder</span>:<span>Observation GitHub · aucune validation automatique</span>}</td>
        </tr>;
      })}
    </tbody></table></div>
    {!filtered.length&&<p>Aucun résultat pour cette recherche et ces filtres.</p>}
    <div className="development-actions"><button disabled={current===0} onClick={()=>setPage(current-1)}>Page précédente</button><button disabled={current+1===pages} onClick={()=>setPage(current+1)}>Page suivante</button></div>
    <details className="portfolio-reference"><summary>Couverture et limites du relevé</summary><ul>{inventory.limitations.map((text,i)=><li key={i}>{text}</li>)}</ul><p>Les quatre phases, critères, décisions et pièces appartiennent aux suivis métier. Cet inventaire ne crée aucun accord et ne prouve pas qu’une application est installée.</p></details>
  </section>;
}
