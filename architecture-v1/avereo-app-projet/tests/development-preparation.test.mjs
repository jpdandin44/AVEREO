import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,mkdtemp,mkdir,cp,rm} from 'node:fs/promises';
import {resolve,join,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createDevelopmentFixture} from '../workflows/development-fixture.mjs';
import {exportDevelopmentSnapshot} from '../workflows/development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from '../workflows/development-snapshot-store.mjs';

const app=resolve(import.meta.dirname,'..');
const plan=JSON.parse(await readFile(join(app,'workflows/development-preparation-plan.json'),'utf8'));
test('préparation : trois modèles réellement inactifs, identités et secrets vides',()=>{
 assert.deepEqual(plan.configuration.templates,['developments.example.php','connect-developments.example.php','drupal-authority.example.php']);
 const configurations=plan.configuration.templates.map(file=>{
  const result=spawnSync('php',['-r','echo json_encode(require $argv[1], JSON_THROW_ON_ERROR);',join(app,'workflows/templates',file)],{encoding:'utf8',windowsHide:true});
  assert.equal(result.status,0,result.stderr);return JSON.parse(result.stdout);
 });
 for(const c of configurations)assert.equal(c.enabled,false);
 assert.equal(configurations[0].project_channel_key,'');assert.equal(configurations[0].environment,'preproduction');
 for(const key of ['owner_connect_id','project_key','identity_key'])assert.equal(configurations[1][key],'');
 for(const key of ['secret','owner_subject'])assert.equal(configurations[2][key],'');
 assert.equal(configurations[1].identity_issuer,configurations[2].issuer);
 assert.equal(configurations[1].identity_url,configurations[2].issuer+'/avereo/developments/authorization');
 assert.equal(new URL(configurations[0].connect_authorization_url).hostname,'connect.example.invalid');
});
test('préparation : plan consultatif, quatre phases et aucune autorisation distante',()=>{
 assert.deepEqual(plan.phases,['Cadrage','Développement local','Préproduction','Mise en production']);assert.equal(plan.currentPhase,1);
 for(const flag of ['readyToDeploy','serverChangesAuthorized','activationAuthorized','productionAuthorized'])assert.equal(plan[flag],false);
 assert.equal(plan.identity.requireExactOwnerAndFreshGlobalRole,true);assert.equal(plan.identity.otherGlobalAdministratorsAllowed,false);
 assert.equal(plan.identity.ownerConnectId,null);assert.equal(plan.identity.drupalSubject,null);assert.equal(plan.identity.positiveAuthorizationCache,false);
 assert.equal(plan.publication.sourceRegistryMustBeReadOnly,true);assert.equal(plan.publication.transportImplemented,false);
 assert.equal(plan.publication.realSourcesMigratedOrExportedByThisLot,false);assert.equal(plan.publication.browserWriteOrImportEndpoint,false);
 assert.equal(plan.publication.publicGitOrCiMayContainRealProjection,false);assert.equal(plan.publication.continuousSynchronizationInstalled,false);
 assert.equal(plan.clock.clockChangeAuthorized,false);assert.equal(plan.clock.toleranceChangeAuthorized,false);
 assert.equal(plan.clock.signedMessageFutureToleranceSeconds,5);assert.equal(plan.clock.signedMessageMaximumLifetimeSeconds,30);
});
test('préparation : suppression rsync identifiée, protection proposée mais jamais appliquée',async()=>{
 const workflow=await readFile(resolve(app,'../..',plan.delivery.workflow),'utf8');assert.match(workflow,/rsync -az --delete/);
 assert.equal(plan.delivery.status,'blocked_pending_exact_target_and_delete_protection');
 assert.deepEqual(plan.delivery.proposedRsyncProtectAndExclude,['/developpements/***']);assert.equal(plan.delivery.proposalApplied,false);
 assert.equal(plan.delivery.workflowModified,false);assert.equal(plan.delivery.dryRunAndDestinationInventoryRequired,true);
 assert.equal(plan.delivery.neverUploadWholePrivatePackageUnderWebroot,true);assert.equal(plan.delivery.neverReplaceHostedPlanningTemplateFromOldCopy,true);
 assert(plan.recovery.forbiddenRestoreScope.includes('client_plannings'));assert(plan.recovery.forbiddenRestoreScope.includes('connect_identity_database'));
 assert.equal(plan.recovery.hostedRestorationPerformed,false);assert.equal(plan.recovery.oldIndexMustNeverOverwriteLiveHighWater,true);
});
test('récupération sur copie fictive : sources intactes, séquence haute conservée, original non restauré',async t=>{
 const root=await mkdtemp(join(tmpdir(),'development-recovery-fixture-'));
 t.after(async()=>{assert(root.startsWith(resolve(tmpdir())+sep));assert(root.includes('development-recovery-fixture-'));await rm(root,{recursive:true,force:true});});
 const entries=(await createDevelopmentFixture(join(root,'sources'))).map(e=>({...e,writable:false}));
 const registry={schema:'development-portfolio-registry',entries,applications:entries.map(e=>({id:e.id,name:e.application}))};
 const sourceBefore=await Promise.all(entries.map(e=>readFile(join(e.root,e.file))));
 const live=join(root,'fixture-live'),copy=join(root,'isolated-recovery-copy');await mkdir(live,{mode:0o700});
 const key='fixture-only-recovery-key-not-a-real-key'.repeat(2),store=await openDevelopmentSnapshotStore({directory:live,key});
 const envelope=async sequence=>sealDevelopmentSnapshot(await exportDevelopmentSnapshot(registry,{sequence}),key);
 await store.importSnapshot(await envelope(1));const second=await envelope(2);await store.importSnapshot(second);
 const indexBefore=await readFile(join(live,'index.json'));await cp(live,copy,{recursive:true,errorOnExist:true,force:false});
 const restored=await openDevelopmentSnapshotStore({directory:copy,key});await restored.restorePrevious();
 const current=await restored.readCurrent();assert.equal(current.data.sequence,1);assert.equal(current.index.highWater,2);assert.equal(current.index.restored,true);
 await assert.rejects(restored.importSnapshot(second),/ancienne/);await restored.importSnapshot(await envelope(3));
 assert.equal((await restored.dashboard()).snapshot.sequence,3);assert.equal((await store.dashboard()).snapshot.sequence,2);
 assert.deepEqual(await readFile(join(live,'index.json')),indexBefore);
 assert.deepEqual(await Promise.all(entries.map(e=>readFile(join(e.root,e.file)))),sourceBefore);
});
