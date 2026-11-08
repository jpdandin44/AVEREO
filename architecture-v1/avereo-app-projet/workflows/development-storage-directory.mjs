import {mkdir,mkdtemp,realpath,lstat,readFile,writeFile,readdir} from 'node:fs/promises';
import {join,resolve,relative,isAbsolute,sep} from 'node:path';
import {homedir} from 'node:os';
import {randomBytes} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {restrictPrivateDirectory} from './development-private-directory.mjs';

const parent=()=>join(process.platform==='win32'?process.env.LOCALAPPDATA||join(homedir(),'AppData','Local'):join(homedir(),'.local','share'),'AVEREO','Projet','Developpements');
async function canonicalParent(create=false){
  const configured=resolve(parent()),home=resolve(homedir()),rel=relative(home,configured);
  if(!rel||rel==='..'||rel.startsWith('..'+sep)||isAbsolute(rel))throw Error('Stockage hors du profil privé.');
  // MSIX can transparently virtualize AppData. Accept its canonical directory,
  // but never a filesystem junction/symlink in the configured parent chain.
  let current=home;
  for(const part of rel.split(sep)){
    current=join(current,part);
    try{const s=await lstat(current);if(s.isSymbolicLink()||!s.isDirectory())throw Error('Racine de stockage redirigée.');}
    catch(error){if(error.code!=='ENOENT'||!create)throw error;await mkdir(current,{mode:0o700});}
  }
  const actual=await realpath(configured),actualHome=await realpath(home),inside=relative(actualHome,actual);
  if(!inside||inside==='..'||inside.startsWith('..'+sep)||isAbsolute(inside))throw Error('Stockage canonique hors du profil privé.');
  return actual;
}
export async function assertDevelopmentStoragePrivacy(root){
  const names=await readdir(root);if(names.length>110)throw Error('Stockage privé hors limites.');
  const files=[root,...names.map(name=>join(root,name))];
  for(const file of files){const info=await lstat(file);if(info.isSymbolicLink()||await realpath(file)!==file)throw Error('Lien interdit dans le stockage privé.');}
  if(process.platform==='win32'){
    const identity=execFileSync('whoami',['/user','/fo','csv','/nh'],{encoding:'utf8',windowsHide:true});
    const sid=identity.match(/S-1-(?:\d+-)+\d+/)?.[0];if(!sid)throw Error('Propriétaire Windows non qualifié.');
    const script=`$ErrorActionPreference='Stop'; $paths=ConvertFrom-Json ([Console]::In.ReadToEnd()); $rows=foreach($p in $paths){ $a=Get-Acl -LiteralPath $p; [pscustomobject]@{ owner=$a.GetOwner([System.Security.Principal.SecurityIdentifier]).Value; allowed=@($a.Access | Where-Object AccessControlType -eq Allow | ForEach-Object { $_.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value }) } }; ConvertTo-Json -InputObject @($rows) -Compress`;
    let raw;try{raw=execFileSync('pwsh.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{input:JSON.stringify(files),encoding:'utf8',windowsHide:true,stdio:['pipe','pipe','pipe']});}
    catch{throw Error('Qualification des droits Windows indisponible : PowerShell 7 avec Get-Acl requis. Accès fermé.');}
    const a=JSON.parse(raw.replace(/^\uFEFF/,''));
    if(a.some(row=>row.owner!==sid||row.allowed.some(value=>![sid,'S-1-5-18'].includes(value))))throw Error('Droits Windows trop larges : accès fermé.');
  }else{
    for(const file of files){const s=await lstat(file);if((s.mode&0o077)!==0||s.uid!==process.getuid())throw Error('Droits privés trop larges : accès fermé.');}
  }
}
export async function createDevelopmentStorageDirectory(){
  const base=await canonicalParent(true);
  const directory=await mkdtemp(join(base,'avereo-development-store-'));
  await restrictPrivateDirectory(directory,{allowedRoot:base});
  const key=randomBytes(48).toString('hex');
  await writeFile(join(directory,'publication-key'),key,{flag:'wx',mode:0o600});
  await writeFile(join(directory,'storage.json'),JSON.stringify({schema:'avereo-local-development-storage',version:1}),{flag:'wx',mode:0o600});
  await assertDevelopmentStoragePrivacy(directory);
  return {directory,key};
}
export async function openDevelopmentStorageDirectory(directory){
  const root=await realpath(resolve(directory)),base=await canonicalParent(),rel=relative(base,root);
  if(root!==resolve(directory)||!/^avereo-development-store-[a-zA-Z0-9]+$/.test(rel)||isAbsolute(rel))throw Error('Stockage privé non reconnu.');
  await assertDevelopmentStoragePrivacy(root);
  // A directory created by this tool is the trust boundary; never accept arbitrary web/user paths.
  for(const name of ['storage.json','publication-key']){
    const file=join(root,name),s=await lstat(file);if(s.isSymbolicLink()||!s.isFile()||s.size>4096||await realpath(file)!==file)throw Error('Configuration privée indisponible.');
  }
  const marker=JSON.parse(await readFile(join(root,'storage.json'),'utf8'));
  if(marker.schema!=='avereo-local-development-storage'||marker.version!==1)throw Error('Stockage privé non reconnu.');
  const key=await readFile(join(root,'publication-key'),'utf8');if(!/^[a-f0-9]{96}$/.test(key))throw Error('Clé privée invalide.');
  return {directory:root,key};
}
