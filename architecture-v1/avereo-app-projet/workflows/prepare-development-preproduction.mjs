import {readFile,writeFile,mkdir,readdir,copyFile,realpath,lstat} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute,dirname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const app=fileURLToPath(new URL('..',import.meta.url)),repo=resolve(app,'../..'),sha=b=>createHash('sha256').update(b).digest('hex');
const inside=(root,path)=>{const rel=relative(root,path);return !rel||rel!=='..'&&!rel.startsWith('..'+sep)&&!isAbsolute(rel);};
export async function prepareDevelopmentPreproduction(output){
  const sourceBefore={head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),
    status:execFileSync('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:repo,encoding:'utf8'})};
  output=resolve(output);const parent=await realpath(dirname(output));
  if(parent!==dirname(output)||inside(repo,output)||inside(join(app,'frontend'),output))throw Error('Sortie hors dépôt et hors racines publiques requise.');
  try{await lstat(output);throw Error('Préserver le paquet existant : choisir un nouveau dossier.');}catch(e){if(e.code!=='ENOENT')throw e;}
  await mkdir(output,{mode:0o700});
  const packageRoot=join(output,'package'),buildDir=join(output,'build-private');
  for(const name of ['public/developpements','private/runtime','private/assets','configuration','dependencies','preparation'])await mkdir(join(packageRoot,name),{recursive:true,mode:0o700});
  const {build}=await import('../frontend/node_modules/vite/dist/node/index.js');
  await build({configFile:join(app,'workflows/development-hosted.config.mjs'),build:{outDir:buildDir,emptyOutDir:false}});
  const assets={};
  for(const file of await readdir(join(buildDir,'assets'))){
    if(!/^[A-Za-z0-9_-]+\.(js|css)$/.test(file))throw Error('Asset privé inattendu.');
    const bytes=await readFile(join(buildDir,'assets',file));await writeFile(join(packageRoot,'private/assets',file),bytes,{flag:'wx',mode:0o600});assets[file]=sha(bytes);
  }
  let html=await readFile(join(buildDir,'developments.html'),'utf8');
  html=html.replace(/(?:\.\/|\/)?assets\/([A-Za-z0-9_-]+\.(?:js|css))/g,(_,name)=>'/developpements/api.php?route=asset&amp;name='+name);
  if(html.includes('/assets/')||html.includes('src/developments')||html.includes('http://'))throw Error('Entrée privée invalide.');
  await writeFile(join(packageRoot,'private/assets/index.html'),html,{flag:'wx',mode:0o600});assets['index.html']=sha(html);
  await writeFile(join(packageRoot,'private/assets/assets.json'),JSON.stringify(assets,null,2),{flag:'wx',mode:0o600});
  for(const file of ['Failure.php','SessionAuthorization.php','SnapshotReader.php','Runtime.php','Factory.php'])await copyFile(join(app,'backend/developments',file),join(packageRoot,'private/runtime',file));
  await copyFile(resolve(app,'../avereo-app-connect/backend/src/Developments/SignedMessage.php'),join(packageRoot,'private/runtime/SignedMessage.php'));
  for(const file of ['index.php','api.php','bootstrap.php','module-link.js'])await copyFile(join(app,'backend/developments/public',file),join(packageRoot,'public/developpements',file));
  const plan=JSON.parse(await readFile(join(app,'workflows/development-preparation-plan.json'),'utf8'));
  for(const file of plan.configuration.templates){
    if(!/^(?:developments|connect-developments|drupal-authority)\.example\.php$/.test(file))throw Error('Modèle privé inattendu.');
    await writeFile(join(packageRoot,'configuration',file),await readFile(join(app,'workflows/templates',file)),{flag:'wx',mode:0o600});
  }
  const workflow=await readFile(join(repo,plan.delivery.workflow));
  const preparation={...plan,deliveryObservation:{workflowSha256:sha(workflow),deleteOptionObserved:/--delete\b/.test(workflow.toString()),
    observation:'source_only_not_a_remote_target_or_rsync_dry_run',protectionApplied:false}};
  await writeFile(join(packageRoot,'preparation/plan.json'),JSON.stringify(preparation,null,2),{flag:'wx',mode:0o600});
  const upstreamPaths=[
    'architecture-v1/avereo-app-connect/backend/src/Developments/SignedMessage.php',
    'architecture-v1/avereo-app-connect/backend/src/Developments/AuthorizationBroker.php',
    'architecture-v1/avereo-app-connect/backend/src/Developments/PrivateFactory.php',
    'architecture-v1/avereo-app-connect/backend/src/Application.php',
    'architecture-v1/avereo-app-connect/backend/src/Http/Request.php',
    'architecture-v1/avereo-app-connect/backend/public/index.php',
    'architecture-v1/avereo-app-connect/integrations/drupal/avereo_identity_bridge/avereo_identity_bridge.routing.yml',
    'architecture-v1/avereo-app-connect/integrations/drupal/avereo_identity_bridge/src/Controller/DevelopmentAuthorizationController.php',
    'architecture-v1/avereo-app-connect/integrations/drupal/avereo_identity_bridge/src/Security/DevelopmentRoleAssertion.php'];
  const upstream=[];for(const path of upstreamPaths)upstream.push({path,sha256:sha(await readFile(join(repo,path)))});
  await writeFile(join(packageRoot,'dependencies/connect-drupal.required.json'),JSON.stringify({installed:false,qualificationRequired:true,files:upstream},null,2),{flag:'wx',mode:0o600});
  await copyFile(join(app,'docs/preproduction-developpements.md'),join(packageRoot,'installation.md'));
  const walk=async(dir)=>{const result=[];for(const name of (await readdir(dir)).sort()){const path=join(dir,name);if((await lstat(path)).isDirectory())result.push(...await walk(path));else{const bytes=await readFile(path);result.push({path:relative(packageRoot,path).split(sep).join('/'),bytes:bytes.length,sha256:sha(bytes)});}}return result;};
  const files=await walk(packageRoot);
  if(files.some(f=>/publication-key|snapshot|storage\.json|\.env|acces-administrateur|suivi-/.test(f.path)))throw Error('Donnée ou secret interdit dans le paquet.');
  const artifactSha256=sha(JSON.stringify(files));
  const sourceAfter={head:execFileSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8'}).trim(),
    status:execFileSync('git',['status','--porcelain=v1','--untracked-files=all'],{cwd:repo,encoding:'utf8'})};
  const cleanSource=sourceBefore.head===sourceAfter.head&&sourceBefore.status===''&&sourceAfter.status==='';
  const manifest={schema:'avereo-projet-developments-preproduction-package',version:1,generatedAt:new Date().toISOString(),sourceSha:cleanSource?sourceBefore.head:null,
    baseSha:sourceBefore.head,localUncommitted:!cleanSource,
    artifactSha256,definition:'SHA-256 of JSON.stringify(files), sorted tree; not a hosted release',
    target:'https://projet-preprod.avereo.fr/developpements/',readyToDeploy:false,deployed:false,
    preserves:['existing Projet gate and signed cookie','planning files and client directories','canonical trackers','account roles and existing secrets'],
    excludes:['real credentials','real snapshot/proofs','automatic installation','GitHub deployment workflows'],files};
  await writeFile(join(output,'manifest.json'),JSON.stringify(manifest,null,2),{flag:'wx',mode:0o600});
  return manifest;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--output')throw Error('Usage : --output DOSSIER_NOUVEAU_HORS_DEPOT');
  console.log(JSON.stringify(await prepareDevelopmentPreproduction(args[1]),null,2));
}
