import { readFile, mkdir, open } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';
const root=fileURLToPath(new URL('..',import.meta.url));
let config;
try { config=JSON.parse(await readFile(join(root,'.local/cockpit-local.json'),'utf8')); }
catch (error) { if(error.code!=='ENOENT')throw error;config=JSON.parse(await readFile(join(root,'data/cockpit-local.json'),'utf8')); }
config.appRoot=resolve(root,config.appRoot);
const source=join(root,'docs/pilotage/suivi-chantier.json');
const url='http://127.0.0.1:'+config.port+'/';
if(!Number.isInteger(config.port)||config.port<1024||config.port>65535)throw Error('Port invalide.');
let existing=null;
try{const response=await fetch(url+'local-review/state',{signal:AbortSignal.timeout(1500)});if(response.ok)existing=await response.json();}catch{}
if(existing){if(existing.source!==source)throw Error('Port occupé par un autre chantier ; aucun service arrêté.');console.log(url);process.exit(0);}
if(process.argv.includes('--background')&&!process.argv.includes('--child')){
    await mkdir(join(root,'.local'),{recursive:true});
    const output=await open(join(root,'.local/cockpit.log'),'a');
    const child=spawn(process.execPath,[fileURLToPath(import.meta.url),'--child'],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',output.fd,output.fd]});
    child.unref();await output.close();
    for(let count=0;count<30;count++){
        await new Promise(r=>setTimeout(r,500));
        try{const response=await fetch(url+'local-review/state',{signal:AbortSignal.timeout(500)});const state=await response.json();if(state.source===source){console.log(url);process.exit(0);}}catch{}
    }
    throw Error('Démarrage non confirmé. Lire .local/cockpit.log ; aucune réussite supposée.');
}
process.env.AVEREO_REVIEW_ROOT=join(root,'docs/pilotage');
process.env.AVEREO_PYTHON='python';
const {createServer}=await import(pathToFileURL(resolve(config.appRoot,'frontend/node_modules/vite/dist/node/index.js')).href);
const server=await createServer({root:resolve(config.appRoot,'frontend'),configFile:resolve(config.appRoot,'frontend/vite.config.js'),server:{host:'127.0.0.1',port:config.port,strictPort:true}});
await server.listen();
console.log('Cockpit de revue du protocole : '+url);
console.log('Source : '+source+' ; aucun déploiement ni décision automatique.');
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,async()=>{await server.close();process.exit(0);});
