import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,mkdir,realpath,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,sep} from 'node:path';
import {randomBytes} from 'node:crypto';
import {createDevelopmentFixture} from '../workflows/development-fixture.mjs';
import {exportDevelopmentSnapshot} from '../workflows/development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from '../workflows/development-snapshot-store.mjs';
import {createGithubRefresh} from '../workflows/development-github-refresh.mjs';
import {projectDevelopmentProgress} from '../frontend/src/developments/development-progress.mjs';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));

test('publicateur : plan explicitement désactivé, cible unique et aucun droit navigateur supplémentaire',async()=>{
 const p=await read('../workflows/development-publisher-plan.json');
 assert.equal(p.mode,'qualification_only');for(const key of ['enabled','installed','activationAuthorized','productionAuthorized'])assert.equal(p[key],false);
 assert.equal(p.environment,'preproduction');assert.equal(p.target,'https://projet-preprod.avereo.fr/developpements/');
 assert.deepEqual(p.access,{exactOwnerRequired:true,freshGlobalRoleRequired:true,otherGlobalAdministratorsAllowed:false,browserReadOnly:true,publicReadAccess:false,newBrowserWriteRoute:false});
 assert.equal(p.publication.scope,'private_signed_snapshot_only');for(const key of ['transportImplemented','remoteAdmissionCommandInstalled','codeDeploymentAllowed','accountOrRoleChangesAllowed','productionWritesAllowed'])assert.equal(p.publication[key],false);
});
test('publicateur : données privées hors CI publique, collecte bornée et limites opérationnelles explicites',async()=>{
 const p=await read('../workflows/development-publisher-plan.json'),q=await read('../data/qualification-publicateur-prive.json');
 assert.equal(p.sources.publicRepositoryMayContainRealSnapshots,false);assert.equal(p.sources.publicCiMayReceiveRealTrackersOrProofs,false);assert.equal(p.sources.proofSelection,'explicit_allowlist_only');assert.equal(p.sources.maximumViews,50);assert.equal(p.sources.readOnly,true);
 assert.equal(p.collector.githubMethod,'GET');assert.equal(p.collector.minimumIntervalSeconds,300);assert.equal(p.collector.maximumIntervalSeconds,3600);
 for(const key of ['backgroundJobInstalled','serviceIdentityQualified','gitPullAllowed','mergeAllowed','humanApprovalWritesAllowed'])assert.equal(p.collector[key],false);
 assert.equal(p.collector.runsWithWorkstationOff,'not_qualified');assert.equal(q.readyToActivate,false);assert.equal(q.serverInspectedThisSession,false);assert.equal(q.serverWrites,0);assert.equal(q.productionWrites,0);assert(q.checks.some(c=>c.status==='blocked'));
 assert(!/publication-key|BEGIN (?:OPENSSH|RSA) PRIVATE KEY|github_pat_|ghp_|C:[\\/]|\/home\//.test(JSON.stringify({p,q})));
});
test('publicateur : admission, conservation et reprise exigées, aucune séquence distante inventée',async()=>{
 const p=(await read('../workflows/development-publisher-plan.json')).publication;
 for(const key of ['lockRequired','signatureRequired','expectedCurrentIndexHashRequired','backupRequired','restoreTrialOnCopyRequired','atomicAdmissionRequired','preserveClientData'])assert.equal(p[key],true);
 assert.equal(p.sequenceSource,'verified_remote_high_water_plus_one');assert.equal(p.retryPolicy,'reconcile_acknowledgement_before_any_new_sequence');assert.equal(p.preserveHumanEvents,'append_only_by_iteration_identity');assert.equal(p.rollback,'restore_previous_snapshot_keep_high_water_never_restore_business_database');
});
test('chaîne sur copie fictive : deux exports signés, panne de collecte, historique conservé et retour anti-rejeu',async t=>{
 const root=await realpath(await mkdtemp(join(tmpdir(),'publisher-fixture-'))),temp=await realpath(tmpdir());
 t.after(async()=>{assert(root.startsWith(temp+sep));await rm(root,{recursive:true,force:true});});
 const entries=(await createDevelopmentFixture(join(root,'sources'))).map(e=>({...e,writable:false})),source=join(entries[0].root,entries[0].file);
 const raw=JSON.parse(await readFile(source,'utf8'));raw.approvals=[{scope:'preproduction',status:'approved',actor:'fixture-owner',sourceSha:raw.candidate.sourceSha}];
 raw.developmentReviews=[{id:'fixture-comment',criterionId:'DEMO-01',action:'comment',actor:'fixture-owner',recordedAt:'2026-11-16T10:00:00Z',comment:'Observation fictive conservée.'}];await writeFile(source,JSON.stringify(raw));
 const originals=await Promise.all(entries.map(e=>readFile(join(e.root,e.file))));
 const cache=join(root,'github.json'),observation={schema:'development-github-observations',observedAt:'2026-11-16T10:00:00Z',applications:{},pullRequests:{},trackedPrUrls:[]};await writeFile(cache,JSON.stringify(observation));
 const registry={schema:'development-portfolio-registry',entries,applications:entries.map(e=>({id:e.id,name:e.application})),githubObservationFile:cache};
 const storage=join(root,'store');await mkdir(storage);const key=randomBytes(48).toString('hex'),store=await openDevelopmentSnapshotStore({directory:storage,key});
 const first=await exportDevelopmentSnapshot(registry,{sequence:1});await store.importSnapshot(sealDevelopmentSnapshot(first,key));
 const previousCache=await readFile(cache);await assert.rejects(createGithubRefresh({file:cache,repositories:['fixture/repo'],minimumIntervalMs:0,request:async()=>{throw Error('Panne simulée');}})());assert.deepEqual(await readFile(cache),previousCache);assert.equal((await store.dashboard()).snapshot.sequence,1);
 observation.observedAt='2026-11-16T11:00:00Z';await writeFile(cache,JSON.stringify(observation));
 const second=await exportDevelopmentSnapshot(registry,{sequence:2});await store.importSnapshot(sealDevelopmentSnapshot(second,key));
 const a=first.iterations[0],b=second.iterations[0];assert.deepEqual(b.history,a.history);assert.deepEqual(b.declaredApprovals,a.declaredApprovals);assert.deepEqual(b.phases,a.phases);assert.equal(second.proofs.length,0);
 assert.equal((await store.dashboard()).githubSnapshot.observedAt,observation.observedAt);assert.equal((await store.get(b.id)).writable,false);await assert.rejects(store.review(),/consultative/);
 const p=projectDevelopmentProgress(b,{now:Date.parse('2026-11-16T12:00:00Z')});assert.equal(p.evidenced,1);assert.equal(p.humanRemaining,3); // Contrôle technique, jamais acceptation humaine.
 const wrong=sealDevelopmentSnapshot(await exportDevelopmentSnapshot(registry,{sequence:3}),randomBytes(48).toString('hex'));await assert.rejects(store.importSnapshot(wrong));assert.equal((await store.dashboard()).snapshot.sequence,2);
 await store.restorePrevious();assert.equal((await store.dashboard()).snapshot.sequence,1);await assert.rejects(store.importSnapshot(sealDevelopmentSnapshot(second,key)),/ancienne/);
 assert.deepEqual(await Promise.all(entries.map(e=>readFile(join(e.root,e.file)))),originals);
});
