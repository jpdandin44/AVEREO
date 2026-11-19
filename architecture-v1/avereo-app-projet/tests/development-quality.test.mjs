import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {developmentQuality,applicationQuality} from '../workflows/development-quality.mjs';
const view={phases:[{criteria:[{id:'a',decision:'approved',proofIds:['a'],proofs:[{id:'a'}]},{id:'b',decision:'not_reviewed',proofIds:[],proofs:[]},{id:'c',decision:'stale',proofIds:['missing'],proofs:[]}],proofs:[{id:'a',availability:'available',freshness:'current',sourceSha:'a'.repeat(40),observedAt:'2026-11-19T10:00:00Z'},{id:'b',availability:'unavailable',sourceAvailability:'available',freshness:'stale'},{id:'c',availability:'reference'},{id:'d',availability:'unavailable'}]}],unassignedCriteria:[{id:'d',decision:'changes_requested',proofIds:[]}],unassignedProofs:[{id:'c',availability:'reference'}]};
test('counts separate human decisions, links and readable/missing/unpublished/external pieces',()=>{
 const before=JSON.stringify(view),q=developmentQuality(view);
 assert.deepEqual(q.criteria,{total:4,approved:1,unlinked:2,brokenLinks:1,stale:1,changesRequested:1,unassigned:1});
 assert.deepEqual(q.proofs,{total:4,available:1,external:1,unpublished:1,missing:1,stale:1,unversioned:3,undated:3});
 assert.equal(JSON.stringify(view),before);assert(!('percent' in q));
});
test('application aggregation filters iteration IDs; missing summaries remain unknown',()=>{
 const app={iterations:[{id:'a'},{id:'b'},{id:'b'}]},q=applicationQuality(app,[{id:'a',quality:developmentQuality(view),blockerCount:2},{id:'b',unavailable:true},{id:'other',quality:developmentQuality(view),blockerCount:9}]);
 assert.equal(q.criteria.total,4);assert.equal(q.unknown,1);assert.equal(q.known,1);assert.equal(q.blockers,2);
});
test('empty criteria are not approvals and a document without a version is not version-qualified',()=>{
 const q=developmentQuality({phases:[{criteria:[],proofs:[{id:'document',availability:'available',freshness:'current'}]}]});
 assert.equal(q.criteria.total,0);assert.equal(q.criteria.approved,0);assert.equal(q.proofs.unversioned,1);
});
test('PHP and Node summaries have exact parity on the same consulted view',()=>{
 const path=fileURLToPath(new URL('../backend/developments/SnapshotReader.php',import.meta.url));
 const php=process.env.PHP_BINARY||'php';
 const program=`require $argv[1]; $m=new ReflectionMethod('Avereo\\Projet\\Developments\\SnapshotReader','quality'); echo json_encode($m->invoke(null,json_decode(stream_get_contents(STDIN),true)));`;
 const r=spawnSync(php,['-r',program,path],{input:JSON.stringify(view),encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr||r.error?.message);assert.deepEqual(JSON.parse(r.stdout),developmentQuality(view));
});
test('overview keeps progressive details, explicit historical scope and no write control',async()=>{
 const ui=await readFile(new URL('../frontend/src/developments/DevelopmentPortfolio.jsx',import.meta.url),'utf8');
 assert.match(ui,/Versions, preuves et sources/);assert.match(ui,/historique inclus/);assert.match(ui,/Aucun critère structuré reconnu/);assert.match(ui,/références externes/);assert(!/Valider ce critère|method:'POST'/.test(ui));
});
