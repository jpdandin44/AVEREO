import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';
import {createGithubRefresh,storedGhRequest} from './development-github-refresh.mjs';
import {createDevelopmentStore} from './development-store.mjs';

export async function watchGithub({refresh,intervalMs=300000,signal,onStatus=()=>{},wait=delay,once=false}){
  if(!Number.isInteger(intervalMs)||intervalMs<300000||intervalMs>3600000)throw Error('Intervalle admis : 5 à 60 minutes.');
  do{
    if(signal?.aborted)return;
    try{const observation=await refresh();onStatus({status:'observed',...observation,remotePublication:false});}
    catch(error){onStatus({status:error.status===429?'deferred':'failed',lastGoodObservationPreserved:true,remotePublication:false});}
    if(once||signal?.aborted)return;
    try{await wait(intervalMs,undefined,{signal});}catch(error){if(signal?.aborted)return;throw error;}
  }while(!signal?.aborted);
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
  if(!args.includes('--start')||!args.includes('--registry')||args.some(a=>a.startsWith('--')&&!['--start','--registry','--interval','--once'].includes(a)))throw Error('Démarrage explicite : --start --registry REGISTRE_PRIVÉ [--interval SECONDES] [--once]. Aucune installation automatique.');
  const registry=JSON.parse(await readFile(resolve(value('--registry')),'utf8'));
  if(registry.schema!=='development-portfolio-registry'||registry.policy!=='local_private_read_only_no_connect_role_claim'||registry.entries?.some(e=>e.writable!==false)||registry.githubRefresh?.enabled!==true||registry.githubRefresh.provider!=='gh_stored')throw Error('Collecte privée consultative non configurée.');
  const store=await createDevelopmentStore(registry.entries,{applications:registry.applications,githubObservationFile:registry.githubObservationFile,evidenceQualificationFile:registry.evidenceQualificationFile});
  const controller=new AbortController();for(const event of ['SIGINT','SIGTERM'])process.once(event,()=>controller.abort());
  const githubRequest=storedGhRequest();
  const refresh=createGithubRefresh({file:registry.githubObservationFile,repositories:registry.githubRefresh.repositories,request:async path=>{if(controller.signal.aborted)throw Error('Collecte arrêtée.');return githubRequest(path);},minimumIntervalMs:Math.max(30000,registry.githubRefresh.minimumIntervalMs||30000),getTrackedPrUrls:async()=>(await store.list()).flatMap(v=>v.githubPrUrls||[])});
  await watchGithub({refresh,signal:controller.signal,once:args.includes('--once'),intervalMs:args.includes('--interval')?Number(value('--interval'))*1000:300000,onStatus:status=>console.log(JSON.stringify(status))});
}
