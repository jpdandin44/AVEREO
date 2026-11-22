"""Local PHP/MariaDB recipe, unmodified API and signed fictitious CONNECT identities.

Uses the already installed mariadb:11.4 image, never pulls an image. The dedicated
ephemeral database is bound only to 127.0.0.1, and removed when the test ends.
No production/preproduction configuration, credentials or records are read.
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
parser.add_argument('--port', type=int, default=5185, help='Local Vite review port with --serve')
args = parser.parse_args()
PHP = shutil.which('php')
assert PHP and shutil.which('docker'), 'Existing PHP and Docker required'
parent = Path(tempfile.gettempdir()).resolve()
scratch = parent / ('avereo-photos-http-' + secrets.token_hex(6))
scratch.mkdir()
assert scratch.resolve().parent == parent
web = scratch / 'web'
for name in ('api', 'connect'):
    shutil.copytree(APP / 'frontend/public' / name, web / name)
originals = scratch / 'originals'
originals.mkdir()
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
container_name = 'avereo-photos-test-' + secrets.token_hex(5)
container = None
server = None
vite = None
db_name = 'rapport_photos_test'
origin = f'http://127.0.0.1:{php_port}'
config = {
    'environment': 'local', 'auth_mode': 'connect_gateway',
    'db_host': '127.0.0.1', 'db_port': db_port, 'db_name': db_name,
    'db_user': 'root', 'db_password': password,
    'connect_launch_secret': key, 'connect_portal_url': origin,
    'connect_launch_nonce_directory': str(scratch / 'nonces'),
    'connect_gate_cookie': 'AVEREO_RAPPORT_GATE', 'connect_gate_session_seconds': 1800,
    'connect_admin_user_ids': ['1'],
    'photo_originals_enabled': True, 'photo_originals_directory': str(originals),
    'photo_originals_max_bytes': 1024 * 1024, 'photo_originals_owner_quota_bytes': 2 * 1024 * 1024,
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


def upload(report_id, cookie, content, claimed=None):
    boundary = 'avereo-' + secrets.token_hex(12)
    body = b''
    for name, value in [('reportId', report_id), ('sha256', claimed or hashlib.sha256(content).hexdigest())]:
        body += f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"\r\n\r\n{value}\r\n'.encode()
    body += (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="fictive.png"\r\n'
             'Content-Type: image/png\r\n\r\n').encode() + content + f'\r\n--{boundary}--\r\n'.encode()
    return req('/api/photo-originals.php', cookie, 'POST', body,
               {'Content-Type': 'multipart/form-data; boundary=' + boundary, 'X-Avereo-Photo': '1'})


def file_tree(path):
    return {str(p.relative_to(path)): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in sorted(path.rglob('*')) if p.is_file()}


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
    for migration in ('001_create_rapport_reports.sql', '003_photo_originals.sql'):
        mysql((APP / 'database/migrations' / migration).read_text(), db_name)
    check('Both real SQL migrations executed in isolated MariaDB', True)
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
    for name in ('photo-originals.php', 'photo-original-store.php', 'bootstrap.php', 'reports.php'):
        check('Unmodified API bytes: ' + name,
              (web / 'api' / name).read_bytes() == (APP / 'frontend/public/api' / name).read_bytes())
    a, b, admin = enter(101), enter(102), enter(1)
    A, B = 'a' * 32, 'b' * 32
    for cookie, rid in [(a, A), (b, B)]:
        result = req('/api/reports.php', cookie, 'POST', json.dumps({'id': rid, 'report': {'titre': 'Fictif', 'observations': []}}),
                     {'Content-Type': 'application/json'})
        check('Create fictitious owned report ' + rid[0], result[0] == 200)
    before = mysql('SELECT * FROM rapport_reports ORDER BY id;', db_name)
    result = req('/api/photo-originals.php?action=capabilities', a)
    check('Enabled capabilities via real HTTP', result[0] == 200 and json.loads(result[2])['enabled'])
    chunk = lambda kind, data: struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data) & 0xffffffff)
    image = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
             + chunk(b'IDAT', zlib.compress(b'\0\xff\x66\x22')) + chunk(b'IEND', b''))
    result = upload(A, a, image)
    check('Real multipart upload accepted', result[0] == 200)
    original = json.loads(result[2])['original']
    check('Exact receipt', original['sha256'] == hashlib.sha256(image).hexdigest() and original['bytes'] == len(image))
    path = '/api/photo-originals.php?reportId=' + A + '&id=' + original['id']
    for cookie, who in [(b, 'second owner'), (admin, 'non-owner administrator')]:
        check('List denied to ' + who, req('/api/photo-originals.php?reportId=' + A, cookie)[0] == 404)
        check('Read denied to ' + who, req(path, cookie)[0] == 404)
        check('Upload denied to ' + who, upload(A, cookie, image)[0] == 404)
    check('Wrong claimed hash refused', upload(A, a, image, '0' * 64)[0] == 422)
    result = upload(A, a, image)
    check('HTTP dedup returns same id', result[0] == 200 and json.loads(result[2])['original']['id'] == original['id'])
    fresh = enter(101)
    result = req(path, fresh)
    check('Fresh signed local session reopens identical bytes', result[0] == 200 and result[2] == image)
    check('Private attachment headers', 'attachment;' in result[1].get('Content-Disposition', '') and 'no-store' in result[1].get('Cache-Control', ''))
    check('Report rows and owners unchanged by storing originals', mysql('SELECT * FROM rapport_reports ORDER BY id;', db_name) == before)
    # Backup and restore the actual SQL plus private files into independent local targets.
    dump = subprocess.run(['docker', 'exec', '-e', 'MYSQL_PWD=' + password, container,
                           'mariadb-dump', '-uroot', '--single-transaction', db_name], capture_output=True)
    check('Logical database backup produced', dump.returncode == 0 and b'rapport_photo_originals' in dump.stdout)
    backup = scratch / 'backup'
    shutil.copytree(originals, backup)
    check('Private file backup exact', file_tree(originals) == file_tree(backup))
    mysql('CREATE DATABASE rapport_photos_restore CHARACTER SET utf8mb4;')
    mysql(dump.stdout.decode(), 'rapport_photos_restore')
    restored = scratch / 'restored-originals'
    shutil.copytree(backup, restored)
    config.update(db_name='rapport_photos_restore', photo_originals_directory=str(restored))
    write_config()
    check('Restored API reopens exact original', req(path, fresh)[2] == image)
    check('Restored API still refuses other owner', req(path, b)[0] == 404)
    check('Restored reports preserve all rows and owners', mysql('SELECT * FROM rapport_reports ORDER BY id;', 'rapport_photos_restore') == before)
    check('Source reports still unchanged after private restore', mysql('SELECT * FROM rapport_reports ORDER BY id;', db_name) == before)
    receipt = {'status': 'passed', 'checks': checks, 'count': len(checks), 'source': 'local PHP and isolated MariaDB',
               'connect': 'Signed fictitious identities using existing application gate; no hosted CONNECT/OAuth recipe',
               'migration': 'Real SQL executed only in a new local ephemeral database',
               'backupRestore': 'SQL and private files restored into separate local targets', 'hostingChanged': False}
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(receipt, ensure_ascii=False, indent=2))
    if args.serve:
        # Test-only portal, outside product/public sources. Generates fictitious launch tickets
        # for this temporary database only; no new real account or access is created.
        router = scratch / 'router.php'
        router.write_text('''<?php
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
    echo '<!doctype html><html lang="fr"><meta name="viewport" content="width=device-width"><title>Recette locale des photos</title><style>body{font:18px system-ui;max-width:760px;margin:60px auto;padding:24px;color:#142033}a{display:block;padding:18px;margin:20px 0;background:#1655d8;color:white;border-radius:8px;text-decoration:none}</style><h1>Photos originales — recette locale</h1><p>Deux comptes fictifs et une base temporaire sur cet ordinateur. Aucune donnée de préproduction.</p><p>Choisissez le compte A pour créer un dossier, ajouter une photo puis conserver et rouvrir son original. Le compte B possède un espace en ligne distinct. Le brouillon local reste propre à ce navigateur.</p>';
    foreach ([101=>'Compte fictif A',102=>'Compte fictif B'] as $id=>$name) echo '<a href="/connect/entry.php?ticket='.htmlspecialchars($ticket($id),ENT_QUOTES).'">'.$name.'</a>';
    echo '<p>La fermeture du service local efface cette base de recette temporaire.</p></html>'; exit;
}
return false;
''', encoding='utf-8')
        # Restart only this script's PHP process to enable its test-only portal.
        server.terminate(); server.wait(timeout=15)
        config.update(db_name=db_name, photo_originals_directory=str(originals),
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
