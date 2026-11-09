import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {createGithubRefresh} from './development-github-refresh.mjs';
import {createDevelopmentStore} from './development-store.mjs';
const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--registry')throw Error('Usage : --registry REGISTRE_PRIVÉ');
const r=JSON.parse(await readFile(resolve(args[1]),'utf8'));if(r.policy!=='local_private_read_only_no_connect_role_claim'||r.entries.some(e=>e.writable!==false)||r.githubRefresh?.enabled!==true)throw Error('Collecte privée consultative non configurée.');
const store=await createDevelopmentStore(r.entries,{applications:r.applications,githubObservationFile:r.githubObservationFile,evidenceQualificationFile:r.evidenceQualificationFile});
console.log(JSON.stringify(await createGithubRefresh({file:r.githubObservationFile,repositories:r.githubRefresh.repositories,minimumIntervalMs:r.githubRefresh.minimumIntervalMs??30000,getTrackedPrUrls:async()=>(await store.list()).flatMap(v=>v.githubPrUrls||[])})()));
