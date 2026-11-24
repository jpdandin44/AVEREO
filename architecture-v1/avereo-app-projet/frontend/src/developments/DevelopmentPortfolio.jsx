import {useState} from 'react';
import {environmentBadge,siteObservationBadge} from './environment-badges.mjs';
import {applicationQuality} from '../../../workflows/development-quality.mjs';
import './environment-badges.css';
const short=value=>value?value.slice(0,12):'Non renseignée';
const date=value=>value&&!Number.isNaN(Date.parse(value))?new Date(value).toLocaleDateString('fr-FR'):'Date non renseignée';
const phases=['Cadrage','Développement local','Préproduction','Mise en production'];
function StatusBadge({status}){
  return <span className={'environment-badge '+status.tone} title={status.explanation}><svg viewBox="0 0 16 16" aria-hidden="true">{status.shape==='triangle'?<path d="M8 1 15 14H1Z"/>:<circle cx="8" cy="8" r="5"/>}</svg>{status.label}</span>;
}
function Delivered({value,environment,iterations}){
  const status=environmentBadge(environment,value,iterations);
  return <><StatusBadge status={status}/><span className="environment-detail">{status.detail}</span>{value&&<><code className="environment-version" title={value.sourceSha||value.artifactSha256||''}>{short(value.sourceSha||value.artifactSha256)}</code><small>{value.title}</small><small>Déclaré le {date(value.observedAt)}</small></>}{status.evidence&&<small title={status.evidence}>Contrôle documenté le {date(status.observedAt)}</small>}</>;
}
function SiteEnvironments({references}){
  return <div className="site-environments">{['preproduction','production'].map(environment=>{
    const reference=references[environment],status=siteObservationBadge(reference);
    return <section key={environment}><strong>{environment==='preproduction'?'Préproduction':'Production'}</strong><StatusBadge status={status}/>{status.url&&<a href={status.url} target="_blank" rel="noopener noreferrer">{status.url}</a>}<small>{status.observedAt?`Constat du ${new Date(status.observedAt).toLocaleString('fr-FR')}`:'État à vérifier'}</small></section>;
  })}<p>Dernière vérification de l’accueil, sans contrôle des fonctions du site.</p></div>;
}
export function LocalFolder({directory,label}){
  const [message,setMessage]=useState('');
  async function copy(event){const field=event.currentTarget.parentElement.querySelector('input');try{await navigator.clipboard.writeText(directory);setMessage('Chemin copié');}catch{field?.focus();field?.select();setMessage('Chemin sélectionné — copier puis coller dans l’Explorateur');}}
  return <div className="reference-folder"><label>{label}<input readOnly value={directory} onFocus={event=>event.target.select()}/></label><button type="button" onClick={copy}>Copier le chemin</button><span role="status">{message}</span></div>;
}
export default function DevelopmentPortfolio({applications,historicalApplications=[],iterations=[],onOpen}){
  const [query,setQuery]=useState(''),[filter,setFilter]=useState('all');
  const scope=filter==='history'?historicalApplications:applications;
  const reference=applications.find(app=>app.localReference)?.localReference;
  const rows=scope.map(app=>({app,q:applicationQuality(app,iterations)}));
  const matches=({q})=>filter==='all'||filter==='history'||filter==='blocked'&&q.blockers>0||filter==='proofs'&&(q.proofs.missing+q.proofs.unpublished+q.criteria.unlinked+q.criteria.brokenLinks>0)||filter==='criteria'&&(q.criteria.total===0||q.unknown>0);
  const filtered=rows.filter(row=>matches(row)&&[row.app.name,row.app.category,row.app.github?.repository,row.app.github?.path,...(row.app.projectSources||[]).flatMap(source=>[source.name,source.path]),...row.app.iterations.map(i=>i.title)].join(' ').toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  return <section className="portfolio-overview" aria-label="Vue d’ensemble des projets">
    <div className="portfolio-intro"><div><h2>Où en sont mes projets ?</h2><p>Repérer les points d’attention, puis ouvrir le suivi pour examiner les quatre phases.</p></div><span className="portfolio-private">Consultation privée · aucune validation automatique</span></div>
    <div className="portfolio-metrics">
      <article><strong>{scope.length}</strong><span>projets recensés</span></article>
      <article><strong>{rows.filter(r=>r.q.blockers>0).length}</strong><span>avec des réserves déclarées</span></article>
      <article><strong>{rows.filter(r=>r.q.criteria.unlinked+r.q.criteria.brokenLinks>0).length}</strong><span>avec des critères à relier</span></article>
      <article><strong>{rows.filter(r=>r.q.criteria.total===0||r.q.unknown>0).length}</strong><span>avec des critères à compléter</span></article>
    </div>
    <div className="portfolio-controls"><label className="portfolio-search">Rechercher<input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Application ou développement…"/></label><label>Afficher<select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Tous les projets</option><option value="blocked">Réserves déclarées</option><option value="proofs">Critères ou pièces à relier</option><option value="criteria">Critères à compléter</option><option value="history">Historique des prototypes</option></select></label><span role="status">{filtered.length} / {scope.length} projets</span></div>
    <p className="portfolio-explanation">Indicateurs calculés sur les suivis consultables, <strong>historique inclus</strong>. Un chantier commun peut apparaître dans plusieurs applications : ces nombres ne s’additionnent pas entre applications. Une pièce disponible ou une CI réussie n’est pas une validation humaine.</p>
    <div className="portfolio-cards">{filtered.map(({app,q})=>{
      const lead=q.views.find(v=>v.nextAction);
      const tone=q.blockers?'attention':app.missingTracking||q.unknown||!q.criteria.total?'unknown':'neutral';
      return <article className={'portfolio-app-card '+tone} key={app.id}>
        <header><div><small>{app.category}</small><h3>{app.name}</h3></div><span className={'portfolio-signal '+tone}>{q.blockers?'Réserves à examiner':app.missingTracking?'Suivi à raccorder':q.unknown||!q.criteria.total?'Critères à compléter':'Suivi consultable'}</span></header>
        {app.environmentReferences?<SiteEnvironments references={app.environmentReferences}/>:<div className="portfolio-card-badges"><span>Préprod <StatusBadge status={environmentBadge('preproduction',app.preproduction,app.iterations)}/></span><span>Production <StatusBadge status={environmentBadge('production',app.production,app.iterations)}/></span></div>}
        <div className="portfolio-app-stats"><div><strong>{app.iterations.length}</strong><span>suivis, historique inclus</span></div><div><strong>{q.blockers}</strong><span>réserves déclarées</span></div></div>
        <dl className="portfolio-quality"><div><dt>Critères</dt><dd>{!q.known?'Résumé des critères indisponible':q.criteria.total?`${q.criteria.approved} / ${q.criteria.total} validés par décision sur critère`:'Aucun critère structuré reconnu'}{q.unknown>0&&<small>Comptages partiels : {q.unknown} suivi(s) sans résumé qualifié</small>}</dd></div><div><dt>À relier</dt><dd>{q.known?`${q.criteria.unlinked} sans preuve liée · ${q.criteria.brokenLinks} lien(s) incomplet(s)`:'À qualifier'}</dd></div><div><dt>Pièces</dt><dd>{q.known?<>{q.proofs.available} consultables · {q.proofs.external} références externes<small>{q.proofs.unpublished} non publiées · {q.proofs.missing} à retrouver / qualifier</small></>:'Résumé des pièces indisponible'}</dd></div></dl>
        <div className="portfolio-phase-counts" aria-label={'Phases déclarées des suivis de '+app.name}>{phases.map((name,id)=><span key={name} title={name}><b>PHASE {id}</b>{name}<strong>{q.views.filter(v=>v.currentPhase===id).length}</strong></span>)}</div>
        <p className="portfolio-next"><strong>Prochaine action du premier suivi affiché</strong>{lead?.nextAction||'À préciser dans la source du suivi.'}</p>
        <button className="portfolio-open" onClick={()=>onOpen(app)}>Voir les développements de {app.name} →</button>
        <details className="portfolio-app-details"><summary>Versions, preuves et sources</summary>
          {app.projectAdmission?.reason==='documented_preproduction'&&<p>Projet ajouté après un premier passage documenté en préproduction, le {date(app.projectAdmission.receipt.observedAt)}. La recette humaine reste distincte.</p>}
          {app.projectSources?.length>1&&<section><h4>Éléments rattachés à ce projet</h4><ul>{app.projectSources.map(source=><li key={source.id}>{source.url?.startsWith('https://github.com/')?<a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}</a>:source.name}{source.path&&<small>{source.path}</small>}</li>)}</ul></section>}
          <div className="portfolio-environments"><section><h4>Préproduction — dernier lot déclaré</h4><Delivered value={app.preproduction} environment="preproduction" iterations={app.iterations}/></section><section><h4>Production — dernier lot déclaré</h4><Delivered value={app.production} environment="production" iterations={app.iterations}/></section></div>
          <p>Ces badges de livraison qualifient un reçu daté de même version et cible, pas l’état actuel d’un serveur. Aucun accord de livraison n’en est déduit.</p>
          <p>Pièces : {q.proofs.stale} d’une autre version · {q.proofs.unversioned} sans version déclarée · {q.proofs.undated} sans date de contrôle. Ces catégories peuvent se recouper.</p>
          <p>Critères : {q.criteria.stale} à réexaminer · {q.criteria.changesRequested} avec corrections demandées · {q.criteria.unassigned} sans phase explicite.</p>
          <section><h4>GitHub</h4>{app.github?.status==='observed'?<><a href={app.github.url} target="_blank" rel="noopener noreferrer">{app.github.inDefaultBranch===false?'Autre branche':app.github.defaultBranch||'Branche par défaut'} : <code>{short(app.github.inDefaultBranch===false?app.github.applicationCommit:app.github.mainSha)}</code></a><p>Observé le {date(app.github.observedAt)} · commit du périmètre {short(app.github.applicationCommit)}.</p>{app.github.openPrs?.map(p=><p key={p.url}><a href={p.url} target="_blank" rel="noopener noreferrer">PR #{p.number}{p.draft?' · brouillon':''}</a>{p.policyStatus==='failure'?' · PR Policy en échec':''}</p>)}</>:<p>{app.github?.status==='not_present'?'Périmètre connu non retrouvé avec les accès GitHub actuels. Les suivis antérieurs sont conservés.':'Observation GitHub à qualifier.'}</p>}</section>
          <section><h4>Copie locale datée — distincte du code installé</h4><p>{app.local?.status==='observed'?`${short(app.local.applicationCommit||app.local.headSha)} · ${app.local.branch} · ${app.local.dirty?'modifications locales conservées':'sans changement détecté'} · observation du ${date(app.local.observedAt)}`:'Version locale à qualifier.'}</p>{app.localReference&&<LocalFolder directory={app.localReference.directory} label={'Sources de '+app.name}/>}</section>
        </details>
      </article>;
    })}</div>
    {!filtered.length&&<p>Aucun projet pour cette recherche et ce filtre.</p>}
    {reference&&<details className="portfolio-reference"><summary>Référence locale et dossiers de travail</summary><p>{reference.sourceKind==='git-clone'?'Clone Git avec historique complet':'Archive de code sans historique Git'} · commit {short(reference.sourceSha)} · observation du {date(reference.observedAt)}. Ces chemins se trouvent sur ton PC, pas sur l’hébergement.</p><div className="reference-roots">{reference.roots.map(root=><LocalFolder key={root.id} directory={root.directory} label={root.label}/>)}</div></details>}
  </section>;
}
