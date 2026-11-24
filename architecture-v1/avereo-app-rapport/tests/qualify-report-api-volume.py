"""Opt-in exact-byte boundary check against report-files-http.py --volume --serve.

Local disposable fixture only; never use hosted credentials or customer data.
"""
import argparse
import hashlib
import http.cookiejar
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--origin', default='http://127.0.0.1:5230')
parser.add_argument('--receipt', type=Path, required=True)
args = parser.parse_args()
origin = args.origin.rstrip('/')
parsed = urllib.parse.urlparse(origin)
assert parsed.scheme == 'http' and parsed.hostname == '127.0.0.1' and parsed.path == '', 'Disposable loopback fixture required'
jar = http.cookiejar.CookieJar()
client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
checks = []


def call(path, method='GET', body=None):
    headers = {'Origin': origin, 'Sec-Fetch-Site': 'same-origin'}
    if body is not None:
        headers['Content-Type'] = 'application/json'
    started = time.monotonic()
    try:
        response = client.open(urllib.request.Request(origin + path, data=body, headers=headers, method=method), timeout=150)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.read(), round(time.monotonic() - started, 3)


def enter():
    status, page, _ = call('/fixture/')
    assert status == 200 and b'Dossiers complets' in page, 'Signed fictitious fixture portal required'
    match = re.search(rb'href="([^"]+)">Compte fictif A</a>', page)
    assert match, 'Fictitious account A missing'
    # Launch URL stays in process memory and is never included in output or receipt.
    status, _, _ = call(match.group(1).decode('ascii'))
    assert status == 200, 'Local fixture authentication failed'


enter()
report = {'titre': 'Seuil fictif exact', 'categorie': 'Visite Globale', 'observations': [], 'emptyObject': {}, 'emptyList': [], 'padding': ''}
base = json.dumps(report, ensure_ascii=False, separators=(',', ':')).encode()
report['padding'] = 'x' * (100_000_000 - len(base))
payload = json.dumps(report, ensure_ascii=False, separators=(',', ':')).encode()
assert len(payload) == 100_000_000
envelope = b'{"report":' + payload + b'}'
report_id = None
try:
    status, saved, seconds = call('/api/reports.php', 'POST', envelope)
    assert status == 200, 'Exact 100 Mo save refused: ' + str(status)
    ack = json.loads(saved)
    report_id = ack['report']['id']
    checks.append({'case': '100000000-byte JSON saved', 'status': status, 'seconds': seconds})
    del report, base, envelope
    jar.clear()
    enter()
    status, raw, seconds = call('/api/reports.php?id=' + report_id + '&download=1')
    digest = hashlib.sha256(payload).hexdigest()
    assert status == 200 and len(raw) == len(payload) and hashlib.sha256(raw).hexdigest() == digest
    assert b'"emptyObject":{}' in raw and b'"emptyList":[]' in raw
    del raw
    checks.append({'case': 'independent session downloads exact JSON and object/list types', 'status': status, 'seconds': seconds})
    oversized = payload[:-2] + b'x' + payload[-2:]
    assert len(oversized) == 100_000_001
    update = b'{"id":' + json.dumps(report_id).encode() + b',"report":' + oversized + b'}'
    status, error, seconds = call('/api/reports.php', 'POST', update)
    assert status == 413 and json.loads(error)['error'] == 'report_payload_too_large'
    checks.append({'case': '100000001-byte JSON refused', 'status': status, 'seconds': seconds})
    del oversized, update, payload
    status, raw, _ = call('/api/reports.php?id=' + report_id + '&download=1')
    assert status == 200 and hashlib.sha256(raw).hexdigest() == digest
    checks.append({'case': 'refusal preserves the previously saved source exactly', 'status': status})
finally:
    if report_id:
        status, _, _ = call('/api/reports.php?id=' + report_id, 'DELETE')
        assert status == 200, 'Disposable boundary row cleanup failed'
receipt = {'status': 'passed', 'scope': 'Local disposable PHP/MariaDB HTTP fixture; not hosted CONNECT or browser UI', 'checks': checks, 'fixtureOnly': True, 'hostingChanged': False}
args.receipt.parent.mkdir(parents=True, exist_ok=True)
args.receipt.write_text(json.dumps(receipt, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'status': receipt['status'], 'checks': len(checks), 'hostingChanged': False}))
