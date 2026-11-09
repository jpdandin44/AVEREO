/** Presentation only: never grants access, approves a criterion or launches delivery. */
export function environmentBadge(environment,value,iterations=[]){
  if(!['preproduction','production'].includes(environment))throw Error('Environnement inconnu.');
  const preprod=environment==='preproduction',name=preprod?'Préprod':'Production';
  const version=value?.sourceSha||value?.artifactSha256||'';
  const evidence=value?.verification;
  const documented=value&&/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(version)
    &&typeof evidence?.evidence==='string'&&evidence.evidence.trim()
    &&evidence.status==='documented'&&typeof evidence.observedAt==='string'&&!Number.isNaN(Date.parse(evidence.observedAt));
  if(documented)return{tone:preprod?'green':'blue',shape:'dot',label:preprod?'Préprod disponible':'Production en service',
    detail:preprod?'Contrôle documenté · recette humaine distincte':'Contrôle documenté dans le suivi',
    explanation:'Livraison et contrôle de cette version déclarés dans le suivi ; pas une vérification en temps réel.',observedAt:evidence.observedAt,evidence:evidence.evidence};
  if(value)return{tone:'gray',shape:'dot',label:name+' déclarée',detail:'À qualifier',explanation:'Livraison déclarée sans contrôle hébergé documenté de la même version/cible. Aucun état réel du serveur n’est déduit.',observedAt:value.observedAt||null};
  const phase=preprod?2:3,active=iterations.filter(i=>!i.unavailable&&i.currentPhase===phase);
  if(active.some(i=>i.status==='blocked'))return{tone:'red',shape:'dot',label:'Bloqué — suivi',detail:name+' non qualifiée',explanation:'Le suivi de cette phase est bloqué ; ce badge ne décrit pas une panne du service déjà en production.'};
  if(!preprod){
    const pending=active.find(i=>['awaiting_approval','awaiting_review','in_progress'].includes(i.status));
    if(pending)return{tone:'orange',shape:'triangle',label:pending.status==='awaiting_approval'?'Production à autoriser':pending.status==='awaiting_review'?'Production à examiner':'Production à préparer',
      detail:'Aucune livraison qualifiée',explanation:'Travail déclaré dans la phase Mise en production ; aucune autorisation ou livraison n’est déduite du badge.'};
  }
  return{tone:'gray',shape:'dot',label:'À qualifier',detail:name+' non renseignée',explanation:'Aucune livraison qualifiée pour cet environnement. Une CI verte ou une phase terminée ne prouve pas une livraison.'};
}
