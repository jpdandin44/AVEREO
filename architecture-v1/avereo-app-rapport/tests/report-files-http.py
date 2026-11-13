"""Local complete-report HTTP recipe using existing PHP and a disposable MariaDB.

No hosted config or records are read; the already available image is never pulled.
--serve keeps a fictitious two-account review running until this process stops.
"""
from pathlib import Path
import argparse
import base64
import hashlib
import hmac
import http.client
import json
import os
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import zlib
import struct

APP = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--receipt', type=Path)
parser.add_argument('--serve', action='store_true', help='Keep a local fictitious two-account review environment running after the checks')
parser.add_argument('--port', type=int, default=5186, help='Local Vite review port with --serve')
args = parser.parse_args()
PHP = shutil.which('php')
assert PHP and shutil.which('docker'), 'Existing PHP and Docker required'
parent = Path(tempfile.gettempdir()).resolve()
scratch = parent / ('avereo-report-files-http-' + secrets.token_hex(6))
scratch.mkdir()
assert scratch.resolve().parent == parent
web = scratch / 'web'
for name in ('api', 'connect'):
    shutil.copytree(APP / 'frontend/public' / name, web / name)
checks = []


def check(name, value):
    assert value, name
    checks.append(name)


def port():
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        return s.getsockname()[1]


db_port, php_port = port(), port()
password = secrets.token_hex(20)  # Fictitious, temporary database only.
key = secrets.token_hex(32)
container_name = 'avereo-report-files-test-' + secrets.token_hex(5)
container = None
server = None
vite = None
db_name = 'rapport_files_test'
origin = f'http://127.0.0.1:{php_port}'
config = {
    'environment': 'local', 'auth_mode': 'connect_gateway',
    'db_host': '127.0.0.1', 'db_port': db_port, 'db_name': db_name,
    'db_user': 'root', 'db_password': password,
    'connect_launch_secret': key, 'connect_portal_url': origin,
    'connect_launch_nonce_directory': str(scratch / 'nonces'),
    'connect_gate_cookie': 'AVEREO_RAPPORT_GATE', 'connect_gate_session_seconds': 1800,
    'connect_admin_user_ids': ['1'],
}
config_path = scratch / 'config.php'


def write_config():
    encoded = json.dumps(config).replace('\\', '\\\\').replace("'", "\\'")
    config_path.write_text("<?php return json_decode('" + encoded + "', true);", encoding='utf-8')


def mysql(sql, database=None):
    result = subprocess.run(['docker', 'exec', '-e', 'MYSQL_PWD=' + password, '-i', container,
                             'mariadb', '-uroot', '--batch', '--skip-column-names',
                             *( [database] if database else [])], input=sql.encode(), capture_output=True)
    assert result.returncode == 0, 'Fictitious database operation failed'
    return result.stdout


def req(path, cookie='', method='GET', body=None, headers=None):
    connection = http.client.HTTPConnection('127.0.0.1', php_port, timeout=15)
    request_headers = {'Cookie': cookie, 'Origin': origin, 'Sec-Fetch-Site': 'same-origin'}
    request_headers.update(headers or {})
    connection.request(method, path, body=body, headers=request_headers)
    response = connection.getresponse()
    result = response.status, dict(response.getheaders()), response.read()
    connection.close()
    return result


