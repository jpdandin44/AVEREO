import {readFile,lstat,realpath,readdir} from 'node:fs/promises';
import {resolve,join,relative,extname} from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);

const hash=b=>createHash('sha256').update(b).digest('hex');
const statuses=['observed','partial','unavailable','not_configured'];
const date=s=>typeof s==='string'&&/T/.test(s)&&!Number.isNaN(Date.parse(s));
const identifier=s=>typeof s==='string'&&/^[a-z0-9_-]{1,100}$/.test(s);
const text=s=>typeof s==='string'&&s.length<=600&&!/[\x00-\x1f<>]/.test(s)&&!/(?:[a-z]:[\\/]|\/home\/)/i.test(s);
const keys=(o,list)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).length===list.length&&Object.keys(o).every(k=>list.includes(k));
export function validatePatrimony(p){
  if(p===null)return null;
  if(!keys(p,['schema','version','collectedAt','scope','mode','sources','metrics','exclusions','limitations'])||p.schema!=='avereo-development-patrimony'||p.version!==1||!date(p.collectedAt)||p.scope!=='AVEREO-reference'||p.mode!=='metadata_only_read_only')throw Error('Inventaire privé invalide.');
  if(!Array.isArray(p.sources)||p.sources.length>20||!Array.isArray(p.metrics)||p.metrics.length>30||!Array.isArray(p.exclusions)||!Array.isArray(p.limitations)||p.exclusions.length>30||p.limitations.length>30||![...p.exclusions,...p.limitations].every(text))throw Error('Inventaire privé invalide.');
  const sources=new Set(),metrics=new Set();
  for(const s of p.sources){if(!keys(s,['id','label','status','asOf','sha256'])||!identifier(s.id)||sources.has(s.id)||!text(s.label)||!statuses.includes(s.status)||(s.asOf!==null&&!date(s.asOf))||(s.sha256!==null&&!/^[a-f0-9]{64}$/.test(s.sha256)))throw Error('Source d’inventaire invalide.');sources.add(s.id);}
  for(const m of p.metrics){
    if(!keys(m,['id','label','value','unit','status','sourceId','asOf','meaning','items'])||!identifier(m.id)||metrics.has(m.id)||!text(m.label)||!text(m.unit)||!text(m.meaning)||!sources.has(m.sourceId)||!statuses.includes(m.status)||(m.asOf!==null&&!date(m.asOf))||!Array.isArray(m.items)||m.items.length>5000)throw Error('Indicateur invalide.');
    if(m.value!==null&&(!Number.isSafeInteger(m.value)||m.value<0)||['unavailable','not_configured'].includes(m.status)&&m.value!==null||m.status==='observed'&&m.value!==m.items.length||m.status==='partial'&&(m.value===null||m.value<m.items.length))throw Error('Comptage invalide.');
    const ids=new Set();for(const i of m.items){if(!keys(i,['id','label','kind','applicationIds'])||!identifier(i.id)||ids.has(i.id)||!text(i.label)||!text(i.kind)||!Array.isArray(i.applicationIds)||i.applicationIds.length>50||!i.applicationIds.every(identifier))throw Error('Détail invalide.');ids.add(i.id);}metrics.add(m.id);
  }
  if(Buffer.byteLength(JSON.stringify(p))>2*1024*1024)throw Error('Inventaire trop volumineux.');
  return p;
}
async function safeJson(file){
  const path=resolve(file),info=await lstat(path);
  if(!info.isFile()||info.isSymbolicLink()||info.size>2*1024*1024||await realpath(path)!==path)throw Error();
  const bytes=await readFile(path);return {data:JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,'')),sha256:hash(bytes),mtime:info.mtime.toISOString()};
}
export async function readPatrimonyObservation(file){
  if(!file)return null;
  try{return validatePatrimony((await safeJson(file)).data);}catch{return null;}
}
const ignored=new Set(['.git','node_modules','vendor','dist','build','coverage','generated','__pycache__','versions','sauvegardes','developpements','planning-data']);
const sensitive=/(?:^\.|secret|credential|token|cookie|acces-administrateur|customer|client|private)/i;
const allowed=new Set(['.md','.json','.yaml','.yml','.js','.mjs','.ts','.tsx','.jsx','.php','.py','.ps1','.css','.html','.txt','.log']);
/** Bounded metadata scan. Never opens file contents or follows links. */
async function scan(root,folder,limit){
  const start=join(root,folder),items=[];let partial=false,visited=0;
  async function visit(dir,depth){
    if(depth>8||++visited>2000){partial=true;return;}
    const info=await lstat(dir);if(!info.isDirectory()||info.isSymbolicLink()||await realpath(dir)!==dir){partial=true;return;}
    const entries=(await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name));
    for(const e of entries){if(visited>2000){partial=true;break;}if(ignored.has(e.name)||sensitive.test(e.name))continue;if(items.length>=limit){partial=true;break;}
      const path=join(dir,e.name);if(e.isSymbolicLink())continue;
      if(e.isDirectory())await visit(path,depth+1);
      else if(e.isFile()&&allowed.has(extname(e.name).toLowerCase())){
        const metadata=await lstat(path);if(metadata.isSymbolicLink()||await realpath(path)!==path)continue;
        const label=relative(root,path).replaceAll('\\','/');if(!text(label)){partial=true;continue;}
        items.push({id:'file-'+hash(label).slice(0,24),label,kind:'fichier '+extname(e.name),applicationIds:[]});
      }
    }
  }
  try{await visit(start,0);return {status:partial?'partial':'observed',value:items.length,items};}catch{return {status:'unavailable',value:null,items:[]};}
}
/** root/registry are operator configuration, never accepted from an HTTP query. */
export async function collectPatrimony({root,registryFile,maxFilesPerFolder=1500}){
  root=resolve(root);if(await realpath(root)!==root||(await lstat(root)).isSymbolicLink())throw Error('Racine non canonique.');
  if(!Number.isInteger(maxFilesPerFolder)||maxFilesPerFolder<1||maxFilesPerFolder>5000)throw Error('Limite invalide.');
  const collectedAt=new Date().toISOString(),sources=[],metrics=[];
  const item=(id,label,kind,applicationIds=[])=>({id,label,kind,applicationIds});
  async function input(id,label,file){
    try{const r=await safeJson(file);const asOf=r.data.observedAt&&date(r.data.observedAt)?r.data.observedAt:r.mtime;const s={id,label,status:'observed',asOf,sha256:r.sha256};sources.push(s);return {...r,source:s};}
    catch{sources.push({id,label,status:'unavailable',asOf:null,sha256:null});return null;}
  }
  function metric(id,label,sourceId,meaning,items=null){const s=sources.find(s=>s.id===sourceId);metrics.push({id,label,value:items?.length??null,unit:'éléments',status:items?'observed':'unavailable',sourceId,asOf:s.asOf,meaning,items:items||[]});}
  const reg=await input('registry','Registre consultatif',registryFile);
  if(reg&&(reg.data.schema!=='development-portfolio-registry'||!Array.isArray(reg.data.entries)||reg.data.entries.some(e=>e.writable!==false)||!Array.isArray(reg.data.applications)))throw Error('Registre consultatif requis.');
  const apps=reg?[...new Map(reg.data.applications.map(a=>[a.id,a])).values()]:null;
  metric('applications','Applications et sites','registry','Objets logiques du portefeuille ; pas un nombre de dossiers.',apps?.map(a=>item(a.id,a.name,'application',[a.id])));
  metric('iterations','Suivis référencés','registry','Entrées consultatives uniques ; un chantier commun peut concerner plusieurs applications.',reg?[...new Map(reg.data.entries.map(e=>[e.id,e])).values()].map(e=>item(e.id,e.title||e.id,'suivi',e.applicationIds||[])):null);
  const cat=await input('catalogue','Catalogue des références locales',join(root,'data/catalogue-applications.json'));
  metric('references','Références applicatives','catalogue','RGA peut être intégrée à Rapport ; une référence ne prouve aucune livraison.',Array.isArray(cat?.data.applications)?[...new Map(cat.data.applications.map(a=>[a.id,a])).values()].map(a=>item(a.id,a.name||a.id,'référence',[a.id])):null);
  const dev=await input('development','Inventaire des copies Git et sources',join(root,'data/inventaire-developpements.json'));
  const unique=values=>[...new Map(values.map(v=>[String(v).replaceAll('\\','/').toLowerCase(),v])).values()];
  const repos=Array.isArray(dev?.data.repositories)?unique(dev.data.repositories.map(r=>r.path).filter(p=>typeof p==='string')):null;
  metric('copies','Copies Git inventoriées','development','Copies de travail distinctes, pas des applications ; chemins privés non publiés.',repos?.map((p,n)=>item('copy-'+hash(p.toLowerCase()).slice(0,24),'Copie Git '+(n+1),'copie conservée')));
  const canonical=dev?.data.canonicalFiles&&typeof dev.data.canonicalFiles==='object'&&!Array.isArray(dev.data.canonicalFiles)?unique(Object.keys(dev.data.canonicalFiles)):null;
  metric('canonical','Sources canoniques inventoriées','development','Sources uniques de l’inventaire daté ; pas un nombre de projets.',canonical?.map((p,n)=>item('source-'+hash(p.toLowerCase()).slice(0,24),'Source canonique '+(n+1),'source inventoriée')));
  const backup=await input('backups','Inventaire des emplacements de sauvegarde',join(root,'data/inventaire-sauvegardes.json'));
  const places=Array.isArray(backup?.data.locations)?unique(backup.data.locations.map(l=>l.path).filter(p=>typeof p==='string')):null;
  metric('backups','Emplacements de sauvegarde','backups','Présence inventoriée uniquement. Intégrité, fraîcheur et restauration non attestées.',places?.map((p,n)=>item('backup-'+hash(p.toLowerCase()).slice(0,24),'Emplacement '+(n+1),'restauration à qualifier')));
  sources.push({id:'scan',label:'Lecture locale bornée des noms de fichiers',status:'observed',asOf:collectedAt,sha256:null});
  for(const folder of ['api','data','docs','prompts','scripts','tests','workflows']){
    const result=await scan(root,folder,maxFilesPerFolder);
    metrics.push({id:'folder-'+folder,label:folder+'/',unit:'fichiers admissibles',sourceId:'scan',asOf:collectedAt,meaning:'Métadonnées uniquement dans ce dossier du parent ; archives, dépendances, liens et noms sensibles exclus. Ce ne sont pas des résultats d’exécution.',...result});
  }
  // Index metadata only: no traversal of working copies or file-content reads.
  try{
    const repo=join(root,'depot');if(await realpath(repo)!==repo||(await lstat(repo)).isSymbolicLink())throw Error();
    const top=(await exec('git',['-C',repo,'rev-parse','--show-toplevel'],{timeout:8000,windowsHide:true})).stdout.trim();if(await realpath(top)!==repo)throw Error();
    const raw=(await exec('git',['-C',repo,'ls-files','--stage','-z'],{timeout:8000,maxBuffer:2*1024*1024,windowsHide:true})).stdout;
    const items=[];let partial=false;
    for(const line of raw.split('\0').filter(Boolean)){
      const match=/^(100644|100755) [a-f0-9]+ 0\t(.+)$/.exec(line);if(!match)continue;
      const path=match[2],parts=path.split('/');if(parts.some(p=>ignored.has(p)||sensitive.test(p))||!allowed.has(extname(path).toLowerCase()))continue;
      const label='depot/'+path;if(!text(label)||items.length>=5000){partial=true;continue;}
      const ids=[],app=/^architecture-v1\/avereo-app-([^/]+)\//.exec(path)?.[1];if(app&&apps?.some(a=>a.id===app))ids.push(app);
      if(path.startsWith('architecture-v1/avereo-app-rapport/frontend/public/rga/')&&apps?.some(a=>a.id==='rga'))ids.push('rga');
      items.push(item('tracked-'+hash(path).slice(0,24),label,'fichier suivi '+extname(path),ids));
    }
    sources.push({id:'git-index',label:'Index Git suivi du clone de référence',status:partial?'partial':'observed',asOf:collectedAt,sha256:hash(raw)});
    metrics.push({id:'folder-depot',label:'depot/ — fichiers suivis admissibles',value:items.length,unit:'fichiers suivis',status:partial?'partial':'observed',sourceId:'git-index',asOf:collectedAt,meaning:'Noms et modes de l’index Git uniquement ; pas une lecture des contenus ni une preuve de livraison. Fichiers non suivis et liens exclus.',items});
  }catch{
    sources.push({id:'git-index',label:'Index Git suivi du clone de référence',status:'unavailable',asOf:null,sha256:null});
    metric('folder-depot','depot/ — fichiers suivis admissibles','git-index','Index Git indisponible ; aucun zéro déduit.');
  }
  sources.push({id:'future',label:'Raccordements hors PQ-01',status:'not_configured',asOf:null,sha256:null});
  for(const [id,label] of [['test-cases','Cas de tests exécutés'],['bugs','Bugs ouverts'],['improvements','Améliorations livrées']])metrics.push({id,label,value:null,unit:'éléments',status:'not_configured',sourceId:'future',asOf:null,meaning:'Source de résultats non raccordée dans ce lot ; inconnu n’est pas zéro.',items:[]});
  return validatePatrimony({schema:'avereo-development-patrimony',version:1,collectedAt,scope:'AVEREO-reference',mode:'metadata_only_read_only',sources,metrics,
    exclusions:['Aucun contenu de fichier scanné','Pas de parcours récursif du clone, des archives ou des copies Git','Dépendances, sorties générées, liens et noms sensibles exclus','Les listes privées externes sont pseudonymisées'],
    limitations:['Collecte locale explicite, pas de synchronisation continue','Chaque source garde sa propre date ; une nouvelle lecture ne rafraîchit pas un ancien inventaire','Les fichiers tests ne sont pas des tests exécutés','Les emplacements de sauvegarde ne sont pas des preuves de restauration']});
}
