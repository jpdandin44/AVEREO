import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const context={module:{exports:{}},Date};
vm.runInNewContext(readFileSync(new URL('../frontend/public/planning-core.js',import.meta.url),'utf8'),context);
const P=context.module.exports;
const plain=x=>JSON.parse(JSON.stringify(x));
const fixture=()=>({schemaVersion:1,timelineMode:'periods',name:'FICTIF périodes',startDate:null,targetDate:null,capacityPerWeek:5,schedulingMode:'dependencies',tasks:[
 {id:'I1',name:'Vérifier',duration:1.5,periodStart:1,periodDuration:2,dependencies:[]},
 {id:'I3',name:'Intervenir',duration:2,periodStart:3,periodDuration:3,dependencies:['I1']},
]});
function php(project){
 const result=spawnSync('php',['-r',`require $argv[1]; try { planning_validate(json_decode(stream_get_contents(STDIN),true,512,JSON_THROW_ON_ERROR)); echo 'accepted'; } catch (Throwable $e) { echo 'rejected'; }`,fileURLToPath(new URL('../frontend/public/api/planning-store.php',import.meta.url))],{input:JSON.stringify(project),encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);return result.stdout;
}
test('periods have no calendar anchor and preserve their positions, effort and JSON roundtrip',()=>{
 const input=fixture(),before=JSON.stringify(input),p=P.normalizeProject(input),s=P.schedule(p);
 assert.equal(p.startDate,null);assert.equal(p.targetDate,null);assert.equal(s.projectStart,null);assert.equal(s.projectEnd,null);
 assert.equal(s.totalPeriods,5);assert.equal(s.totalDuration,3.5);assert.deepEqual(plain(s.tasks.map(t=>[t.periodStart,t.periodDuration,t.calcStart,t.calcEnd,t.isLate])),[[1,2,null,null,false],[3,3,null,null,false]]);
 assert.deepEqual(plain(P.decodeProject(P.encodeProject(p))),plain(p));assert.equal(JSON.stringify(input),before);assert.equal(php(plain(p)),'accepted');
});
test('period coordinates, dates and dependency overlaps are rejected before persistence',()=>{
 for(const change of [p=>p.startDate='2026-11-19',p=>p.targetDate='2026-12-01',p=>p.tasks[0].manualStart='2026-11-20',p=>p.tasks[0].periodStart=0,p=>p.tasks[0].periodStart=1.2,p=>p.tasks[0].periodDuration=-1,p=>p.tasks[0].periodStart=120,p=>p.tasks[1].periodStart=2]){
  const p=fixture();change(p);assert.throws(()=>P.schedule(p));
  const raw=plain(P.normalizeProject(fixture()));change(raw);assert.equal(php(raw),'rejected');
 }
});
test('zero effort does not turn a period intervention into a milestone',()=>{
 const p=fixture();p.tasks[0].duration=0;const normalized=P.normalizeProject(p);assert.equal(normalized.tasks[0].isMilestone,false);assert.equal(php(plain(normalized)),'accepted');
});
test('calendar projects still require dates and acquire no period metadata',()=>{
 const p=fixture();delete p.timelineMode;assert.throws(()=>P.normalizeProject(p));
 p.startDate='2026-11-23';p.targetDate='2026-12-18';for(const t of p.tasks){delete t.periodStart;delete t.periodDuration;}
 const normalized=P.normalizeProject(p),s=P.schedule(normalized,'2026-11-19');assert.equal('timelineMode' in normalized,false);assert.equal(s.projectStart.getFullYear(),2026);assert.equal(php(plain(normalized)),'accepted');
});
