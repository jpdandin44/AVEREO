import {readFile,mkdtemp,writeFile,chmod} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createPrivateDirectory} from './development-private-directory.mjs';
const args=process.argv.slice(2),option=name=>{const at=args.indexOf(name);return at<0?null:args[at+1];};
if(!args.includes('--local-private-owner')||!option('--registry'))throw Error('Choix explicite requis : --local-private-owner --registry CHEMIN_PRIVÉ [--port 5197]. Aucun SSO CONNECT implicite.');
const registry=JSON.parse(await readFile(resolve(option('--registry')),'utf8'));
if(registry.schema!=='development-portfolio-registry'||registry.policy!=='local_private_read_only_no_connect_role_claim'||!Array.isArray(registry.entries)||registry.entries.some(e=>e.writable!==false))throw Error('Registre de consultation privée invalide.');
const directory=await createPrivateDirectory('avereo-portfolio-private-');
// ID interne de la capacité privée, PAS un ID de compte CONNECT.
const config=join(directory,'registre-prive.json');
await writeFile(config,JSON.stringify({localAdministratorConfirmed:true,globalAdminConnectId:'1',applications:registry.applications,entries:registry.entries,patrimonyObservationFile:registry.patrimonyObservationFile?resolve(registry.patrimonyObservationFile):null,evidenceQualificationFile:registry.evidenceQualificationFile?resolve(registry.evidenceQualificationFile):null,githubRefresh:registry.githubRefresh||null,githubObservationFile:registry.githubObservationFile?resolve(registry.githubObservationFile):null}),{mode:0o600});
console.log('Cockpit privé du propriétaire du poste — lecture seule. Aucun rôle ni compte CONNECT réel attesté.');
const child=spawn(process.execPath,[fileURLToPath(new URL('./start-developments.mjs',import.meta.url)),'--config',config,'--port',option('--port')||'5197'],{stdio:'inherit',windowsHide:true});
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>child.kill(signal));
child.once('exit',code=>process.exit(code??1));
