import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {transformWithEsbuild} from '../frontend/node_modules/vite/dist/node/index.js';
import {PHASE_LABELS,projectDevelopmentProgress,timelineBounds,observationFreshness} from '../frontend/src/developments/development-progress.mjs';
const item=(id,app)=>({id,title:'Lot '+id,application:app,applicationIds:[app],currentPhase:1,candidate:{},phases:PHASE_LABELS.map((label,id)=>({id,label,status:'not_started',criteria:[],proofs:[]})),unassignedCriteria:[]});
async function fixture(){
 const source=(await readFile(new URL('../frontend/src/developments/DevelopmentGantt.jsx',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export default function DevelopmentGantt','function DevelopmentGantt');
 const built=await transformWithEsbuild(source,'DevelopmentGantt.jsx',{loader:'jsx',jsxFactory:'h',jsxFragment:'Fragment'}),nodes=[],states=[],opened=[];let index=0;
 const state={iterations:[],portfolio:[{id:'rapport',name:'Rapport',iterations:[]},{id:'projet',name:'Projet',iterations:[]}],githubSnapshot:{observedAt:'2026-11-01'}};
 const context={state,projectDevelopmentProgress,timelineBounds,observationFreshness,useState:initial=>{const i=index++;if(!(i in states))states[i]=initial;return[states[i],v=>{states[i]=v;}];},useRef:initial=>({current:initial}),useEffect:()=>{},h:(type,props,...children)=>{const n={type,props,children};nodes.push(n);return n;},Fragment:'fragment',onOpen:(app,id)=>opened.push([app.id,id])};
 vm.createContext(context);vm.runInContext(built.code,context);const render=()=>{index=0;nodes.length=0;vm.runInContext('DevelopmentGantt({state,onOpen,request:()=>{},onAccessFailure:()=>{}});',context);};
 states[0]=[item('photos','rapport'),item('gantt','projet')];states[1]=false;render();return{nodes,states,opened,render};
}
test('Gantt : quatre phases par suivi, inconnues visibles et aucune action de validation',async()=>{
 const f=await fixture(),text=JSON.stringify(f.nodes);assert.equal(f.nodes.filter(n=>n.props?.className==='gantt-row').length,8);assert.match(text,/Travail restant non quantifié/);assert.match(text,/observation ancienne/);assert.match(text,/reste à raccorder côté opérateur|nécessite le collecteur configuré/);assert(!f.nodes.some(n=>n.type==='button'&&JSON.stringify(n.children).includes('Valider')));
});
test('filtre application, recherche et lien vers la bonne itération privée',async()=>{
 const f=await fixture();f.nodes.find(n=>n.type==='select').props.onChange({target:{value:'rapport'}});f.render();assert.equal(f.nodes.filter(n=>n.props?.className==='gantt-iteration').length,1);
 f.nodes.find(n=>n.type==='button'&&n.children.includes('Voir les preuves et critères')).props.onClick();assert.deepEqual(f.opened,[['rapport','photos']]);
 f.nodes.find(n=>n.type==='input').props.onChange({target:{value:'absent'}});f.render();assert.equal(f.nodes.filter(n=>n.props?.className==='gantt-iteration').length,0);assert.match(JSON.stringify(f.nodes),/Aucun suivi dans ce filtre/);
});
test('une source indisponible ne dessine pas quatre fausses phases terminées',async()=>{
 const f=await fixture();f.states[0]=[{id:'missing',application:'Rapport',applicationIds:['rapport'],title:'Absent',unavailable:true}];f.render();assert.equal(f.nodes.filter(n=>n.props?.className==='gantt-row').length,0);assert.match(JSON.stringify(f.nodes),/Source indisponible/);
});