def b64(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode()


def enter(user):
    now = int(time.time())
    payload = {'v': 1, 'app': 'rapport', 'iat': now, 'exp': now + 90,
               'nonce': secrets.token_urlsafe(24), 'identity': {'provider': 'avereo_connect', 'id': str(user)}}
    encoded = b64(json.dumps(payload, separators=(',', ':')).encode())
    ticket = encoded + '.' + b64(hmac.new(key.encode(), encoded.encode(), hashlib.sha256).digest())
    result = req('/connect/entry.php?ticket=' + ticket)
    check('Signed local gate entry ' + str(user), result[0] == 303)
    return result[1]['Set-Cookie'].split(';')[0]


try:
    launched = subprocess.run(['docker', 'run', '--pull=never', '--rm', '-d', '--name', container_name,
                              '--memory=512m', '--cpus=1', '--tmpfs', '/var/lib/mysql:rw,size=256m',
                              '-p', f'127.0.0.1:{db_port}:3306',
                              '-e', 'MARIADB_ROOT_PASSWORD=' + password, '-e', 'MARIADB_DATABASE=' + db_name,
                              'mariadb:11.4'], capture_output=True, text=True)
    assert launched.returncode == 0, 'Dedicated existing MariaDB image could not start'
    container = launched.stdout.strip()
    assert len(container) == 64 and all(c in '0123456789abcdef' for c in container)
    deadline = time.monotonic() + 45
    while True:
        ready = subprocess.run(['docker', 'exec', '-e', 'MYSQL_PWD=' + password, container,
                                'mariadb', '-uroot', '-e', 'SELECT 1'], capture_output=True)
        if ready.returncode == 0:
            break
        assert time.monotonic() < deadline, 'Fictitious database startup timed out'
        time.sleep(.25)
    for migration in ('001_create_rapport_reports.sql',):
        mysql((APP / 'database/migrations' / migration).read_text(), db_name)
    check('Real report migration executed in isolated MariaDB', True)
    write_config()
    ext = Path(PHP).parent / 'ext'
    command = [PHP]
    if os.name == 'nt':
        command += ['-d', 'extension_dir=' + str(ext), '-d', 'extension=pdo_mysql']
    command += ['-S', f'127.0.0.1:{php_port}', '-t', str(web)]
    log = (scratch / 'php.log').open('w', encoding='utf-8')
    server = subprocess.Popen(command, env=dict(os.environ, AVEREO_CONFIG_FILE=str(config_path)), stdout=log, stderr=log)
    for attempt in range(80):
        try:
            with socket.create_connection(('127.0.0.1', php_port), timeout=.1):
                break
        except OSError:
            assert server.poll() is None, 'PHP fixture stopped'
            time.sleep(.05)
    for name in ('reports.php', 'report-download.php', 'bootstrap.php'):
        check('Unmodified API bytes: ' + name,
              (web / 'api' / name).read_bytes() == (APP / 'frontend/public/api' / name).read_bytes())
    a, b, admin = enter(101), enter(102), enter(1)
    A = 'a' * 32
    fixture = json.loads((APP / 'tests/fixtures/dossier-complet.json').read_text(encoding='utf-8'))
    # This JSON integer must also survive the server's RAW download, without JS re-encoding.
    def save(cookie, payload, rid=''):
        return req('/api/reports.php', cookie, 'POST', json.dumps({'id': rid, 'report': payload}, ensure_ascii=False).encode('utf-8'), {'Content-Type': 'application/json'})
    result = save(a, fixture, A)
    check('Full source save accepted', result[0] == 200)
    ack = json.loads(result[2])['report']
    check('Save acknowledgement counts re-read content', ack['content']['observations'] == 12 and ack['content']['photos'] == 2 and ack['content']['plans'] == 1)
    source = mysql("SELECT * FROM rapport_reports WHERE public_id='" + A + "';", db_name)
    stored = bytes.fromhex(mysql("SELECT HEX(payload_json) FROM rapport_reports WHERE public_id='" + A + "';", db_name).decode().strip())
    check('Stored full data matches submitted fields', json.loads(stored) == fixture)
    result = req('/api/reports.php?id=' + A + '&download=1', a)
    check('Full download byte-identical to database', result[0] == 200 and result[2] == stored)
    check('Download hash and byte count exact', result[1].get('X-Avereo-Payload-Sha256') == hashlib.sha256(stored).hexdigest() and int(result[1].get('Content-Length', -1)) == len(stored))
    probe_id = 'd' * 32
    probe = dict(fixture, grand_entier_serveur=9007199254740993)
    check('Large integer probe stored', save(a, probe, probe_id)[0] == 200)
    check('Unknown large integer kept exactly', b'9007199254740993' in req('/api/reports.php?id=' + probe_id + '&download=1', a)[2])
    req('/api/reports.php?id=' + probe_id, a, 'DELETE')
    check('Private attachment headers present', result[1].get('Content-Disposition', '').startswith('attachment;') and result[1].get('Cache-Control') == 'private, no-store' and result[1].get('X-Content-Type-Options') == 'nosniff')
    fresh = enter(101)
    reopened = req('/api/reports.php?id=' + A, fresh)
    check('New local signed session loads full content', reopened[0] == 200 and json.loads(reopened[2])['report']['payload'] == fixture)
    for suffix in ['', '&download=1']:
        check('Other owner denied ' + ('download' if suffix else 'read'), req('/api/reports.php?id=' + A + suffix, b)[0] == 404)
    check('Other owner cannot overwrite source', save(b, fixture, A)[0] == 403)
    check('Unauthenticated full download denied', req('/api/reports.php?id=' + A + '&download=1')[0] == 403)
    check('Existing administrator can read without transfer', req('/api/reports.php?id=' + A + '&download=1', admin)[2] == stored)
    copied = dict(fixture)
    copied.pop('onlineReportId')
    result = save(b, copied)
    check('Independent recipient save accepted', result[0] == 200)
    B = json.loads(result[2])['report']['id']
    check('Recipient has a different server id', B != A)
    check('Recipient owns the copy only', mysql("SELECT owner_id FROM rapport_reports WHERE public_id='" + B + "';", db_name).strip() == b'102')
    fresh_b = enter(102)
    check('Recipient reopens all business fields', json.loads(req('/api/reports.php?id=' + B, fresh_b)[2])['report']['payload'] == copied)
    check('Source rows and owner unchanged', mysql("SELECT * FROM rapport_reports WHERE public_id='" + A + "';", db_name) == source)
    check('Recipient cannot access source after import', req('/api/reports.php?id=' + A + '&download=1', fresh_b)[0] == 404)
    bad_id = 'c' * 32
    bad_hex = b'{"updatedAt":"2026-11-13"}'.hex()
    mysql("INSERT INTO rapport_reports(public_id,payload_json,payload_bytes,owner_provider,owner_id,owner_email,created_by_id,updated_by_id) VALUES ('"+bad_id+"',CONVERT(0x"+bad_hex+" USING utf8mb4),26,'avereo_connect','101','','101','101');", db_name)
    broken = req('/api/reports.php?id=' + bad_id + '&download=1', a)
    check('Metadata-only legacy row never downloads as full file', broken[0] == 503 and 'Content-Disposition' not in broken[1])
    check('Invalid download flag rejected', req('/api/reports.php?id=' + A + '&download[]=1', a)[0] == 422)
    req('/api/reports.php?id=' + bad_id, a, 'DELETE')  # Disposable malformed fixture only.
    fault_id = 'e' * 32
    mysql("CREATE TRIGGER report_fixture_drop_content BEFORE INSERT ON rapport_reports FOR EACH ROW SET NEW.payload_json=IF(NEW.public_id='" + fault_id + "','{\"updatedAt\":\"2026-11-13\"}',NEW.payload_json);", db_name)
    try:
        unconfirmed = save(a, fixture, fault_id)
        check('DB content loss never receives a successful save acknowledgement', unconfirmed[0] == 409 and json.loads(unconfirmed[2])['error'] == 'report_write_unconfirmed')
        check('Unconfirmed write returns its id to prevent duplicate retry', json.loads(unconfirmed[2])['reportId'] == fault_id)
        check('Unconfirmed truncated row cannot download as full content', req('/api/reports.php?id=' + fault_id + '&download=1', a)[0] == 503)
    finally:
        mysql('DROP TRIGGER report_fixture_drop_content;', db_name)
        req('/api/reports.php?id=' + fault_id, a, 'DELETE')  # Disposable fault fixture only.
    check('Source still exact after refusal cases', mysql("SELECT * FROM rapport_reports WHERE public_id='" + A + "';", db_name) == source)
    receipt = {'status': 'passed', 'count': len(checks), 'checks': checks, 'hostingChanged': False,
               'scope': 'Actual PHP, real SQL migration in disposable local MariaDB, existing application gate with fictitious signed identities; not hosted CONNECT/OAuth',
               'sourceRowsAndOwnerPreserved': True, 'copyOwnerSeparate': True}
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(receipt, ensure_ascii=False, indent=2), flush=True)
    if args.serve:
        # Test-only portal, outside product/public sources. Generates fictitious launch tickets
        # for this temporary database only; no new real account or access is created.
        router = scratch / 'router.php'
        router.write_text('''<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST' && parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) === '/api/reports.php' && is_file(__DIR__.'/delay-next-save')) {
    unlink(__DIR__.'/delay-next-save'); usleep(2000000); // Fictitious local latency test only.
}
if (str_starts_with(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/fixture/')) {
    $c = require getenv('AVEREO_CONFIG_FILE');
    if ($c['environment'] !== 'local' || !in_array(parse_url('http://'.$_SERVER['HTTP_HOST'], PHP_URL_HOST), ['127.0.0.1','localhost'], true)) { http_response_code(403); exit; }
    $b64 = static fn($s) => rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
    $ticket = static function($id) use($c,$b64) {
        $now=time(); $p=['v'=>1,'app'=>'rapport','iat'=>$now,'exp'=>$now+90,'nonce'=>$b64(random_bytes(24)),
            'identity'=>['provider'=>'avereo_connect','id'=>(string)$id]];
        $encoded=$b64(json_encode($p)); return $encoded.'.'.$b64(hash_hmac('sha256',$encoded,$c['connect_launch_secret'],true));
    };
    header('Content-Type: text/html; charset=utf-8'); header('Cache-Control: no-store');
    echo '<!doctype html><html lang="fr"><meta name="viewport" content="width=device-width"><title>Recette locale des dossiers complets</title><style>body{font:18px system-ui;max-width:760px;margin:60px auto;padding:24px;color:#142033}a{display:block;padding:18px;margin:20px 0;background:#1655d8;color:white;border-radius:8px;text-decoration:none}</style><h1>Dossiers complets — recette locale</h1><p>Deux comptes fictifs et une base temporaire sur cet ordinateur. Aucune donnée de préproduction.</p><p>Le compte A possède TEST DOSSIER COMPLET, avec 12 constats et 2 photos fictifs. Téléchargez son JSON complet, passez au compte B, chargez le fichier puis sauvez une copie indépendante. Le brouillon local reste propre à ce navigateur.</p>';
    foreach ([101=>'Compte fictif A',102=>'Compte fictif B'] as $id=>$name) echo '<a href="/connect/entry.php?ticket='.htmlspecialchars($ticket($id),ENT_QUOTES).'">'.$name.'</a>';
    echo '<p>La fermeture du service local efface cette base de recette temporaire.</p></html>'; exit;
}
return false;
''', encoding='utf-8')
        # Restart only this script's PHP process to enable its test-only portal.
        server.terminate(); server.wait(timeout=15)
        config.update(db_name=db_name,
                      connect_portal_url=f'http://127.0.0.1:{args.port}/fixture/')
        write_config()
        server = subprocess.Popen(command + [str(router)], env=dict(os.environ, AVEREO_CONFIG_FILE=str(config_path)), stdout=log, stderr=log)
        module = (APP / 'frontend/node_modules/vite/dist/node/index.js').resolve().as_uri()
        frontend = APP / 'frontend'
        settings = {'root': str(frontend), 'cacheDir': str(scratch / 'vite-cache'),
                    'server': {'host': '127.0.0.1', 'port': args.port, 'strictPort': True,
                               'proxy': {path: {'target': origin, 'changeOrigin': False}
                                         for path in ('/api', '/connect', '/fixture')}}}
        script = (f'import {{createServer}} from {json.dumps(module)}; '
                  + 'const server=await createServer(' + json.dumps(settings) + '); '
                  + 'await server.listen();server.printUrls();')
        vite = subprocess.Popen(['node', '--input-type=module', '-e', script], cwd=frontend,
                                env=dict(os.environ, VITE_ENABLE_ONLINE_SYNC='true'))
        print(json.dumps({'reviewEntry': f'http://127.0.0.1:{args.port}/fixture/', 'fictitious': True,
                          'databaseContainer': container_name, 'scratch': str(scratch)}), flush=True)
        (scratch / 'fixture-source.json').write_text(json.dumps(fixture, ensure_ascii=False, indent=2), encoding='utf-8')
        while vite.poll() is None and server.poll() is None:
            time.sleep(1)
finally:
    if vite and vite.poll() is None:
        vite.terminate()
        vite.wait(timeout=15)
    if server:
        server.terminate()
        server.wait(timeout=15)
    if container:
        subprocess.run(['docker', 'stop', '-t', '5', container], capture_output=True)
