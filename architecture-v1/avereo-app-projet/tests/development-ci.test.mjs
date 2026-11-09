import test from 'node:test';
import assert from 'node:assert/strict';
import {assertDevelopmentSource,assertDevelopmentPackagePath} from '../workflows/verify-development-ci.mjs';
const sha='a'.repeat(40),good={sourceSha:sha,baseSha:sha,localUncommitted:false,readyToDeploy:false,deployed:false};
test('CI privée : seul le SHA propre effectivement testé peut qualifier le paquet',()=>{
 assertDevelopmentSource(good,sha);
 for(const patch of [{sourceSha:null},{sourceSha:'b'.repeat(40)},{baseSha:'b'.repeat(40)},{localUncommitted:true},{readyToDeploy:true},{deployed:true}])assert.throws(()=>assertDevelopmentSource({...good,...patch},sha));
 assert.throws(()=>assertDevelopmentSource(good,'not-a-sha'));
});
test('CI privée : liste fermée de code, SnapshotReader admis mais jamais une vraie projection',()=>{
 for(const path of ['private/runtime/SnapshotReader.php','private/assets/developments-abc123.js','private/assets/assets.json','public/developpements/index.php','configuration/connect-developments.example.php','configuration/drupal-authority.example.php','preparation/plan.json'])assertDevelopmentPackagePath(path);
 for(const path of ['private/snapshot.json','private/publication-key','public/developpements/suivi-client.json','private/assets/real-proof.pdf','configuration/developments.php','configuration/real-owner.json','preparation/real-backup.json','private/assets/../snapshot.json'])assert.throws(()=>assertDevelopmentPackagePath(path));
});
