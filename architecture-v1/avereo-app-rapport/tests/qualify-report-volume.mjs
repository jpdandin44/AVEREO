// Explicit large-data recipe, outside the default parallel unit suite.
// Uses fictitious data only. No network, compression, resizing or image re-encoding.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {REPORT_JSON_LIMIT} from '../../avereo-platform/shared/report-volumes.js';
import {createPublication,readPublication,publicationReportBlob} from '../frontend/src/reportPublication.js';
import {reportExportBlob} from '../frontend/src/reportFiles.js';
import {saveOnlineReport} from '../frontend/src/services/reportApi.js';
const require=createRequire(new URL('../frontend/package.json',import.meta.url));
const JSZip=require('jszip');
const [fixturePath,outputPath]=process.argv.slice(2);if(!fixturePath || !outputPath)throw new Error('Usage: node --expose-gc --max-old-space-size=2048 tests/qualify-report-volume.mjs FIXTURE OUTPUT');
const output=resolve(outputPath);await mkdir(output,{recursive:true});
const sha=value=>createHash('sha256').update(value).digest('hex');
const wordZip=new JSZip();wordZip.file('[Content_Types].xml','<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
wordZip.file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Restitution client fictive de contrôle du transport</w:t></w:r></w:p></w:body></w:document>');
const word=new Blob([await wordZip.generateAsync({type:'uint8array',compression:'STORE'})]);
const results={scope:'Fictitious codec/limits/resources. The fixture Word controls transport; native expert/client generation and hosted sessions are separate criteria.',thresholds:[],semantic:[],memory:[],noHostedChanges:true};
function memory(label,start){results.memory.push({label,elapsedMs:Math.round(performance.now()-start),rss:process.memoryUsage().rss,maxRssKiB:process.resourceUsage().maxRSS});}
function sizedReport(size){const r={titre:'FICTIF seuil sans perte',observations:[],padding_fictif:''};r.padding_fictif='X'.repeat(size-new Blob([JSON.stringify(r)]).size);assert.equal(new Blob([JSON.stringify(r)]).size,size);return r;}
for(const size of [50*1024*1024,50*1024*1024+1,REPORT_JSON_LIMIT,REPORT_JSON_LIMIT+1]){
  const start=performance.now();let source=sizedReport(size);const before=sha(JSON.stringify(source));
  if(size>REPORT_JSON_LIMIT){assert.throws(()=>publicationReportBlob(source),/100 Mo/);let requests=0;const oldFetch=globalThis.fetch;globalThis.fetch=async()=>{requests++;throw new Error('No request expected');};try{await assert.rejects(saveOnlineReport(source,''),/100 Mo/);}finally{globalThis.fetch=oldFetch;}assert.equal(requests,0);results.thresholds.push({bytes:size,refused:true,noNetworkWrite:true});}
  else{assert.equal(publicationReportBlob(source).size,size);const blob=reportExportBlob(source);assert.ok(blob.size<=REPORT_JSON_LIMIT);assert.deepEqual(JSON.parse(await blob.text()),source);results.thresholds.push({bytes:size,accepted:true,exportReopenable:true});}
  assert.equal(sha(JSON.stringify(source)),before);memory('boundary-'+size,start);source=null;globalThis.gc?.();
}
function media(value,path='',out=[]){
  if(typeof value==='string' && /^data:image\/[\w.+-]+;base64,/.test(value)){const [head,b64]=value.split(',');const bytes=Buffer.from(b64,'base64');out.push({path,mime:head.slice(5,-7),bytes:bytes.length,sha256:sha(bytes)});}
  else if(value && typeof value==='object')for(const [k,v]of Object.entries(value))media(v,path+'/'+k,out);
  return out;
}
const report=JSON.parse(await readFile(fixturePath,'utf8'));assert.match(report.reference_dossier,/^RECETTE-VOLUME-/);assert.ok(new Blob([JSON.stringify(report)]).size>50*1024*1024);
// The source image and its prepared crop/annotations already coexist. Preserve both byte for byte.
const oi=report.observations.findIndex(o=>(o.photos||[]).some(p=>p.reportVersion?.src));assert.ok(oi>=0);
const pi=report.observations[oi].photos.findIndex(p=>p.reportVersion?.src);const photo=report.observations[oi].photos[pi];
const mime=photo.src.match(/^data:(image\/[^;]+);base64,/)[1];const original=Buffer.from(photo.src.split(',')[1],'base64');
report.onlineReportId='a'.repeat(32);photo.original={id:'b'.repeat(32),reportId:report.onlineReportId,mime,bytes:original.length,sha256:sha(original)};
const before=sha(JSON.stringify(report));const expected=structuredClone(report);delete expected.onlineReportId;delete expected.observations[oi].photos[pi].original;
const expectedMedia=media(expected);let reads=0;const start=performance.now();
const {blob,manifest}=await createPublication(report,word,{validated:true,id:'c'.repeat(32),readOriginal:async()=>{reads++;return new Blob([original],{type:mime});}});
await writeFile(resolve(output,'volume-complet.avereo.zip'),new Uint8Array(await blob.arrayBuffer()));
const reopened=await readPublication(blob);assert.deepEqual(reopened,expected);assert.deepEqual(media(reopened),expectedMedia);assert.equal(sha(JSON.stringify(report)),before);assert.equal(reads,1);
await writeFile(resolve(output,'rapport-reouvert.json'),JSON.stringify(reopened));
await writeFile(resolve(output,'manifest.json'),JSON.stringify(manifest,null,2));
results.semantic.push({jsonBytes:new Blob([JSON.stringify(report)]).size,packageBytes:blob.size,observations:report.observations.length,photos:report.observations.reduce((n,o)=>n+(o.photos||[]).length,0)+Number(Boolean(report.contexte_exterieur?.photo)),plans:report.plans.length,signature:Boolean(report.signature),mediaEntries:expectedMedia.length,mediaSha256Exact:true,businessContentExact:true,sourceUnchanged:true,originalDownloadedAndVerified:true,preparedVersionsAndAnnotationsExact:true,expectedTechnicalDifferences:['onlineReportId removed for independent copy','photo.original source account reference removed; exact original bytes embedded in photo.src'],archiveSchema:manifest.version,archiveCompression:'STORE'});
memory('complete-large-roundtrip',start);
results.media=expectedMedia;
await writeFile(resolve(output,'qualification.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify({thresholds:results.thresholds,semantic:results.semantic,memory:results.memory}));
