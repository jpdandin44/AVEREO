import {mkdtemp,chmod} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,relative,resolve,isAbsolute} from 'node:path';
import {execFileSync} from 'node:child_process';
export async function restrictPrivateDirectory(directory,{platform=process.platform,run=execFileSync,allowedRoot=tmpdir()}={}){
  const rel=relative(resolve(allowedRoot),resolve(directory));
  if(!rel||rel.startsWith('..')||isAbsolute(rel)||!rel.startsWith('avereo-'))throw Error('Répertoire privé hors de la racine temporaire autorisée.');
  if(platform==='win32'){
    const identity=run('whoami',['/user','/fo','csv','/nh'],{encoding:'utf8',windowsHide:true});
    const sid=identity.match(/S-1-(?:\d+-)+\d+/)?.[0];if(!sid)throw Error('Identité Windows non qualifiée : accès fermé.');
    run('icacls',[directory,'/inheritance:r','/grant:r',`*${sid}:(OI)(CI)F`,'*S-1-5-18:(OI)(CI)F','/q'],{encoding:'utf8',windowsHide:true,stdio:'pipe'});
  }else await chmod(directory,0o700);
}
export async function createPrivateDirectory(prefix){
  if(!/^avereo-[a-z-]+-$/.test(prefix))throw Error('Préfixe privé invalide.');
  const directory=await mkdtemp(join(tmpdir(),prefix));await restrictPrivateDirectory(directory);return directory;
}
