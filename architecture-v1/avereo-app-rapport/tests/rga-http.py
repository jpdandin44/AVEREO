"""Exercise the real PHP entry points with isolated, short-lived test credentials."""
from pathlib import Path
import base64, hashlib, hmac, http.client, json, os, secrets, shutil, socket, subprocess, tempfile, time

APP = Path(__file__).resolve().parents[1]
PHP = shutil.which('php')
assert PHP and (APP / 'frontend/dist/rga/connect-gate.php').is_file(), 'Build Rapport first'
temp_root = Path(tempfile.gettempdir()).resolve()
scratch = temp_root / ('avereo-rga-http-' + secrets.token_hex(6))
scratch.mkdir(mode=0o700)
assert scratch.resolve().parent == temp_root
secrets_by_app = {name: secrets.token_hex(32) for name in ['rapport', 'rga']}
with socket.socket() as port_probe:
    port_probe.bind(('127.0.0.1', 0))
    port = port_probe.getsockname()[1]
def php_string(value):
    return "'" + str(value).replace('\\', '\\\\').replace("'", "\\'") + "'"
for name, secret in secrets_by_app.items():
    values = {'environment': 'local', 'connect_portal_url': f'http://127.0.0.1:{port}',
        'connect_launch_secret': secret, 'connect_launch_nonce_directory': str(scratch / (name + '-nonces')),
        'connect_gate_cookie': 'AVEREO_' + name.upper() + '_GATE', 'auth_mode': 'connect_gateway'}
    (scratch / (name + '.php')).write_text('<?php return [' + ','.join(php_string(k) + '=>' + php_string(v) for k, v in values.items()) + '];', encoding='utf-8')
env = dict(os.environ, AVEREO_CONFIG_FILE=str(scratch / 'rapport.php'), AVEREO_RGA_CONFIG_FILE=str(scratch / 'rga.php'))
server = subprocess.Popen([PHP, '-S', f'127.0.0.1:{port}', '-t', str(APP / 'frontend/dist')], env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
def b64(raw):
    return base64.urlsafe_b64encode(raw).rstrip(b'=').decode()
def ticket(app, key_app=None, lifetime=90):
    now = int(time.time())
    data = {'v': 1, 'app': app, 'iat': now, 'exp': now + lifetime, 'nonce': secrets.token_urlsafe(24),
        'identity': {'provider': 'avereo_connect', 'id': '42'}}
    encoded = b64(json.dumps(data, separators=(',', ':')).encode())
    return encoded + '.' + b64(hmac.new(secrets_by_app[key_app or app].encode(), encoded.encode(), hashlib.sha256).digest())
def get(path, cookie=''):
    client = http.client.HTTPConnection('127.0.0.1', port, timeout=5)
    client.request('GET', path, headers={'Cookie': cookie, 'Sec-Fetch-Dest': 'iframe'})
    response = client.getresponse()
    result = response.status, dict(response.getheaders()), response.read()
    client.close()
    return result
checks = []
def check(name, ok):
    assert ok, name
    checks.append(name)
try:
    for _ in range(40):
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=.1): break
        except OSError:
            assert server.poll() is None, 'PHP server failed'
            time.sleep(.05)
    check('anonymous denied', get('/rga/carte.php')[0] == 403)
    check('anonymous access false', json.loads(get('/rga/access.php')[2]) == {'authorized': False})
    status, headers, _ = get('/connect/entry.php?ticket=' + ticket('rapport'))
    check('Rapport ticket accepted', status == 303)
    rapport_cookie = headers['Set-Cookie'].split(';')[0]
    check('Rapport works', get('/index.php', rapport_cookie)[0] == 200)
    check('Rapport cookie does not grant RGA', get('/rga/carte.php', rapport_cookie)[0] == 403)
    check('Rapport cookie access false', json.loads(get('/rga/access.php', rapport_cookie)[2]) == {'authorized': False})
    value = ticket('rga')
    status, headers, _ = get('/rga/entry.php?ticket=' + value)
    check('RGA ticket accepted', status == 303 and headers['Location'] == '/rga/resume.php')
    rga_cookie = headers['Set-Cookie'].split(';')[0]
    check('distinct local cookie with HttpOnly and SameSite', rga_cookie.startswith('AVEREO_RGA_GATE=') and 'httponly' in headers['Set-Cookie'].lower() and 'samesite=lax' in headers['Set-Cookie'].lower())
    check('RGA works', get('/rga/carte.php', rga_cookie)[0] == 200)
    check('RGA access true', json.loads(get('/rga/access.php', rga_cookie)[2]) == {'authorized': True})
    check('RGA cookie does not grant Rapport', get('/index.php', rga_cookie)[0] == 303)
    check('one-time ticket', get('/rga/entry.php?ticket=' + value)[0] == 403)
    check('Rapport ticket rejected by RGA', get('/rga/entry.php?ticket=' + ticket('rapport'))[0] == 403)
    check('wrong audience rejected even with RGA key', get('/rga/entry.php?ticket=' + ticket('rapport', 'rga'))[0] == 403)
    check('RGA ticket rejected by Rapport', get('/connect/entry.php?ticket=' + ticket('rga'))[0] == 403)
    check('expired ticket rejected', get('/rga/entry.php?ticket=' + ticket('rga', lifetime=-1))[0] == 403)
    both = rapport_cookie + '; ' + rga_cookie
    check('both applications allowed independently', get('/index.php', both)[0] == 200 and get('/rga/carte.php', both)[0] == 200)
    print(json.dumps({'passed': len(checks), 'checks': checks}, ensure_ascii=False))
finally:
    server.terminate()
    server.wait(timeout=5)
    # Remove only the files produced by this isolated fixture.
    for name in ['rapport', 'rga']:
        (scratch / (name + '.php')).unlink()
        nonce_dir = scratch / (name + '-nonces')
        if nonce_dir.exists():
            for item in nonce_dir.glob('*.used'): item.unlink()
            nonce_dir.rmdir()
    scratch.rmdir()
