import { readFile } from 'node:fs/promises';
import { AVEREO_NAME, AVEREO_COMPANY_LINES, AVEREO_LOGO } from '../../architecture-v1/avereo-platform/shared/report-identity.js';
import catalog from '../../architecture-v1/avereo-platform/data/modeles-lettres-mission.json' with { type: 'json' };

export async function buildMissionScript() {
  const shared = new URL('../../architecture-v1/avereo-platform/shared/',import.meta.url);
  const [zip, workspace] = await Promise.all([
    readFile(new URL('vendor/jszip/jszip.min.js',shared),'utf8'),
    readFile(new URL('mission-workspace.js',shared),'utf8'),
  ]);
  const config = {company:{name:AVEREO_NAME,lines:AVEREO_COMPANY_LINES,logo:AVEREO_LOGO},
    offers:catalog.offres.map(({id,nom,modelePrepareSha256})=>({id,nom,modelePrepareSha256}))};
  return Buffer.from('(function(){const module={exports:{}};const exports=module.exports;\n'+zip+'\n'+workspace+'\ninstallMissionWorkspace({JSZip:module.exports,...'+JSON.stringify(config)+'});})();\n');
}
