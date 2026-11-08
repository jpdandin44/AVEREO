import {readFile,writeFile,realpath} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,resolve,relative,isAbsolute} from 'node:path';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createServer as httpServer} from 'node:http';
import {createDevelopmentAccess} from './development-access.mjs';
import {createDevelopmentMiddleware} from './development-http.mjs';
import {createPrivateDirectory} from './development-private-directory.mjs';
import {createDevelopmentFixture} from './development-fixture.mjs';
import {createRoleBridgeClient} from './development-role-bridge.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from './development-snapshot-store.mjs';
import {exportDevelopmentSnapshot} from './development-snapshot-export.mjs';
import {createDevelopmentStorageDirectory,openDevelopmentStorageDirectory} from './development-storage-directory.mjs';

const app=fileURLToPath(new URL('..',import.meta.url)),args=process.argv.slice(2),get=n=>{const i=args.indexOf(n);return i<0?null:args[i+1];};
const demo=args.includes('--demo'),localOwner=args.includes('--local-private-owner');
if(args.some(a=>a.startsWith('--')&&!['--demo','--config','--port','--local-private-owner','--directory'].includes(a))
  ||Number(demo)+Number(localOwner)+Number(!!get('--config'))!==1||localOwner!==!!get('--directory'))throw Error('Choisir --demo OU --config CONFIGURATION_PRIVÉE OU --local-private-owner --directory STOCKAGE [--port 5199].');
const privateRoot=await createPrivateDirectory('avereo-development-bridge-');
let area,owner,bridge,fixtureServer;
if(demo){
  area=await createDevelopmentStorageDirectory();owner='101';const key=randomBytes(48).toString('hex');
  const entries=(await createDevelopmentFixture(join(privateRoot,'fixtures'))).map(e=>({...e,writable:false}));
  const registry={schema:'development-portfolio-registry',entries,applications:entries.map(e=>({id:e.id,name:e.application}))};
  const data=await exportDevelopmentSnapshot(registry,{sequence:1,proofSelection:[{iterationId:'demo-formulaire',proofId:'demo-parcours'}]});
  const store=await openDevelopmentSnapshotStore({...area,publicRoots:[join(app,'frontend')]});await store.importSnapshot(sealDevelopmentSnapshot(data,area.key));
  fixtureServer=httpServer(async(req,res)=>{
    if(req.method!=='POST'||req.url!=='/api/v1/developments/authorize'){res.writeHead(404);res.end();return;}
    let body='';for await(const chunk of req){body+=chunk;if(Buffer.byteLength(body)>16384){res.writeHead(413);res.end();return;}}
    const child=spawn('php',[fileURLToPath(new URL('../../avereo-app-connect/backend/tests/development-bridge-fixture.php',import.meta.url))],
      {windowsHide:true,env:{...process.env,DEVELOPMENTS_FIXTURE:'1',DEVELOPMENTS_FIXTURE_KEY:key},stdio:['pipe','pipe','ignore']});
    let output='';const timer=setTimeout(()=>child.kill(),5000);child.stdout.on('data',x=>output+=x);
    child.once('error',()=>{clearTimeout(timer);res.writeHead(503);res.end();});
    child.once('exit',code=>{clearTimeout(timer);if(res.writableEnded)return;res.writeHead(code===0?200:403,{'Content-Type':'application/json'});res.end(output||'{"error":"unavailable"}');});child.stdin.end(body);
  });
  await new Promise(r=>fixtureServer.listen(0,'127.0.0.1',r));
  bridge={url:`http://127.0.0.1:${fixtureServer.address().port}/api/v1/developments/authorize`,key,ownerConnectId:owner,fixture:true};
}else if(localOwner){
  area=await openDevelopmentStorageDirectory(resolve(get('--directory')));owner='1';
}else{
  const configFile=await realpath(resolve(get('--config'))),repo=resolve(app,'../..'),rel=relative(repo,configFile);
  if(!rel||rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../')&&!isAbsolute(rel))throw Error('Configuration secrète interdite dans le dépôt.');
  const config=JSON.parse(await readFile(configFile,'utf8'));
  if(config.mode!=='private_local_role_bridge'||config.fixture===true)throw Error('Configuration réelle explicite requise.');
  area=await openDevelopmentStorageDirectory(config.storageDirectory);owner=config.ownerConnectId;
  bridge={url:config.connectAuthorizationUrl,key:config.projectChannelKey,ownerConnectId:owner};
}
const port=Number(get('--port')||5199);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Port invalide.');
const origin=`http://127.0.0.1:${port}`,token=randomBytes(32).toString('hex');
const access=createDevelopmentAccess({adminId:owner,origin,bootstrap:token,demo,cookieName:`avereo_developments_local_${port}`});
const accessFile=join(privateRoot,'acces-administrateur.json');await writeFile(accessFile,JSON.stringify({version:1,token}),{mode:0o600});
const store=await openDevelopmentSnapshotStore({...area,publicRoots:[join(app,'frontend')]});
if(bridge?.key===area.key)throw Error('La publication et le contrôle de rôle exigent des clés distinctes.');
process.env.VITE_DEVELOPMENTS_LOCAL='1';delete process.env.AVEREO_REVIEW_ROOT;
const {createServer}=await import('../frontend/node_modules/vite/dist/node/index.js');
const server=await createServer({root:join(app,'frontend'),configFile:join(app,'frontend/vite.config.js'),server:{host:'127.0.0.1',port,strictPort:true,hmr:false,fs:{strict:true,deny:['**/.env','**/.env.*','**/suivi-*.json','**/publication-key','**/acces-administrateur.json']}},
  plugins:[{name:'private-development-snapshot',enforce:'pre',configureServer(s){s.middlewares.use(createDevelopmentMiddleware({access,store,authorize:bridge?createRoleBridgeClient(bridge):null}));}}]});
await server.listen();
console.log(`Projet — stockage privé et pont local : ${origin}/?developments`);
console.log(`Fichier d’accès local : ${accessFile}`);
console.log(demo?'RECETTE FICTIVE du pont PHP Drupal/CONNECT ; aucune identité réelle attestée.':localOwner?'COPIE RÉELLE PRIVÉE DU POSTE : lecture seule, aucune attestation de rôle ou de SSO CONNECT revendiquée.':'Capacité locale du propriétaire + contrôle de rôle serveur ; ce parcours ne constitue pas un SSO navigateur CONNECT.');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.close();fixtureServer?.close();process.exit(0);});
