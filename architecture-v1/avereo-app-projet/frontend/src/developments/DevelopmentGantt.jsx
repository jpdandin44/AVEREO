import {useEffect,useRef,useState} from 'react';
import {projectDevelopmentProgress,timelineBounds,observationFreshness} from './development-progress.mjs';
import {loadDevelopmentTimeline} from './development-timeline-loader.mjs';

const format=v=>v?new Date(v).toLocaleDateString('fr-FR'):'Non daté';
const statusLabel={evidenced:'Étayé techniquement',partial:'Partiellement étayé',blocked:'Échec technique',not_evidenced:'À réaliser / à documenter'};
export default function DevelopmentGantt({state,request,onAccessFailure,onOpen}){
  const [views,setViews]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[filter,setFilter]=useState(''),[search,setSearch]=useState('');
  const cache=useRef(new Map()),callbacks=useRef({request,onAccessFailure});callbacks.current={request,onAccessFailure};
  useEffect(()=>{
    let cancelled=false;setLoading(true);setError('');
    loadDevelopmentTimeline(state,callbacks.current.request,cache.current,()=>cancelled).then(async incoming=>{
      if(cancelled)return;
      // Une publication peut changer pendant les lectures : ne pas mélanger deux séquences.
      if(state.snapshot){const check=await callbacks.current.request('state');if(cancelled)return;if(check.snapshot?.sequence!==state.snapshot.sequence||check.snapshot?.generatedAt!==state.snapshot.generatedAt)throw Error('Publication modifiée pendant la lecture ; reprise au prochain rafraîchissement.');}
      setViews(incoming);
    }).catch(failure=>{if(cancelled)return;cache.current.clear();setViews([]);setError(failure.message);if([401,403].includes(failure.status))callbacks.current.onAccessFailure(failure);}).finally(()=>{if(!cancelled)setLoading(false);});
    return()=>{cancelled=true;};
  },[state]);
  const items=views.filter(v=>(!filter||v.applicationIds?.includes(filter))&&(!search||(v.title+' '+v.application).toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr')))).map(view=>({view,progress:projectDevelopmentProgress(view)}));
  const bounds=timelineBounds(items.map(i=>i.progress)),today=new Date().toISOString(),freshness=observationFreshness(state.githubSnapshot?.observedAt);
  const ticks=Array.from({length:6},(_,i)=>new Date(bounds.start+(bounds.end-bounds.start)*i/5).toISOString());
  const open=view=>{const app=state.portfolio?.find(a=>view.applicationIds?.includes(a.id));if(app)onOpen(app,view.id);};
  return <section className="development-gantt" aria-label="Gantt des développements">
    <div className="gantt-intro"><div><span className="development-eyebrow">AVANCEMENT CALCULÉ · LECTURE SEULE</span><h2>Réalisé, preuves et reste à faire</h2><p>Quatre phases par itération. Le calcul ne remplace ni tes validations ni les autorisations de livraison.</p></div><span className={'gantt-freshness '+freshness}>GitHub : {freshness==='current'?'observation récente':freshness==='stale'?'observation ancienne':freshness==='invalid'?'horloge à vérifier':'date inconnue'}</span></div>
    <p className="development-notice">Lecture automatique de la vue toutes les 25 secondes lorsque l’onglet est visible. {state.snapshot?'Les nouvelles publications privées sont reprises automatiquement ; la collecte GitHub et leur publication continue restent à raccorder côté opérateur.':'Les suivis locaux sont relus ; une nouvelle observation GitHub nécessite le collecteur configuré.'} Dernière observation GitHub : {format(state.githubSnapshot?.observedAt)}. Aucun pourcentage estimé.</p>
    <div className="gantt-filters"><label>Application<select aria-label="Application du Gantt" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Toutes les applications</option>{state.portfolio?.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label>Rechercher<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Application ou itération"/></label></div>
    <p className="gantt-legend"><span>● Étayé par un contrôle réussi de la même version</span><span>◐ Partiel</span><span>■ Échec</span><span>▱ Prévision déclarée</span><span>│ Rouge : aujourd’hui</span></p>
    <p>Les barres pleines représentent la fenêtre des preuves datées, pas le temps réellement passé. Le reste sans dates apparaît « À planifier » ; aucune échéance n’est inventée. Un élément technique étayé n’est pas un critère accepté humainement.</p>
    {loading&&<p role="status">Actualisation des suivis… {views.length>0?'Les résultats précédents restent visibles jusqu’à la fin de la lecture.':''}</p>}{error&&<p role="alert" className="development-error">{error}</p>}
    <div className="gantt-scroll"><div className="gantt-canvas">
      <div className="gantt-axis"><strong>Itération / quatre phases</strong><div>{ticks.map((t,i)=><span key={t} title={format(t)} style={{left:(i*20)+'%'}}>{new Date(t).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>)}</div><strong>Réalisé et reste à faire</strong></div>
      {items.map(({view,progress})=><details className="gantt-iteration" key={view.id}><summary><strong>{view.application} — {view.title}</strong><span>{!progress?'Source indisponible':progress.evidenced+' élément(s) étayé(s) · '+progress.remaining+' identifié(s) à réaliser / qualifier · '+progress.humanRemaining+' critère(s) à examiner'+(progress.unquantifiedPhases?' · '+progress.unquantifiedPhases+' phase(s) au périmètre incomplet':'')}</span></summary>
        {!progress?<p>{view.message||'Source indisponible.'}</p>:<>
          <p className="gantt-source-note">Phase déclarée : {view.phases.find(p=>p.id===progress.declaredPhase)?.label||'inconnue'} · Dernière phase avec preuve technique concluante : {progress.phases.find(p=>p.id===progress.technicalPhase)?.label||'non déterminable'}{progress.phaseDiscrepancy?' · Écart à examiner, source conservée.':''} {progress.unassigned>0?'· '+progress.unassigned+' critère(s) sans phase.':''} <button onClick={()=>open(view)}>Voir les preuves et critères</button></p>
          {progress.phases.map(p=><div className="gantt-row" key={p.id}><div className="gantt-phase-label"><strong>{p.id}. {p.label}</strong><span className={'gantt-status '+p.status}>{statusLabel[p.status]}</span></div><div className="gantt-track">
            <span className="gantt-today" style={{left:bounds.position(today)+'%'}} aria-label="Aujourd’hui"/>
            {p.plan&&<span className="gantt-plan" title={'Prévision : '+format(p.plan.start)+' → '+format(p.plan.end)} style={{left:bounds.position(p.plan.start)+'%',width:Math.max(0.5,bounds.position(p.plan.end)-bounds.position(p.plan.start))+'%'}}/>}
            {p.evidenceStart&&<span className={'gantt-bar '+p.status} title={'Preuves concluantes : '+format(p.evidenceStart)+' → '+format(p.evidenceEnd)} style={{left:bounds.position(p.evidenceStart)+'%',width:Math.max(0.6,bounds.position(p.evidenceEnd)-bounds.position(p.evidenceStart))+'%'}}/>}
            {!p.evidenceStart&&!p.plan&&<span className="gantt-undated">{p.total?'À planifier / preuves à relier':'Périmètre et dates à préciser'}</span>}
          </div><div className="gantt-counts"><strong>{p.total?p.evidenced+'/'+p.total+' élément(s) technique(s) étayé(s)':'Aucun élément technique structuré'}</strong><span>{p.total?p.remaining+' identifié(s) restant(s), dont '+p.unknown+' sans preuve concluante'+(p.failed?' · '+p.failed+' échec(s)':''):'Travail restant non quantifié'}</span><small>{p.approved} critère(s) validé(s) · {p.humanRemaining} à examiner</small>{p.historical>0&&<small>{p.historical} contrôle(s)/pièce(s) historique(s), non compté(s) comme travail à refaire</small>}{p.steps.length>0&&<details><summary>Voir le reste à faire</summary><ul>{p.steps.filter(s=>s.status!=='evidenced').map(s=><li key={s.id}>{s.status==='failed'?'Échec — ':s.status==='unknown'?'À qualifier — ':''}{s.title}</li>)}</ul>{!p.remaining&&<p>Éléments techniques étayés ; validations humaines distinctes.</p>}</details>}</div></div>)}
        </>}
      </details>)}
      {!loading&&!items.length&&<p>Aucun suivi dans ce filtre. Aucun avancement n’est déduit d’une absence de données.</p>}
    </div></div>
  </section>;
}
