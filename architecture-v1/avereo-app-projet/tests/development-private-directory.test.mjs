import test from 'node:test';
import assert from 'node:assert/strict';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {restrictPrivateDirectory} from '../workflows/development-private-directory.mjs';
test('le dossier privé Windows retire l’héritage et ne donne accès qu’au propriétaire et SYSTEM',async()=>{
  const calls=[];await restrictPrivateDirectory(join(tmpdir(),'avereo-fixture-private-test'),{platform:'win32',run:(command,args)=>{calls.push({command,args});return command==='whoami'?'"fixture","S-1-5-21-100-200-300-1001"':'';}});
  assert.equal(calls.length,2);assert.equal(calls[1].command,'icacls');assert.ok(calls[1].args.includes('/inheritance:r'));assert.ok(calls[1].args.includes('*S-1-5-21-100-200-300-1001:(OI)(CI)F'));assert.ok(calls[1].args.includes('*S-1-5-18:(OI)(CI)F'));assert.ok(!calls[1].args.some(x=>x.includes('S-1-1-0')));
});
test('aucune modification d’ACL hors du dossier temporaire ou sans identité Windows qualifiée',async()=>{
  let calls=0;await assert.rejects(restrictPrivateDirectory(resolveOutside(),{platform:'win32',run:()=>calls++}));assert.equal(calls,0);await assert.rejects(restrictPrivateDirectory(join(tmpdir(),'avereo-fixture-private-test'),{platform:'win32',run:()=>''}));
});
function resolveOutside(){return join(tmpdir(),'..','hors-perimetre');}
