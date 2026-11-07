import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {createPrivateDirectory} from './development-private-directory.mjs';
import {createDevelopmentFixture} from './development-fixture.mjs';
import {exportDevelopmentSnapshot} from './development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from './development-snapshot-store.mjs';

const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
if(args.some(v=>v.startsWith('--')&&!['--package','--port'].includes(v))||!args.includes('--package'))throw Error('--package DOSSIER et --port 5202');
const output=resolve(get('--package')),manifest=JSON.parse(await readFile(join(output,'manifest.json'),'utf8'));
for(const f of manifest.files){if(createHash('sha256').update(await readFile(join(output,'package',f.path))).digest('hex')!==f.sha256)throw Error('Paquet modifié.');}
const port=Number(args.includes('--port')?get('--port'):5202);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Port invalide.');
const root=await createPrivateDirectory('avereo-projet-session-fixture-'),storage=join(root,'storage');await mkdir(storage,{mode:0o700});
const entries=(await createDevelopmentFixture(join(root,'sources'))).map(e=>({...e,writable:false}));
const data=await exportDevelopmentSnapshot({schema:'development-portfolio-registry',entries,applications:entries.map(e=>({id:e.id,name:e.application}))},{sequence:1,proofSelection:[{iterationId:'demo-formulaire',proofId:'demo-parcours'}]});
const publicationKey=randomBytes(48).toString('hex'),store=await openDevelopmentSnapshotStore({directory:storage,key:publicationKey});await store.importSnapshot(sealDevelopmentSnapshot(data,publicationKey));
const config=join(root,'fixture.json');
await writeFile(config,JSON.stringify({port,storage,publicationKey,assets:join(output,'package/private/assets')}),{mode:0o600});
const app=fileURLToPath(new URL('..',import.meta.url));
const child=spawn('php',['-S','127.0.0.1:'+port,join(app,'tests/development-session-router.php')],{env:{...process.env,PROJET_SESSION_FIXTURE_CONFIG:config},windowsHide:true,stdio:['ignore','ignore','ignore']});
child.once('error',()=>{throw Error('PHP local indisponible.');});child.once('exit',code=>process.exit(code||0));
console.log('Recette SESSION PROJET FICTIVE — http://127.0.0.1:'+port+'/ — aucun compte réel ni déploiement.');
for(const event of ['SIGINT','SIGTERM'])process.once(event,()=>child.kill());
