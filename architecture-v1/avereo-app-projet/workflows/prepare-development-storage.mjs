import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {createDevelopmentStorageDirectory,openDevelopmentStorageDirectory} from './development-storage-directory.mjs';
import {exportDevelopmentSnapshot} from './development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from './development-snapshot-store.mjs';

const args=process.argv.slice(2),option=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
if(args.some(a=>a.startsWith('--')&&!['--registry','--create','--directory','--sequence','--proof-selection'].includes(a))||!option('--registry')
  ||args.includes('--create')===!!option('--directory'))throw Error('Choisir --registry FICHIER et --create OU --directory DOSSIER [--sequence N] [--proof-selection FICHIER].');
const area=args.includes('--create')?await createDevelopmentStorageDirectory():await openDevelopmentStorageDirectory(resolve(option('--directory')));
const registry=JSON.parse(await readFile(resolve(option('--registry')),'utf8'));
const proofSelection=option('--proof-selection')?JSON.parse(await readFile(resolve(option('--proof-selection')),'utf8')):[];
const data=await exportDevelopmentSnapshot(registry,{sequence:Number(option('--sequence')||1),proofSelection});
const app=fileURLToPath(new URL('..',import.meta.url));
const store=await openDevelopmentSnapshotStore({...area,publicRoots:[join(app,'frontend')]});
await store.importSnapshot(sealDevelopmentSnapshot(data,area.key));
console.log(JSON.stringify({status:'local_private_projection_prepared',directory:area.directory,sequence:data.sequence,
  applications:data.portfolio.length,iterations:data.iterations.length,selectedProofs:data.proofs.length,
  realSourcesWritten:false,connectRoleConnection:false,remotePublication:false},null,2));
