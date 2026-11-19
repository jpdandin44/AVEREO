const time=x=>typeof x==='string'&&Number.isFinite(Date.parse(x))?Date.parse(x):null;
export function developmentFreshness(state,{now=Date.now()}={}){
 const p=state?.publisherStatus,githubAt=state?.githubSnapshot?.observedAt||null,snapshotAt=state?.snapshot?.generatedAt||null;
 const age=x=>{const t=time(x);return t===null||t>now+60000?Infinity:Math.max(0,now-t);};
 if(!p)return{level:'warning',title:'Actualisation automatique non attestée',message:'Cet écran relit une publication figée. Aucune collecte récente du service privé n’est attestée.',githubAt,snapshotAt,sourcesAt:null};
 const max=Math.max(3*p.intervalSeconds,300)*1000;
 if(p.status!=='ok'||p.sequence!==state.snapshot?.sequence||!Number.isFinite(max)||age(p.lastSuccessAt)>max||age(p.githubObservedAt)>max)return{level:'error',title:'Alimentation du cockpit en défaut',message:'Les dernières données connues sont conservées, mais elles ne sont pas présentées comme à jour. Une nouvelle collecte réussie est nécessaire.',githubAt,snapshotAt,sourcesAt:p.sourcesReceivedAt};
 const expiry=time(p.credentialExpiresAt),renew=expiry!==null&&expiry-now<7*86400000;
 return{level:renew?'warning':'ok',title:renew?'Collecte récente — accès GitHub à renouveler':'Collecte GitHub récente',message:'Le service privé a contrôlé GitHub. Les suivis proviennent de leur dernière réception distincte ; un travail non transmis ne peut pas être découvert par le serveur.',githubAt:p.githubObservedAt,snapshotAt,sourcesAt:p.sourcesReceivedAt,lastCheckAt:p.lastSuccessAt,intervalSeconds:p.intervalSeconds,credentialExpiresAt:p.credentialExpiresAt||null};
}
export function publicationReloadNotice(previous,incoming){
 if(!incoming?.snapshot)return'Lecture des sources locales terminée ; aucune collecte GitHub n’est déduite de cette lecture.';
 return incoming.snapshot.sequence===previous?.snapshot?.sequence
  ?'Aucune nouvelle publication reçue : la publication '+incoming.snapshot.sequence+' est inchangée. La date de ce clic n’est pas une date de collecte.'
  :'Nouvelle publication reçue : '+incoming.snapshot.sequence+'. Consulter séparément les dates de collecte GitHub et de réception des suivis.';
}
