import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
test('CONNECT configure UNI avec un secret distinct et une URL dédiée',()=>{
 const source=fileURLToPath(new URL('../../../../avereo-app-connect/backend/src/Config.php',import.meta.url));
 const php=`require ${JSON.stringify(source)}; putenv('APP_ENV=test'); putenv('APP_LAUNCH_UNI_URL=https://uni-preprod.avereo.fr/connect/entry.php'); putenv('APP_LAUNCH_UNI_SECRET=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'); $c=Avereo\\Connect\\Config::fromEnvironment(); echo json_encode([$c->appLaunchEntryUrl('uni'),strlen($c->appLaunchSecret('uni')),$c->appLaunchSecret('rapport')]);`;
 const result=JSON.parse(execFileSync('php',['-r',php],{encoding:'utf8'}));
 assert.deepEqual(result,['https://uni-preprod.avereo.fr/connect/entry.php',32,'']);
});
