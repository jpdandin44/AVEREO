// Réutilise exclusivement les API privées existantes ; aucune nouvelle route publique.
export async function loadDevelopmentTimeline(state,request,cache=new Map(),cancelled=()=>false){
  const key=state.snapshot?String(state.snapshot.sequence)+':'+state.snapshot.generatedAt:null;
  const github=state.githubSnapshot?.observedAt||'unknown',items=state.iterations||[],result=new Array(items.length);
  let next=0,denied=false;
  async function worker(){
    while(!cancelled()&&!denied&&next<items.length){
      const index=next++,item=items[index];
      if(item.unavailable){cache.delete(item.id);result[index]=item;continue;}
      const version=key||((item.revision||state.readAt||'')+':'+github),old=cache.get(item.id);
      if(old?.version===version){result[index]=old.view;continue;}
      try{
        const view=(await request('iteration?iteration='+encodeURIComponent(item.id))).iteration;
        if(!view||view.id!==item.id||view.phases?.length!==4)throw Error('Suivi incomplet.');
        if(key&&item.revision&&view.revision!==item.revision)throw Error('Publication modifiée ; lecture incohérente refusée.');
        if(cancelled()||denied)return;
        cache.set(item.id,{version,view});result[index]=view;
      }catch(error){
        cache.delete(item.id);
        if([401,403].includes(error.status)){denied=true;cache.clear();throw error;}
        result[index]={...item,unavailable:true,message:'Source indisponible ; ancien résultat non réutilisé.'};
      }
    }
  }
  // Attendre tous les lecteurs avant de propager un refus : aucune réponse tardive
  // ne doit repeupler le cache après la perte de droits.
  const outcomes=await Promise.allSettled(Array.from({length:Math.min(4,items.length)},worker));
  const failure=outcomes.find(v=>v.status==='rejected');
  if(failure){cache.clear();throw failure.reason;}
  for(const id of cache.keys())if(!items.some(i=>i.id===id))cache.delete(id);
  return result;
}
