import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('le générateur observe de vrais clones sans modifier les travaux et sépare les archives',()=>{
  const python=process.env.AVEREO_TEST_PYTHON||(process.platform==='win32'?'python':'python3');
  const r=spawnSync(python,['-X','utf8',fileURLToPath(new URL('./development-reference-catalogue.py',import.meta.url))],{encoding:'utf8',timeout:60000});
  assert.equal(r.status,0,r.stderr||r.error?.message);assert.match(r.stderr,/Ran 6 tests/);assert.match(r.stderr,/\bOK\b/);assert(!r.stderr.includes('skipped'));
});
