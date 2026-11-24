import catalogue from '../../../data/cockpit-projects.json' with {type:'json'};

const dated=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const version=value=>typeof value==='string'&&/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value);
const within=(path,root)=>path===root||root===''||path.startsWith(root+'/');
const sameRepository=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.toLowerCase()===b.toLowerCase();
const remote=app=>app.github?.repository?app.github:null;
function belongs(app,definition){
  if(definition.applicationIds.includes(app.id))return true;
  const source=remote(app);
  return source&&sameRepository(source.repository,definition.repository)&&typeof source.path==='string'
    &&definition.paths.some(path=>within(source.path,path));
}
function documentedReceipt(declaration){
  return declaration?.environment==='preproduction'&&(version(declaration.sourceSha)||version(declaration.artifactSha256))
    &&(!declaration.sourceSha||version(declaration.sourceSha))
    &&(!declaration.artifactSha256||/^[a-f0-9]{64}$/i.test(declaration.artifactSha256))
    &&typeof declaration.target==='string'&&declaration.target.trim()&&dated(declaration.observedAt)
    &&typeof declaration.evidence==='string'&&declaration.evidence.trim()
    &&declaration.verification?.status==='documented'
    &&typeof declaration.verification.evidence==='string'&&declaration.verification.evidence.trim()
    &&dated(declaration.verification.observedAt);
}
function receiptApplies(declaration,iteration,applicationId){
  if(Array.isArray(declaration.applicationIds))return declaration.applicationIds.includes(applicationId);
  // A shared lot without an explicit application scope cannot admit another product.
  return iteration?.applicationIds?.length===1&&iteration.applicationIds[0]===applicationId;
}
export function firstPreproductionReceipt(app,iterations=[]){
  const ids=new Set((app.iterations||[]).map(item=>item.id));
  const linked=iterations.filter(item=>ids.has(item.id)||item.applicationIds?.includes(app.id));
  const declarations=linked.flatMap(iteration=>(iteration.versions?.declarations||[])
    .filter(declaration=>documentedReceipt(declaration)&&receiptApplies(declaration,iteration,app.id)));
  const latest=app.preproduction;
  if(documentedReceipt(latest)&&receiptApplies(latest,linked.find(item=>item.id===latest.iterationId),app.id))declarations.push(latest);
  return declarations.sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt))[0]||null;
}
function productCandidate(app,inventory){
  const source=remote(app),kind=app.category||'';
  if(/copie|qualification|intégration|automatisation|composant|socle|agent|outil/i.test(kind))return false;
  if(/application|prototype|site(?: internet| web| et espace club)?$/i.test(kind))return true;
  if(kind!=='Dépôt'||source?.path!=='')return false;
  if(sameRepository(source.repository,'jpdandin44/AVEREO'))return false;
  const project=inventory?.projects?.find(item=>item.id===app.id);
  return project?.markers?.some(marker=>/manifeste|point d’entrée|README et code/.test(marker))||false;
}
function aggregate(definition,members,iterations,admission){
  const primary=members.find(app=>app.id===definition.id)
    ||members.find(app=>sameRepository(app.github?.repository,definition.repository)&&definition.paths.includes(app.github?.path))||members[0];
  const byId=new Map();
  for(const app of members)for(const item of app.iterations||[]){
    if(!byId.has(item.id)||byId.get(item.id).unavailable&&!item.unavailable)byId.set(item.id,item);
  }
  const summaries=[...byId.values()].sort((a,b)=>(Date.parse(b.updatedAt)||0)-(Date.parse(a.updatedAt)||0));
  const latest=environment=>members.map(app=>app[environment]).filter(Boolean)
    .sort((a,b)=>(Date.parse(b.observedAt)||0)-(Date.parse(a.observedAt)||0))[0]||null;
  const sourceApplicationIds=[...new Set([...definition.applicationIds,...members.map(app=>app.id)])];
  const ids=new Set(summaries.map(item=>item.id));
  return {...primary,id:definition.id,name:definition.name,category:definition.category,
    local:primary?.local||{status:'not_configured'},github:primary?.github||{status:'not_configured'},
    sourceApplicationIds,iterations:summaries,preproduction:latest('preproduction'),production:latest('production'),
    missingTracking:!summaries.some(item=>!item.unavailable),
    blockerCount:iterations.filter(item=>ids.has(item.id)&&!item.unavailable).reduce((sum,item)=>sum+(item.blockerCount||0),0),
    projectAdmission:admission,environmentReferences:definition.environmentReferences||null,
    projectSources:members.map(app=>({id:app.id,name:app.name,path:app.github?.path||null,url:app.github?.url||null})),
    unqualifiedDeliveries:[...new Set(members.flatMap(app=>app.unqualifiedDeliveries||[]))]};
}
export function projectIncludesIteration(project,iteration){
  return project?.iterations?.some(item=>item.id===iteration.id)
    ||iteration.applicationIds?.some(id=>(project?.sourceApplicationIds||[project?.id]).includes(id))||false;
}
export function projectPortfolio(applications=[],iterations=[],inventory=null){
  const definitions=[...catalogue.projects,...catalogue.history],assigned=new Set();
  const groups=definitions.map(definition=>{
    const members=applications.filter(app=>belongs(app,definition));
    for(const app of members)assigned.add(app.id);
    return aggregate(definition,members,iterations,{reason:'initial_selection'});
  });
  const additional=[];
  const candidates=applications.slice().sort((a,b)=>(remote(a)?.path?.length||0)-(remote(b)?.path?.length||0));
  for(const app of candidates){
    if(assigned.has(app.id)||!productCandidate(app,inventory))continue;
    const receipt=firstPreproductionReceipt(app,iterations);
    if(!receipt)continue;
    const source=remote(app),definition={id:app.id,name:app.name,category:app.category,applicationIds:[app.id],repository:source?.repository,paths:typeof source?.path==='string'?[source.path]:[]};
    const members=applications.filter(member=>!assigned.has(member.id)&&belongs(member,definition));
    for(const member of members)assigned.add(member.id);
    additional.push(aggregate(definition,members,iterations,{reason:'documented_preproduction',receipt}));
  }
  return {main:[...groups.slice(0,catalogue.projects.length),...additional],history:groups.slice(catalogue.projects.length)};
}
