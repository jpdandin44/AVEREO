import {writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';

export async function createDevelopmentFixture(root){
  await mkdir(root,{recursive:true,mode:0o700});
  await writeFile(join(root,'preuve.md'),'# Preuve fictive\n\nContrôle pédagogique réussi. Aucun dossier réel.\n');
  const candidate={sourceSha:'a'.repeat(40),artifactSha256:'b'.repeat(64)};
  const direct={protocol:'developpement-github-cockpit',developmentReviewSchema:1,iterationId:'demo-formulaire',project:'Application fictive',objective:'Fiabiliser un formulaire — démonstration',stage:'developpement-local',status:'in_progress',candidate,nextAction:'Examiner les critères et les pièces fictives.',criteria:[
    {id:'DEMO-01',phaseId:1,title:'Le parcours nominal fonctionne',expected:'Parcours relu dans cette version.',proofIds:['demo-parcours']},
    {id:'DEMO-02',phaseId:1,title:'Les droits sont respectés',proofIds:['demo-droits']},
    {id:'DEMO-03',phaseId:2,title:'La recette hébergée est disponible',proofIds:['demo-preprod']},
  ],checks:[
    {id:'demo-parcours',kind:'local',status:'passed',evidence:'preuve.md',sourceSha:candidate.sourceSha,artifactSha256:candidate.artifactSha256,target:'fixture locale',observedAt:'2026-11-06T10:00:00Z'},
    {id:'demo-droits',kind:'local',status:'failed',evidence:'preuve.md',sourceSha:candidate.sourceSha,artifactSha256:candidate.artifactSha256,target:'fixture locale',observedAt:'2026-11-06T10:00:00Z'},
    {id:'demo-preprod',kind:'preproduction',status:'not_run',evidence:'recette-absente.md',sourceSha:candidate.sourceSha,target:'Non installée'},
  ],approvals:[],developmentReviews:[]};
  const legacy={title:'Second schéma — démonstration',currentPhase:1,statusLabels:{},phases:[
    {id:0,title:'Cadrage',status:'validated',exitCriteria:['Besoin expliqué'],deliverables:[{path:'preuve.md'}]},
    {id:1,title:'Développement local',status:'in_progress',exitCriteria:['Conserver les données'],deliverables:[]},
    {id:2,title:'Préproduction',status:'not_started',exitCriteria:[],deliverables:[]},
    {id:3,title:'Mise en production',status:'not_started',exitCriteria:[],deliverables:[]},
  ],decisions:[],history:[]};
  await writeFile(join(root,'direct.json'),JSON.stringify(direct,null,2)+'\n');await writeFile(join(root,'legacy.json'),JSON.stringify(legacy,null,2)+'\n');
  return [{id:'demo-formulaire',application:'Application fictive',root,file:'direct.json',writable:true},{id:'demo-historique',application:'Second schéma fictif',root,file:'legacy.json',writable:false}];
}
