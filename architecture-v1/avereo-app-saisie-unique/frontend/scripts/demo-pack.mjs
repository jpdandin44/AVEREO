import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { dossierDemonstration } from '../src/lib/demonstration.js';
import { genererFormulaire } from '../src/lib/formulaires.js';
const root=resolve(import.meta.dirname,'../..');
const pack=JSON.parse(await readFile(resolve(root,'.local/modeles-demo.json'),'utf8'));
const out=resolve(root,'.local/livraison/documents'); await mkdir(out,{recursive:true});
const dossier=dossierDemonstration('demo-lundi');
const parametres={org_raison_sociale:'Cabinet Demonstration (fictif)',org_siret:'00000000000000',org_lieu:'Longages'};
await writeFile(resolve(out,'dossier-demo.json'),JSON.stringify({format:'avereo-uni-sauvegarde',version:1,exporteLe:new Date().toISOString(),dossiers:[dossier]},null,2));
dossier.plans.factures=structuredClone(dossier.plans.devis); dossier.fige=true;
const bilan=[];
for(const id of Object.keys(pack.documents)){
 const planId=['ATF','RFA','ACO','EXC'].includes(id)?'factures':'devis';
 const r=await genererFormulaire({pack,docId:id,dossier,parametres,planId});
 await writeFile(resolve(out,r.filename),r.bytes); bilan.push({document:id,plan:planId,bytes:r.bytes.length});
}
await writeFile(resolve(out,'generation.json'),JSON.stringify(bilan,null,2)); console.log(JSON.stringify(bilan));
