import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {REPORT_JSON_LIMIT,PUBLICATION_LIMIT,REPORT_LIMIT_LABEL,PUBLICATION_LIMIT_LABEL} from '../../../avereo-platform/shared/report-volumes.js';
import {publicationReportBlob,createPublication,readPublication} from './reportPublication.js';
import {MAX_REPORT_BYTES} from './observationPlans.js';

test('decimal report limit and unchanged binary package limit have exact JS/PHP sources and readable units',()=>{
  assert.equal(REPORT_JSON_LIMIT,100000000);assert.equal(MAX_REPORT_BYTES,REPORT_JSON_LIMIT);
  assert.equal(PUBLICATION_LIMIT,524288000);assert.equal(REPORT_LIMIT_LABEL,'100 Mo');assert.equal(PUBLICATION_LIMIT_LABEL,'524,288 Mo (500 Mio)');
  for(const name of ['report-volumes.json','report-volumes.php']){
    const source=readFileSync(new URL('../../../avereo-platform/shared/'+name,import.meta.url));
    for(const app of ['rapport','passeport-immo']) assert.deepEqual(readFileSync(new URL('../../../avereo-app-'+app+'/frontend/public/api/'+name,import.meta.url)),source);
  }
  const php=spawnSync('php',['-d','memory_limit=32M','-r',"require $argv[1]; echo json_encode([avereo_volume_limits()['reportJsonBytes'],avereo_volume_label(avereo_volume_limits()['publicationBytes']),avereo_volume_has_memory(64*1024*1024)]);",fileURLToPath(new URL('../public/api/report-volumes.php',import.meta.url))],{encoding:'utf8'});
  assert.equal(php.status,0,php.stderr);assert.deepEqual(JSON.parse(php.stdout),[100000000,'524,288 Mo (500 Mio)',false]);
});

test('a small stored archive with originals that would expand beyond the report limit is refused before any original download',async()=>{
  const report={onlineReportId:'a'.repeat(32),observations:[{id:'o1',photos:[{id:'p1',src:'data:image/png;base64,AQID',caption:'Légende conservée',original:{id:'b'.repeat(32),reportId:'a'.repeat(32),bytes:100000000,sha256:'0'.repeat(64),mime:'image/png'}}]}]};
  const before=structuredClone(report);let read=0;
  assert.throws(()=>publicationReportBlob(report),/réouverte.*100 Mo/);
  await assert.rejects(createPublication(report,new Blob(['word']),{validated:true,readOriginal:async()=>{read++;throw new Error('Should not read');}}),/réouverte.*100 Mo/);
  assert.equal(read,0);assert.deepEqual(report,before);
});

test('server validation view leaves the native object/list types intact for storage and reopening',()=>{
  const php=spawnSync('php',['-r',"require $argv[1]; $native=json_decode('{\"emptyObject\":{},\"emptyList\":[],\"numericObject\":{\"0\":\"conservé\"},\"nested\":[{\"empty\":{}}]}'); $view=api_json_array_view($native); if (!is_array($view) || !is_array($view['nested'][0])) exit(1); echo json_encode($native);",fileURLToPath(new URL('../public/api/bootstrap.php',import.meta.url))],{encoding:'utf8'});
  assert.equal(php.status,0,php.stderr);
  assert.deepEqual(JSON.parse(php.stdout),{emptyObject:{},emptyList:[],numericObject:{'0':'conservé'},nested:[{empty:{}}]});
});

test('normalization of an independent copy preserves all business and prepared-media fields',async()=>{
  const report={onlineReportId:'c'.repeat(32),titre:'Été et confort',signature:'data:image/png;base64,AQID',extension_future:{exact:[false,null,'9007199254740993']},plans:[{id:'plan1',src:'data:image/png;base64,BAUG',markers:[{observationId:'o1',x:0.4,y:0.2}]}],observations:[{id:'o1',observations:'Constat complet',explications:'https://example.org/éclairage',actions:'Conseil conservé',photos:[{id:'p1',src:'data:image/png;base64,BwgJ',caption:'Avant travaux',reportPhotoChoice:'prepared',reportVersion:{src:'data:image/png;base64,CgsM',annotations:[{text:'Repère conservé',shape:'rectangle'}]}}]}]};
  const initial=structuredClone(report);const {blob}=await createPublication(report,new Blob(['word']),{validated:true});const actual=await readPublication(blob);const expected=structuredClone(report);delete expected.onlineReportId;
  assert.deepEqual(actual,expected);assert.deepEqual(report,initial);
});
