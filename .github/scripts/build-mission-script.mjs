import { readFile } from 'node:fs/promises';
import { AVEREO_NAME, AVEREO_COMPANY_LINES, AVEREO_LOGO } from '../../architecture-v1/avereo-platform/shared/report-identity.js';
import catalog from '../../architecture-v1/avereo-platform/data/modeles-lettres-mission.json' with { type: 'json' };

export async function buildMissionScript() {
  const shared = new URL('../../architecture-v1/avereo-platform/shared/',import.meta.url);
  const [zip, workspace] = await Promise.all([
    readFile(new URL('vendor/jszip/jszip.min.js',shared),'utf8'),
    readFile(new URL('mission-workspace.js',shared),'utf8'),
  ]);
  const offers = catalog.offres.map(({id, nom, modelePrepareSha256, ordre}) => {
    const options = ordre.options.map(key => {
      const option = catalog.optionsOrdre[key];
      if (!option) throw Error(`Option d’ordre inconnue pour ${id} : ${key}`);
      return {id: key, ...option};
    });
    return {id, nom, modelePrepareSha256, ordre: {...ordre, options}};
  });
  const config = {company:{name:AVEREO_NAME,lines:AVEREO_COMPANY_LINES,logo:AVEREO_LOGO}, offers};
  return Buffer.from('(function(){const module={exports:{}};const exports=module.exports;\n'+zip+'\n'+workspace+'\ninstallMissionWorkspace({JSZip:module.exports,...'+JSON.stringify(config)+'});})();\n');
}
