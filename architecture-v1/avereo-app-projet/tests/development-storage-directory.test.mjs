import test from 'node:test';import assert from 'node:assert/strict';
import {readFile,realpath,rm,writeFile} from 'node:fs/promises';import {basename,resolve} from 'node:path';
import {createDevelopmentStorageDirectory,openDevelopmentStorageDirectory,assertDevelopmentStoragePrivacy} from '../workflows/development-storage-directory.mjs';
test('stockage persistant : ACL réelles qualifiées, clé conservée après réouverture',async t=>{
 const area=await createDevelopmentStorageDirectory();
 t.after(async()=>{assert.match(basename(area.directory),/^avereo-development-store-[a-zA-Z0-9]+$/);assert.equal(await realpath(area.directory),resolve(area.directory));await rm(area.directory,{recursive:true,force:true});});
 assert.equal((await openDevelopmentStorageDirectory(area.directory)).key,area.key);
 assert.match(await readFile(area.directory+'/publication-key','utf8'),/^[a-f0-9]{96}$/);await assertDevelopmentStoragePrivacy(area.directory);
 await writeFile(area.directory+'/storage.json','{}');await assert.rejects(openDevelopmentStorageDirectory(area.directory),/non reconnu/);
});
