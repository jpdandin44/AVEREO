import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AVEREO_LOGO } from '../../architecture-v1/avereo-platform/shared/report-identity.js';
import { buildMissionScript } from './build-mission-script.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root, 'architecture-v1/avereo-platform/data/account-menu-applications.json')));
const selected = process.argv[2] || 'all';
const applications = selected === 'all' ? manifest.applications : manifest.applications.filter(app => app.id === selected);
if (!applications.length) throw new Error('Application inconnue : ' + selected);
const source = await readFile(resolve(root, manifest.source));
const logo = Buffer.from(AVEREO_LOGO.split(',')[1], 'base64');
const missions = await buildMissionScript();
for (const app of applications) {
  for (const directory of app.publicDirectories) {
    const target = resolve(root, directory, 'account-menu.js');
    const missionTarget = resolve(root, directory, 'assets', 'missions.js');
    const logoTarget = resolve(root, directory, 'assets', 'avereo-logo.png');
    if (process.argv.includes('--check')) {
      if (!logo.equals(await readFile(logoTarget))) throw new Error("Logo officiel différent : " + logoTarget);
      if (!source.equals(await readFile(target))) throw new Error('Copie du menu différente : ' + target);
      if (!missions.equals(await readFile(missionTarget))) throw new Error('Module Missions différent : ' + missionTarget);
    } else {
      await mkdir(resolve(root, directory, 'assets'), { recursive: true });
      await writeFile(logoTarget, logo);
      await writeFile(target, source);
      await writeFile(missionTarget, missions);
    }
  }
}
console.log(`Mon espace : ${applications.length} applications, copies ${process.argv.includes('--check') ? 'vérifiées' : 'préparées'}.`);
