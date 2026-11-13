import {mkdtemp,writeFile,readFile,realpath,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createDevelopmentAccess} from './development-access.mjs';
import {createDevelopmentStore} from './development-store.mjs';
import {createDevelopmentMiddleware} from './development-http.mjs';
import {createGithubRefresh} from './development-github-refresh.mjs';
import {createDevelopmentFixture} from './development-fixture.mjs';
import {createPrivateDirectory} from './development-private-directory.mjs';

const app=fileURLToPath(new URL('..',import.meta.url));
const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?undefined:args[i+1];};
if(args.some(a=>a.startsWith('--')&&!['--demo','--config','--port'].includes(a)))throw new Error('Options : --demo OU --config FICHIER_PRIVÉ [--port 5196]');
const demo=args.includes('--demo');if(demo&&option('--config'))throw new Error('Choisir démonstration ou configuration privée, pas les deux.');
const port=Number(option('--port')||5196);if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Port invalide.');
const privateRoot=await createPrivateDirectory('avereo-developments-private-');
let entries,adminId,applications=[],githubObservationFile=null,evidenceQualificationFile=null,githubRefresh=null,patrimonyObservationFile=null;
if(demo){entries=await createDevelopmentFixture(join(privateRoot,'fixtures'));adminId='101';}
else{
  if(!option('--config'))throw new Error('Accès fermé : --demo ou --config privé explicite requis.');
  const configPath=await realpath(resolve(option('--config')));
  const frontend=await realpath(join(app,'frontend'));
  const rel=relative(frontend,configPath);if(rel!== '..'&&!rel.startsWith('..\\')&&!rel.startsWith('../')&&!isAbsolute(rel))throw new Error('Configuration interdite dans le frontend.');
  const config=JSON.parse(await readFile(configPath,'utf8'));
  if(config.localAdministratorConfirmed!==true)throw new Error('Compte administrateur local non confirmé. Aucun raccordement CONNECT implicite.');
  adminId=config.globalAdminConnectId;entries=config.entries;applications=config.applications||[];githubObservationFile=config.githubObservationFile||null;evidenceQualificationFile=config.evidenceQualificationFile||null;githubRefresh=config.githubRefresh||null;
  patrimonyObservationFile=config.patrimonyObservationFile||null;
  if(patrimonyObservationFile){const rel=relative(frontend,await realpath(patrimonyObservationFile));if(rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../')&&!isAbsolute(rel))throw Error('Inventaire interdit dans le frontend.');}
  if(evidenceQualificationFile){const rel=relative(frontend,await realpath(evidenceQualificationFile));if(rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../')&&!isAbsolute(rel))throw Error('Qualification interdite dans le frontend.');}
  if(githubObservationFile){const rel=relative(frontend,await realpath(githubObservationFile));if(rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../')&&!isAbsolute(rel))throw Error('Observation GitHub interdite dans le frontend.');}
}
const origin=`http://127.0.0.1:${port}`;
// Le secret de bootstrap n'est écrit qu'une fois hors du dépôt et jamais affiché.
// L'accès factory reçoit un secret explicite pour produire le fichier privé.
const {randomBytes}=await import('node:crypto');const token=randomBytes(32).toString('hex');
const actualAccess=createDevelopmentAccess({adminId,origin,bootstrap:token,demo});
const accessFile=join(privateRoot,'acces-administrateur.json');
await writeFile(accessFile,JSON.stringify({version:1,token})+'\n',{mode:0o600});
const store=await createDevelopmentStore(entries,{adminId,applications,githubObservationFile,evidenceQualificationFile,patrimonyObservationFile});
if(githubRefresh?.enabled&&githubRefresh.provider!=='gh_stored')throw Error('Fournisseur GitHub local non qualifié.');
const refreshGithub=!demo&&githubRefresh?.enabled===true?createGithubRefresh({file:githubObservationFile,repositories:githubRefresh.repositories,minimumIntervalMs:Math.max(30000,githubRefresh.minimumIntervalMs||30000),getTrackedPrUrls:async()=>(await store.list()).flatMap(v=>v.githubPrUrls||[])}):null;
delete process.env.AVEREO_REVIEW_ROOT;
process.env.VITE_DEVELOPMENTS_LOCAL='1';
const {createServer}=await import('../frontend/node_modules/vite/dist/node/index.js');
const server=await createServer({root:join(app,'frontend'),configFile:join(app,'frontend/vite.config.js'),server:{host:'127.0.0.1',port,strictPort:true,hmr:false,fs:{strict:true,deny:['**/.env','**/.env.*','**/suivi-*.json','**/development-backups/**','**/acces-administrateur.json']}},plugins:[{name:'development-private-boundary',enforce:'pre',configureServer(s){s.middlewares.use(createDevelopmentMiddleware({access:actualAccess,store,refreshGithub}));}}]});
await server.listen();
console.log(`Projet Développements local privé : ${origin}/?developments`);
console.log(`Fichier d'accès à sélectionner dans la page : ${accessFile}`);
console.log(demo?'DÉMONSTRATION : identités, critères et décisions fictifs.':'Capacité locale privée ; rôle CONNECT réel non qualifié. Aucune publication.');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.close();process.exit(0);});
