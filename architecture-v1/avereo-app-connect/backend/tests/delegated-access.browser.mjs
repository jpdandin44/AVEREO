import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import test from 'node:test';

const {chromium}=createRequire(new URL('../../../avereo-app-saisie-unique/frontend/package.json',import.meta.url))('playwright');
const root=new URL('../public/',import.meta.url);
test('le choix d’organisation dirige la modification vers le bon membre',async t=>{
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  t.after(()=>browser.close());
  const page=await browser.newPage();
  const operations=[];
  await page.route('**/*',async route=>{
    const req=route.request(), url=new URL(req.url()), p=url.pathname;
    if(url.origin!=='http://127.0.0.1') return route.abort();
    const ok=data=>route.fulfill({json:{data}});
    if(p==='/api/v1/session') return ok({authenticated:true,approved:true,accountStatus:'active',csrfToken:'local-fixture'});
    if(p==='/api/v1/me') return ok({displayName:'Recette'});
    if(p==='/api/v1/catalog') return ok([]);
    if(p==='/api/v1/organizations') return ok([{id:7,name:'Alpha',role:'owner'},{id:8,name:'Beta',role:'member',canManageApplicationAccess:true},{id:9,name:'Gamma',role:'member'}]);
    if(p==='/api/v1/admin/organizations/8/accounts') return ok({actorRole:'access_manager',organization:{id:8,name:'Beta'},applications:[{code:'rapport',name:'Rapport'}],users:[{id:42,displayName:'Client fictif',role:'member',status:'active',membershipStatus:'active',canManageApplications:true,applications:[{code:'rapport',name:'Rapport',status:operations.length?'active':'revoked'}]}]});
    if(p==='/api/v1/admin/organizations/8/users/42/applications/rapport' && req.method()==='PUT'){
      operations.push(req.postDataJSON());return ok({});
    }
    if(p.startsWith('/api/')) return route.fulfill({status:404,json:{}});
    if(!['/','/account-menu.js'].includes(p)) return route.abort();
    return route.fulfill({path:fileURLToPath(new URL(p==='/'?'index.html':p.slice(1),root))});
  });
  await page.goto('http://127.0.0.1/');
  const select=page.getByLabel('Organisation à administrer');
  await select.waitFor();
  assert.deepEqual(await select.locator('option').allTextContents(),['Alpha','Beta']);
  await select.selectOption('8');
  await page.waitForURL('**/?admin_org=8');
  await select.waitFor();
  // Invoke the actual slotted action; opening the account menu is unrelated to this routing test.
  await page.locator('#admin-open').evaluate(button=>button.click());
  const box=page.getByRole('checkbox',{name:'Rapport pour Client fictif'});
  await box.check();
  await page.getByText('L’accès à Rapport est autorisé pour Client fictif.').waitFor();
  assert.deepEqual(operations,[{status:'active'}]);
  assert.equal(await page.locator('#account-create-panel').isVisible(),false);
});
