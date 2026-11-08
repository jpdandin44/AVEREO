import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {transformWithEsbuild} from '../frontend/node_modules/vite/dist/node/index.js';
test('le premier chargement du portefeuille ne s’annule pas entre les effets React',async()=>{
  const source=(await readFile(new URL('../frontend/src/developments/DevelopmentWorkspace.jsx',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export default function DevelopmentWorkspace','function DevelopmentWorkspace');
  const built=await transformWithEsbuild(source,'DevelopmentWorkspace.jsx',{loader:'jsx',jsxFactory:'h',jsxFragment:'Fragment'});
  const incoming={iterations:[],portfolio:[],csrf:'fixture',identity:{mode:'local_fictitious'}},effects=[],states=[];
  const context={useState:initial=>[initial,value=>states.push(value)],useRef:value=>({current:value}),useEffect:callback=>effects.push(callback),h:()=>null,Fragment:()=>null,DevelopmentPortfolio:()=>null,fetch:async()=>({ok:true,json:async()=>incoming}),setInterval:()=>1,clearInterval:()=>{},window:{addEventListener(){},removeEventListener(){}},document:{visibilityState:'visible',addEventListener(){},removeEventListener(){}},URL,location:{},console};
  vm.runInNewContext(built.code+'\nDevelopmentWorkspace();',context);
  for(const effect of effects)effect();
  await new Promise(resolve=>setImmediate(resolve));
  assert.ok(states.includes(incoming),'La réponse initiale doit être affichée sans attendre le prochain timer de 25 secondes.');
  assert.equal(vm.runInNewContext('proofVersion({artifactSha256:"a".repeat(64)});',context),'Artefact : '+'a'.repeat(64));
  assert.equal(vm.runInNewContext('proofVersion({sourceSha:"b".repeat(40)});',context),'Commit : '+'b'.repeat(40));
});

test('un refus sur une pièce efface immédiatement les données privées déjà affichées',async()=>{
  const source=(await readFile(new URL('../frontend/src/developments/DevelopmentWorkspace.jsx',import.meta.url),'utf8')).replace(/^import .*;\r?\n/gm,'').replace('export default function DevelopmentWorkspace','function DevelopmentWorkspace');
  const built=await transformWithEsbuild(source,'DevelopmentWorkspace.jsx',{loader:'jsx',jsxFactory:'h',jsxFragment:'Fragment'});
  const proof={id:'fixture',availability:'available',title:'Pièce fictive'},nodes=[],writes=[];
  const detail={title:'Fixture',readAt:new Date().toISOString(),candidate:{},versions:{github:{}},blockers:[],unassignedCriteria:[],history:[],declaredApprovals:[],sourceModifiedAt:new Date().toISOString(),sourceHash:'a'.repeat(64),revision:'b'.repeat(64),phases:[0,1,2,3].map(id=>({id,label:'Phase '+id,status:'in_progress',criteria:[],proofs:id===1?[proof]:[]}))};
  const values=[{iterations:[],portfolio:[],identity:{mode:'local_fictitious'}},'fixture',detail,1,false,'','','',false,'','',false,null];let index=0;
  const context={useState:initial=>{const i=index++;return[values[i]??initial,value=>writes.push({index:i,value})]},useRef:value=>({current:value}),useEffect:()=>{},h:(type,props,...children)=>{nodes.push({type,props,children});return null},Fragment:()=>null,DevelopmentPortfolio:()=>null,fetch:async()=>({ok:false,status:403,json:async()=>({error:'Accès refusé.'})}),URL,location:{},console};
  vm.runInNewContext(built.code+'\nDevelopmentWorkspace();',context);
  const button=nodes.find(n=>n.type==='button'&&n.children.includes('Ouvrir'));assert(button);
  await button.props.onClick();
  for(const i of [0,2,12])assert(writes.some(w=>w.index===i&&w.value===null),'État privé effacé : '+i);
});
