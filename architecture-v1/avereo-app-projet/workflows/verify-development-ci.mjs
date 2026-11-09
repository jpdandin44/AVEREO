import assert from 'node:assert/strict';
import {readFile,readdir,writeFile} from 'node:fs/promises';
import {resolve,join,relative} from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {prepareDevelopmentPreproduction} from './prepare-development-preproduction.mjs';

const app=resolve(import.meta.dirname,'..'),repo=resolve(app,'../..');
const hash=b=>createHash('sha256').update(b).digest('hex');
const git=args=>execFileSync('git',args,{cwd:repo,encoding:'utf8'}).trim();
async function tree(directory){
 const result=[];for(const e of (await readdir(directory,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
  const p=join(directory,e.name);if(e.isDirectory())result.push(...await tree(p));else result.push({path:relative(repo,p).split('\\').join('/'),sha256:hash(await readFile(p))});
 }return result;
}
export function assertDevelopmentSource(manifest,expected){
 assert.match(expected,/^[a-f0-9]{40}$/);assert.equal(manifest.localUncommitted,false,'Uncommitted source is not a CI candidate');
 assert.equal(manifest.sourceSha,expected,'Package source must equal tested source');assert.equal(manifest.baseSha,expected);
 assert.equal(manifest.readyToDeploy,false);assert.equal(manifest.deployed,false);
}
export function assertDevelopmentPackagePath(path){
 const allowed=/^(?:public\/developpements\/(?:api\.php|bootstrap\.php|index\.php|module-link\.js)|private\/runtime\/(?:Failure|SessionAuthorization|SnapshotReader|Runtime|Factory|SignedMessage)\.php|private\/assets\/(?:assets\.json|index\.html|[A-Za-z0-9_-]+\.(?:js|css))|configuration\/(?:developments|connect-developments|drupal-authority)\.example\.php|dependencies\/connect-drupal\.required\.json|preparation\/plan\.json|installation\.md)$/;
 assert(allowed.test(path),'Unexpected private package file: '+path);
}
export async function verifyDevelopmentCi(output,expected){
 assert.equal(git(['rev-parse','HEAD']),expected);assert.equal(git(['status','--porcelain=v1','--untracked-files=all']),'','CI requires a clean source checkout');
 const publicBefore=await tree(join(app,'frontend/public')),dataBefore=await tree(join(app,'data'));
 const manifest=await prepareDevelopmentPreproduction(output);assertDevelopmentSource(manifest,expected);
 assert.deepEqual(await tree(join(app,'frontend/public')),publicBefore,'Private build must not alter the planning');
 assert.deepEqual(await tree(join(app,'data')),dataBefore,'Private build must not write canonical data');
 assert.equal(git(['status','--porcelain=v1','--untracked-files=all']),'','Package preparation changed tracked sources');
 assert.equal(hash(JSON.stringify(manifest.files)),manifest.artifactSha256);
 for(const f of manifest.files){assert.equal(hash(await readFile(join(output,'package',f.path))),f.sha256);assertDevelopmentPackagePath(f.path);}
 const publicFiles=manifest.files.filter(f=>f.path.startsWith('public/')).map(f=>f.path).sort();
 assert.deepEqual(publicFiles,['public/developpements/api.php','public/developpements/bootstrap.php','public/developpements/index.php','public/developpements/module-link.js']);
 for(const file of ['developments','connect-developments','drupal-authority'])assert.match(await readFile(join(output,'package/configuration',file+'.example.php'),'utf8'),/'enabled'=>false/);
 const plan=JSON.parse(await readFile(join(output,'package/preparation/plan.json'),'utf8'));
 assert.equal(plan.readyToDeploy,false);assert.equal(plan.serverChangesAuthorized,false);assert.equal(plan.activationAuthorized,false);
 assert.equal(plan.publication.transportImplemented,false);assert.equal(plan.delivery.workflowModified,false);
 assert.equal(plan.deliveryObservation.workflowSha256,hash(await readFile(join(repo,plan.delivery.workflow))));
 assert.equal(plan.deliveryObservation.protectionApplied,false);
 const normal=await tree(join(app,'frontend/dist'));
 for(const f of normal){assert(!/developpements|developments|snapshot|publication-key/i.test(f.path));
  if(/\.(js|html)$/i.test(f.path)){const text=await readFile(join(repo,f.path),'utf8');assert(!text.includes('/local-developments/'));assert(!text.includes('developments:read'));assert(!text.includes('development-portfolio-registry'));}
 }
 const receipt={schema:'avereo-development-ci-verification',observedAt:new Date().toISOString(),status:'passed',sourceSha:expected,artifactSha256:manifest.artifactSha256,
  packageFiles:manifest.files.length,normalBuildFiles:normal.length,publicPlanningUnchanged:true,canonicalDataUnchanged:true,publicBundleExcludesModule:true,
  privatePackageDisabledByDefault:true,realDataOrSecretsIncluded:false,realModuleSsoVerified:false,drupalKernelVerified:false,readyToDeploy:false,deployed:false};
 await writeFile(join(output,'ci-verification.json'),JSON.stringify(receipt,null,2),{flag:'wx',mode:0o600});return receipt;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const a=process.argv.slice(2);assert.deepEqual([a[0],a[2],a.length],['--output','--expected-source',4]);
 console.log(JSON.stringify(await verifyDevelopmentCi(resolve(a[1]),a[3]),null,2));
}
