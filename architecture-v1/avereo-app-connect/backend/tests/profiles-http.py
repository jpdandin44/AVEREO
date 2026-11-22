"""Native local PHP/SQLite profile administration; no real identity, account or email."""
import argparse
import http.client
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--serve', action='store_true')
parser.add_argument('--port', type=int, default=5202)
parser.add_argument('--receipt', type=Path)
args = parser.parse_args()
backend = Path(__file__).resolve().parents[1]
php = shutil.which('php')
assert php
checks = []


def check(name, value):
    assert value, name
    checks.append(name)


def free_port():
    with socket.socket() as connection:
        connection.bind(('127.0.0.1', 0))
        return connection.getsockname()[1]


with tempfile.TemporaryDirectory(prefix='profils-connect-admin-') as scratch:
    private = Path(scratch)
    assert private.resolve().parent == Path(tempfile.gettempdir()).resolve()
    initial = private / 'initialized.json'
    initializer = [php, str(backend / 'bin/initialize-profiles.php'), '--catalogue-file', str(initial), '--document-root', str(backend / 'public')]
    check('private catalogue initialized explicitly', subprocess.run(initializer, capture_output=True).returncode == 0)
    content = initial.read_bytes()
    check('initialization never overwrites an existing catalogue', subprocess.run(initializer, capture_output=True).returncode != 0 and initial.read_bytes() == content)
    webroot = private / 'public'; webroot.mkdir()
    forbidden = webroot / 'catalogue.json'
    check('initialization refuses public storage', subprocess.run([php, str(backend / 'bin/initialize-profiles.php'), '--catalogue-file', str(forbidden), '--document-root', str(webroot)], capture_output=True).returncode != 0 and not forbidden.exists())
    db = private / 'accounts.sqlite'
    port = args.port if args.serve else free_port()
    origin = f'http://127.0.0.1:{port}'
    command = [php]
    if os.name == 'nt':
        command += ['-d', f'extension_dir={Path(php).parent / "ext"}', '-d', 'extension=pdo_sqlite', '-d', 'extension=sqlite3']
    command += ['-S', f'127.0.0.1:{port}', '-t', str(backend / 'public'), str(backend / 'tests/account-ui-router.php')]
    env = dict(os.environ, APP_ENV='local', ACCOUNT_UI_FIXTURE='true', PROFILES_UI_FIXTURE='true', ACCOUNT_UI_DB=str(db))
    log = (private / 'server.log').open('wb')
    process = subprocess.Popen(command, env=env, stdout=log, stderr=log)

    def request(path, method='GET', body=None, actor=1, csrf=True, foreign=False):
        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=20)
        headers = {'Cookie': f'profiles_fixture_actor={actor}', 'Origin': 'https://foreign.example.invalid' if foreign else origin}
        if csrf:
            headers['X-CSRF-Token'] = 'local-ui-csrf'
        if body is not None:
            headers['Content-Type'] = 'application/json'
        connection.request(method, path, None if body is None else json.dumps(body), headers)
        response = connection.getresponse()
        payload = response.read()
        connection.close()
        return response.status, json.loads(payload)

    try:
        deadline = time.monotonic() + 15
        while True:
            try:
                if request('/api/v1/session')[0] == 200:
                    break
            except OSError:
                pass
            assert time.monotonic() < deadline and process.poll() is None, 'Local profile server unavailable'
            time.sleep(.1)
        status, listing = request('/api/v1/admin/profiles')
        check('global owner reads common catalogue', status == 200 and len(listing['data']['profiles']) == 3)
        check('ordinary member refused', request('/api/v1/admin/profiles', actor=2)[0] == 403)
        body = {'revision': 0, 'name': 'Conseiller rénovation — recette', 'description': 'Compte et type fictifs',
                'template': 'habitologue', 'active': True, 'applications': ['rapport'], 'reportActions': ['read', 'export']}
        check('CSRF missing refused', request('/api/v1/admin/profiles', 'POST', body, csrf=False)[0] == 403)
        check('foreign origin refused', request('/api/v1/admin/profiles', 'POST', body, foreign=True)[0] == 403)
        check('member cannot create type', request('/api/v1/admin/profiles', 'POST', body, actor=2)[0] == 403)
        status, created = request('/api/v1/admin/profiles', 'POST', body)
        profile = created['data']['profileId']
        check('custom type created through real API', status == 200 and profile.startswith('p_'))
        check('old revision refused', request('/api/v1/admin/profiles', 'POST', body)[0] == 409)
        bad = dict(body, revision=1, name='Invalid', applications=['unknown'])
        check('unknown application refused', request('/api/v1/admin/profiles', 'POST', bad)[0] == 422)
        check('member cannot probe application validity before authorization', request('/api/v1/admin/profiles', 'POST', bad, actor=2)[0] == 403)
        check('owner account protected', request('/api/v1/admin/organizations/7/users/1/profile', 'PUT', {'revision': 1, 'profileId': profile})[0] == 403)
        check('wrong organization target refused', request('/api/v1/admin/organizations/8/users/2/profile', 'PUT', {'revision': 1, 'profileId': profile})[0] == 403)
        status, _ = request('/api/v1/admin/organizations/7/users/2/profile', 'PUT', {'revision': 1, 'profileId': profile})
        check('profile assigned through real API', status == 200)
        check('new request reloads saved assignment', request('/api/v1/admin/profiles')[1]['data']['assignments']['2'] == profile)
        status, preferences = request('/api/v1/me/preferences', actor=2)
        check('own preferences expose administered type', status == 200 and preferences['data']['accessProfile']['id'] == profile)
        context = preferences['data']['accountContext']
        connection = http.client.HTTPConnection('127.0.0.1', port, timeout=20)
        connection.request('PUT', '/api/v1/me/preferences', json.dumps({'professionalProfile': 'architecte'}),
                           {'Cookie': 'profiles_fixture_actor=2', 'Origin': origin, 'X-CSRF-Token': 'local-ui-csrf',
                            'X-Account-Context': context, 'Content-Type': 'application/json'})
        response = connection.getresponse(); response.read(); connection.close()
        check('personal profession still editable', response.status == 200)
        policy = json.loads(Path(str(db) + '.policy.json').read_text())
        check('personal choice cannot add permissions', policy['accounts']['2']['report_actions'] == ['read', 'export'])
        role = Path(str(db) + '.role.json')
        role.write_text(json.dumps({'active': True, 'global': False}))
        check('native global role removal is fresh on next request', request('/api/v1/admin/profiles')[0] == 403)
        role.write_text(json.dumps({'active': True, 'global': True}))
        check('global role restoration is observed freshly', request('/api/v1/admin/profiles')[0] == 200)
        report = {'status': 'passed', 'assertions': len(checks), 'checks': checks,
                  'fictitious': True, 'realIdentityOrHostedSSOTested': False,
                  'entry': origin, 'db': str(db), 'policy': str(db) + '.policy.json', 'profileId': profile, 'process': process.pid}
        if args.receipt:
            args.receipt.parent.mkdir(parents=True, exist_ok=True)
            args.receipt.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
        print(json.dumps(report, ensure_ascii=False), flush=True)
        if args.serve:
            while process.poll() is None:
                time.sleep(1)
    finally:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill(); process.wait(timeout=5)
        log.close()
