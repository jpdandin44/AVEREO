import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {transformWithEsbuild} from '../frontend/node_modules/vite/dist/node/index.js';
import {qualifyLocalReference,extendReferenceSnapshot} from '../workflows/development-local-reference.mjs';
const ids=['connect','rapport','rga','projet','coupe','thermo','drone','passeport-immo','recherche','saisie-unique'];
const root='C:/Users/fixture/Documents local/AVEREO-reference',sha='a'.repeat(40),date='2026-11-10T12:00:00Z';
const catalogue=()=>({schema:'avereo-local-reference-catalog',observedAt:date,reference:{sha,privateData:'must not be published'},referenceArchive:{path:root+'/sauvegardes/source.zip'},applications:ids.map(id=>({id,referenceSha:sha,referenceDirectory:root+'/versions/'+sha.slice(0,12)+'/architecture-v1/'+(id==='rga'?'avereo-app-rapport/frontend/public/rga':'avereo-app-'+id),extra:'not published'}))});
const phase=()=>[0,1,2,3].map(id=>({id,label:['Cadrage','Développement local','Préproduction','Mise en production'][id],criteria:[{id:'kept-'+id,decision:'not_reviewed',canApprove:false}],proofs:[]}));
const previous=()=>({schema:'avereo-private-development-snapshot',version:1,sequence:9,generatedAt:date,iterations:[{id:'existing',writable:false,history:[{decision:'approved',recordedAt:date}],phases:phase()}],portfolio:[...ids,'site-avereo','tc-longages'].map(id=>({id,iterations:[{id:'existing'}],preproduction:{sourceSha:'b'.repeat(40),verification:{status:'documented'}},production:null})),proofs:[],deliveryReceiptQualification:{preserved:true},githubSnapshot:{observedAt:date}});
const iteration=()=>({id:'reference-applications',title:'Référence locale',writable:false,currentPhase:2,status:'awaiting_review',versions:{updatedAt:date},phases:phase()});
test('publication explicite des dix dossiers et quatre racines sans données annexes',()=>{
 const refs=qualifyLocalReference(catalogue());assert.equal(refs.size,10);assert.equal(refs.get('rga').roots.length,4);assert.match(refs.get('rga').directory,/avereo-app-rapport\\frontend\\public\\rga$/);assert(!JSON.stringify([...refs]).includes('must not be published'));assert(!JSON.stringify([...refs]).includes('not published'));
});
test('refus des chemins hors référence, traversées, applications dupliquées et versions divergentes',()=>{
 for(const change of [c=>c.applications[0].referenceDirectory='C:/Users/fixture/.ssh',c=>c.applications[0].referenceDirectory+='/../secret',c=>c.applications[0].referenceSha='b'.repeat(40),c=>c.applications[1].id=c.applications[0].id,c=>c.referenceArchive.path='https://example.test/file.zip',c=>c.observedAt='bad']){const c=catalogue();change(c);assert.throws(()=>qualifyLocalReference(c));}
});
test('les phases décisions badges reçus et applications antérieurs sont préservés',()=>{
 const old=previous(),before=structuredClone(old),added=iteration();const next=extendReferenceSnapshot(old,added,catalogue(),{sequence:10});
 assert.deepEqual(old,before);assert.deepEqual(next.iterations.slice(0,-1),before.iterations);assert.deepEqual(next.deliveryReceiptQualification,before.deliveryReceiptQualification);assert.deepEqual(next.githubSnapshot,before.githubSnapshot);
 assert.equal(next.portfolio.filter(a=>a.localReference).length,10);
 next.portfolio.forEach((app,i)=>{assert.deepEqual(app.preproduction,before.portfolio[i].preproduction);assert.deepEqual(app.production,before.portfolio[i].production);assert.deepEqual(app.iterations.slice(0,1),before.portfolio[i].iterations);});
 assert(!next.portfolio.find(a=>a.id==='site-avereo').localReference);assert.deepEqual(next.proofs,[]);
});
test('refus d’une séquence concurrente ou d’un second ajout du même suivi',()=>{
 assert.throws(()=>extendReferenceSnapshot(previous(),iteration(),catalogue(),{sequence:11}));const old=previous();old.iterations.push(iteration());assert.throws(()=>extendReferenceSnapshot(old,iteration(),catalogue(),{sequence:10}));const writable=iteration();writable.writable=true;assert.throws(()=>extendReferenceSnapshot(previous(),writable,catalogue(),{sequence:10}));
});
async function componentContext(clipboard){
 const source=(await readFile(new URL('../frontend/src/developments/DevelopmentPortfolio.jsx',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export function LocalFolder','function LocalFolder').replace('export default function DevelopmentPortfolio','function DevelopmentPortfolio');
 const built=await transformWithEsbuild(source,'DevelopmentPortfolio.jsx',{loader:'jsx',jsxFactory:'h',jsxFragment:'Fragment'}),nodes=[],writes=[];
 const ctx={useState:initial=>[initial,v=>writes.push(v)],h:(type,props,...children)=>{const node={type,props,children};nodes.push(node);return node;},Fragment:'fragment',navigator:{clipboard},environmentBadge:()=>({}),console};
 vm.createContext(ctx);vm.runInContext(built.code,ctx);return{ctx,nodes,writes};
}
test('le bouton copie le chemin seul sans navigation ni exécution',async()=>{
 let copied;const f=await componentContext({writeText:async value=>{copied=value;}});vm.runInContext(`LocalFolder({directory:'C:\\\\reference',label:'Sources'});`,f.ctx);const button=f.nodes.find(n=>n.type==='button');await button.props.onClick({currentTarget:{parentElement:{querySelector:()=>null}}});assert.equal(copied,'C:\\reference');assert(f.writes.includes('Chemin copié'));assert(f.nodes.find(n=>n.type==='input').props.readOnly);assert(!f.nodes.some(n=>n.type==='a'));
});
test('sans presse papiers le chemin reste sélectionnable et le résultat est expliqué',async()=>{
 const f=await componentContext(undefined);vm.runInContext(`LocalFolder({directory:'C:\\\\reference',label:'Sources'});`,f.ctx);let focused=false,selected=false;await f.nodes.find(n=>n.type==='button').props.onClick({currentTarget:{parentElement:{querySelector:()=>({focus(){focused=true;},select(){selected=true;}})}}});assert(focused&&selected);assert(f.writes.some(v=>v.includes('Chemin sélectionné')));
});
test('une ancienne publication sans catalogue conserve la vue sans rubrique vide',async()=>{
 const f=await componentContext(undefined);vm.runInContext('DevelopmentPortfolio({applications:[],onOpen:()=>{}});',f.ctx);assert(!f.nodes.some(n=>n.props?.['aria-label']==='Référence locale des applications'));
});
test('un refus asynchrone conserve la sélection après libération de currentTarget par React',async()=>{
 let selected=false;const event={currentTarget:{parentElement:{querySelector:()=>({focus(){},select(){selected=true;}})}}};
 const f=await componentContext({writeText:async()=>{await Promise.resolve();event.currentTarget=null;throw Error('refused');}});vm.runInContext(`LocalFolder({directory:'C:\\\\reference',label:'Sources'});`,f.ctx);await f.nodes.find(n=>n.type==='button').props.onClick(event);assert(selected);assert(f.writes.some(v=>v.includes('Chemin sélectionné')));
});
