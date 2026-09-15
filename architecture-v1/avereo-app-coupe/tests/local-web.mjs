import assert from 'node:assert/strict';

// Local synthetic profiles only. Never send these requests to a hosted environment.
const connect = 'http://127.0.0.1:8080';
const coupe = 'http://127.0.0.1:8200';
const rapport = 'http://127.0.0.1:8100';
async function get(url, cookie = '') {
  const response = await fetch(url, {
    redirect: 'manual', signal: AbortSignal.timeout(10000),
    headers: cookie ? { Cookie: cookie } : {},
  });
  return { status: response.status, body: await response.text(), headers: response.headers };
}
function check(name, condition) {
  assert.ok(condition, name);
  console.log(`PASS ${name}`);
}
function cookieOf(response, name) {
  const cookie = response.headers.getSetCookie().find(value => value.startsWith(`${name}=`));
  assert.ok(cookie, `Cookie ${name} absent`);
  return cookie.split(';')[0];
}
async function launch(app, connectCookie) {
  const result = await get(`${connect}/api/v1/apps/${app}/launch`, connectCookie);
  check(`${app} launch authorized`, result.status === 303);
  const target = new URL(result.headers.get('location'));
  check(`${app} launch target`, target.origin === (app === 'coupe' ? coupe : rapport));
  return target.href;
}

if (process.argv.includes('--coupe-placeholder')) {
  const login = await get(`${connect}/api/v1/local/login?account=client`);
  const cookie = cookieOf(login, 'AVEREO_CONNECT_LOCAL');
  const result = await get(`${connect}/api/v1/apps/coupe/launch`, cookie);
  const target = result.headers.get('location') || '';
  check('Coupe placeholder restored', result.status === 303 && target.startsWith(`${connect}/local-app/coupe?`));
  const exchanged = await get(target, cookie);
  check('Coupe placeholder ticket exchanged', exchanged.status === 303 && exchanged.headers.get('location') === '/local-app/coupe');
  const placeholderCookie = cookieOf(exchanged, 'AVEREO_LOCAL_GATE_COUPE');
  const placeholder = await get(`${connect}/local-app/coupe`, placeholderCookie);
  check('Coupe placeholder opens', placeholder.status === 200 && placeholder.body.includes('MODE LOCAL DOCKER'));
  const rapportEntry = await get(await launch('rapport', cookie));
  check('Rapport remains available after Coupe down', rapportEntry.status === 303);
  const rapportCookie = cookieOf(rapportEntry, 'AVEREO_RAPPORT_GATE_LOCAL');
  check('real Rapport opens after Coupe down', (await get(`${rapport}/`, rapportCookie)).status === 200);
  console.log('PASS local Coupe rollback without stopping Rapport');
  process.exit(0);
}

for (const path of ['/', '/index.html', '/legacy-app.html', '/connect/content.php']) {
  const response = await get(coupe + path);
  check(`anonymous Coupe ${path} redirects`, response.status === 303 && response.headers.get('location') === `${connect}/?app=coupe`);
}
for (const path of ['/api/auth.php?action=config', '/api/projects.php']) {
  check(`anonymous API ${path} denied`, (await get(coupe + path)).status === 403);
}
check('private config not served', !(await get(`${coupe}/local/config.php`)).body.includes('connect_launch_secret'));
const health = JSON.parse((await get(`${coupe}/api/health.php`)).body);
check('local gateway configured without Coupe database', health.ok && health.authConfigured && health.authMode === 'connect_gateway' && !health.databaseConfigured);
const anon = await get(`${connect}/api/v1/apps/coupe/launch`);
check('anonymous CONNECT launch refused', anon.status >= 400);

const identities = [];
for (const profile of ['owner', 'client']) {
  const login = await get(`${connect}/api/v1/local/login?account=${profile}`);
  check(`${profile} login`, login.status === 303);
  const connectCookie = cookieOf(login, 'AVEREO_CONNECT_LOCAL');
  const target = await launch('coupe', connectCookie);
  const exchanged = await get(target);
  check(`${profile} Coupe ticket exchanged`, exchanged.status === 303 && exchanged.headers.get('location') === '/');
  const cookie = cookieOf(exchanged, 'AVEREO_COUPE_GATE_LOCAL');
  const attributes = exchanged.headers.getSetCookie().join(';');
  check('local cookie protections', /HttpOnly/i.test(attributes) && /SameSite=Lax/i.test(attributes) && !/;\s*Secure/i.test(attributes));
  check('ticket replay denied', (await get(target)).status === 403);
  check('real React wrapper opens', (await get(`${coupe}/`, cookie)).status === 200);
  const content = await get(`${coupe}/legacy-app.html`, cookie);
  check('real Coupe content opens', content.status === 200 && content.body.includes('fabric.Canvas') && content.body.includes('window.top.location.assign'));
  const me = JSON.parse((await get(`${coupe}/api/auth.php?action=me`, cookie)).body);
  check('signed identity reaches Coupe', me.ok && me.user.provider === 'avereo_connect' && me.user.roles.includes('coupe_user'));
  identities.push(me.user.id);
  const altered = new URL(await launch('coupe', connectCookie));
  const ticket = altered.searchParams.get('ticket');
  altered.searchParams.set('ticket', (ticket[0] === 'A' ? 'B' : 'A') + ticket.slice(1));
  check('tampered ticket denied', (await get(altered.href)).status === 403);
  const rapportTarget = await launch('rapport', connectCookie);
  const wrongTarget = new URL(rapportTarget);
  wrongTarget.port = '8200';
  check('Rapport ticket cannot open Coupe', (await get(wrongTarget.href)).status === 403);
  const rapportEntry = await get(rapportTarget);
  check('Rapport remains available', rapportEntry.status === 303);
  const rapportCookie = cookieOf(rapportEntry, 'AVEREO_RAPPORT_GATE_LOCAL');
  check('real Rapport opens', (await get(`${rapport}/`, rapportCookie)).status === 200);
  check('Coupe cookie cannot open Rapport', (await get(`${rapport}/`, cookie)).status === 303);
  const logout = await get(`${coupe}/connect/logout.php`, cookie);
  check('Coupe logout returns to CONNECT', logout.status === 303 && logout.headers.get('location') === `${connect}/?logout=1`);
  check('Coupe cookie cleared on logout', logout.headers.getSetCookie().some(value => value.startsWith('AVEREO_COUPE_GATE_LOCAL=') && /Max-Age=0|1970/i.test(value)));
  for (const app of ['projet', 'thermo', 'drone']) {
    const response = await get(`${connect}/api/v1/apps/${app}/launch`, connectCookie);
    check(`${app} stays simulated`, response.status === 303 && response.headers.get('location').startsWith(`${connect}/local-app/${app}?`));
  }
}
check('local accounts keep distinct identities', identities[0] !== identities[1]);
console.log('PASS local CONNECT -> real Rapport + Coupe');
