"""Isolated PHP integration: real HTTP, synthetic identities, no hosted data."""
import base64
import hashlib
import hmac
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.request
import urllib.error

APP = Path(__file__).resolve().parents[1]
SECRET = 'synthetic-planning-test-secret-20261105'
checks = 0

def check(condition, message):
    global checks
    if not condition:
        raise AssertionError(message)
    checks += 1

def php_string(value):
    return "'" + str(value).replace('\\', '/').replace("'", "\\'") + "'"

def cookie(identity='1', expired=False):
    now = int(time.time())
    payload = {'v': 1, 'app': 'projet', 'iat': now - (1900 if expired else 1), 'exp': now - 1 if expired else now + 1200, 'nonce': 'synthetic-nonce-for-planning-test', 'identity': {'provider': 'avereo_connect', 'id': identity}}
    encode = lambda data: base64.urlsafe_b64encode(data).decode().rstrip('=')
    encoded = encode(json.dumps(payload).encode())
    return encoded + '.' + encode(hmac.new(SECRET.encode(), encoded.encode(), hashlib.sha256).digest())

def run():
    with tempfile.TemporaryDirectory(prefix='projet-http-') as temp:
        root = Path(temp)
        public = root / 'public'
        private = root / 'private'
        public.mkdir(); private.mkdir()
        shutil.copytree(APP / 'frontend/public/api', public / 'api')
        (public / 'connect').mkdir()
        shutil.copyfile(APP.parent / 'avereo-platform/shared/connect-gate.php', public / 'connect/gate.php')
        gate = root / 'gate.php'
        gate.write_text("<?php return ['environment'=>'local','connect_launch_secret'=>" + php_string(SECRET) + ", 'connect_gate_cookie'=>'PROJECT_TEST'];", encoding='utf-8')
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', 0)); port = probe.getsockname()[1]
        origin = 'http://127.0.0.1:' + str(port)
        settings = root / 'planning.php'
        settings.write_text("<?php return ['owner_connect_id'=>'1','directory'=>" + php_string(private) + ",'origin'=>" + php_string(origin) + "];", encoding='utf-8')
        env = dict(os.environ, AVEREO_CONFIG_FILE=str(gate), AVEREO_PLANNING_CONFIG=str(settings))
        with open(root / 'server.log', 'wb') as log:
            process = subprocess.Popen(['php', '-S', '127.0.0.1:' + str(port), '-t', str(public)], env=env, stdout=log, stderr=log)
            try:
                def request(method='GET', data=None, token=None, user='1', path='', origin_header=origin, raw=None, route='planning'):
                    headers = {'Content-Type': 'application/json', 'Origin': origin_header}
                    if user is not None: headers['Cookie'] = 'PROJECT_TEST=' + cookie(user, user == 'expired')
                    if token is not None: headers['X-Projet-CSRF'] = token
                    body = raw if raw is not None else None if data is None else json.dumps(data).encode()
                    req = urllib.request.Request(origin + '/api/' + route + '.php' + path, data=body, headers=headers, method=method)
                    try: response = urllib.request.urlopen(req, timeout=5)
                    except urllib.error.HTTPError as error: response = error
                    return response.status, json.loads(response.read()), response.headers
                for _ in range(60):
                    try:
                        status, record, headers = request(user=None); break
                    except (OSError, urllib.error.URLError): time.sleep(.05)
                else: raise AssertionError('PHP server unavailable')
                check(status == 401, 'anonymous refused')
                check(request(user='2')[0] == 403, 'other account refused')
                check(request(user='expired')[0] == 401, 'expired session refused')
                status, record, headers = request()
                check(status == 200 and record['project'] is None and record['revision'] == 0, 'empty private store')
                check('no-store' in headers['Cache-Control'], 'no cached personal data')
                token = record['csrf']
                # Fixed cookie within each second normally; keep it deterministic for CSRF.
                original_cookie = cookie()
                original_function = globals()['cookie']
                globals()['cookie'] = lambda identity='1', expired=False: original_cookie if identity == '1' and not expired else original_function(identity, expired)
                token = request()[1]['csrf']
                project = {'schemaVersion': 1, 'name': 'Fixture complète', 'startDate': '2026-11-05', 'targetDate': None, 'capacityPerWeek': 5, 'schedulingMode': 'dependencies', 'tasks': [{'id': 'A', 'name': 'Tâche', 'duration': 1, 'progress': 0, 'dependencies': [], 'isMilestone': False, 'status': 'À faire', 'description': 'Texte conservé', 'checklist': [], 'risks': []}]}
                body = {'revision': 0, 'project': project}
                check(request('PUT', body)[0] == 403, 'CSRF absent refused')
                check(request('PUT', body, token, origin_header='https://other.invalid')[0] == 403, 'foreign origin refused')
                check(request('PUT', token=token, raw=b'{')[0] == 422, 'invalid JSON refused')
                check(request('PUT', token=token, raw=b' ' * (5*1024*1024+1))[0] == 413, 'oversized body refused')
                status, saved, _ = request('PUT', body, token)
                check(status == 200 and saved['revision'] == 1, 'first save acknowledged')
                check(request()[1]['project'] == project, 'full data recovered in independent request')
                check(request('PUT', body, token)[0] == 409, 'stale revision refused')
                invalid = json.loads(json.dumps(project)); invalid['tasks'][0]['dependencies'] = ['A']
                check(request('PUT', {'revision': 1, 'project': invalid}, token)[0] == 422, 'cycle refused')
                check(request()[1]['project'] == project, 'invalid write preserves data')
                changed = dict(project, name='Version deux')
                check(request('PUT', {'revision': 1, 'project': changed}, token)[1]['revision'] == 2, 'next revision saved')
                previous = request(path='?version=previous')[1]
                check(previous['project'] == project and previous['revision'] == 1, 'previous complete copy recoverable')
                check(request('PUT', {'revision': 2, 'project': previous['project']}, token)[1]['revision'] == 3, 'restore produces new revision')
                check(request('DELETE', token=token)[0] == 405, 'delete unsupported')
                check(request(user='2', path='?version=previous')[0] == 403, 'backups protected')
                from workspace_http import verify
                verify(request, check, token, project, private)
                before = (private / 'current.json').read_bytes()
                (private / 'current.json').write_text('{broken', encoding='utf-8')
                check(request()[0] == 503, 'corrupt storage fails closed')
                check(request('PUT', {'revision': 3, 'project': project}, token)[0] == 503, 'corrupt storage not overwritten')
                (private / 'current.json').write_bytes(before)
                check(request()[1]['project'] == project, 'copy restored byte for byte')
                settings.write_text("<?php return ['owner_connect_id'=>'1','directory'=>" + php_string(public) + ",'origin'=>" + php_string(origin) + "];", encoding='utf-8')
                check(request()[0] == 503, 'public storage refused')
                print(json.dumps({'status': 'passed', 'checks': checks, 'scope': 'isolated HTTP / synthetic identities / private files'}))
            finally:
                process.terminate(); process.wait(timeout=10)

if __name__ == '__main__': run()
