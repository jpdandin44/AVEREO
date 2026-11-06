"""Real Drupal first-password/login forms in a disposable localhost fixture only.

The dedicated container must contain Drupal 11.4.10, Drush and the current bridge.
No email is sent: the native test collector captures every message.
"""
import hashlib
import hmac
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import subprocess
import time
from html.parser import HTMLParser
from urllib.error import HTTPError
from urllib.parse import urlencode, urlsplit, parse_qs
from urllib.request import Request, build_opener, HTTPCookieProcessor, HTTPRedirectHandler

BASE = 'http://127.0.0.1:8094'
CONTAINER = 'codex-connect-first-login-20261106'
assert os.environ.get('AVEREO_FIRST_LOGIN_LOCAL') == '1'
SECRET = b'first-login-local-fixture-' * 2
RETURN = 'https://connect.example.invalid/?logout=1'
checks = []


class LocalRedirects(HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, msg, headers, newurl):
        if not newurl.startswith(BASE + '/'):
            return None  # Inspect the signed CONNECT redirect; never contact another host.
        return super().redirect_request(request, fp, code, msg, headers, newurl)


class Form(HTMLParser):
    def __init__(self):
        super().__init__()
        self.fields = {}

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'input' and attrs.get('name') and attrs.get('type') == 'hidden':
            self.fields[attrs['name']] = attrs.get('value', '')


def verify(value, label):
    assert value, label
    checks.append(label)


def fixture(action):
    data = subprocess.check_output(['docker', 'exec', '-e', 'AVEREO_FIRST_LOGIN_LOCAL=1',
        '-e', 'AVEREO_FIRST_LOGIN_ACTION=' + action, CONTAINER, '/opt/drupal/vendor/bin/drush',
        '--uri=' + BASE, 'php:script', '/tmp/first-login-fixture.php'], text=True, encoding='utf-8')
    return json.loads(data)


def call(browser, path, fields=None, headers=None):
    url = path if path.startswith(BASE + '/') else BASE + path
    assert url.startswith(BASE + '/')
    data = None if fields is None else urlencode(fields).encode()
    try:
        return browser.open(Request(url, data=data, headers=headers or {}), timeout=15)
    except HTTPError as error:
        return error


def sign(payload):
    return hmac.new(SECRET, payload.encode(), hashlib.sha256).hexdigest()


def login(browser, email, password):
    page = call(browser, '/user/login').read().decode()
    form = Form(); form.feed(page)
    form.fields.update(name=email, **{'pass': password, 'op': 'Log in'})
    response = call(browser, '/user/login', form.fields)
    response.read()
    return response


script = Path(__file__).with_name('first-login-fixture.php')
subprocess.run(['docker', 'cp', str(script), CONTAINER + ':/tmp/first-login-fixture.php'], check=True)
prepared = fixture('prepare')
for number, (case, password) in enumerate([
    ('fresh', 'Fixture-First-2026-Only'), ('previous-session', 'Fixture-Été-2026-Only')], 1):
    account = prepared['accounts'][case]
    cookies = http.cookiejar.CookieJar()
    browser = build_opener(LocalRedirects(), HTTPCookieProcessor(cookies))
    if case == 'previous-session':
        old = prepared['accounts']['old-identity']
        response = login(browser, old['email'], 'Fixture-Previous-2026-Only')
        verify(urlsplit(response.url).path == '/user/' + str(old['uid']), 'old identity is initially authenticated')
    payload = json.dumps({'version': 1, 'subject': str(account['uid']), 'connectUserId': 700 + number,
        'email': account['email'], 'displayName': 'First login fixture', 'expiresInSeconds': 86400}, separators=(',', ':'))
    at = str(int(time.time())); nonce = secrets.token_urlsafe(24)
    headers = {'Content-Type': 'application/json', 'X-AVEREO-Issued-At': at, 'X-AVEREO-Nonce': nonce,
        'X-AVEREO-Signature': sign(at + '\n' + nonce + '\n' + hashlib.sha256(payload.encode()).hexdigest())}
    response = browser.open(Request(BASE + '/avereo/account/activation', data=payload.encode(), headers=headers), timeout=15)
    verify(json.load(response)['status'] == 'sent', case + ': invitation accepted')
    mail = fixture('mail')
    verify(mail['count'] == number, case + ': exactly one email per invitation')
    page = call(browser, mail['lastActivationLink']).read().decode()
    verify('Nouveau mot de passe' in page and 'Confirmer le mot de passe' in page, case + ': dedicated password form')
    form = Form(); form.feed(page)
    form.fields.update(password=password, confirm_password=password, op='Définir mon mot de passe')
    response = call(browser, '/avereo/account/password', form.fields)
    page = response.read().decode()
    verify(urlsplit(response.url).path == '/avereo/account/ready' and 'Continuer vers AVEREO CONNECT' in page,
        case + ': first password accepted without a reset')
    response = call(browser, '/avereo/account/ready?continue=1')
    query = {key: values[0] for key, values in parse_qs(urlsplit(response.headers.get('Location', '')).query).items()}
    verify(response.code == 303 and query.get('user_id') == str(700 + number)
        and query.get('signature') == sign(query['iat'] + '\n' + query['nonce'] + '\n' + query['user_id']),
        case + ': signed completion targets the invited CONNECT account')
    # The CONNECT Application regression tests exercise completion and its signed logout URL.
    # Here the actual Drupal logout controller is exercised with that same signature contract.
    at = str(int(time.time())); nonce = secrets.token_urlsafe(24)
    logout = urlencode({'iat': at, 'nonce': nonce, 'return': RETURN, 'signature': sign(at + '\n' + nonce + '\n' + RETURN)})
    response = call(browser, '/avereo/session/logout?' + logout)
    verify(response.code == 303 and response.headers.get('Location') == RETURN, case + ': native signed logout succeeds')
    response = login(browser, account['email'], password)
    verify(response.code == 200 and urlsplit(response.url).path == '/user/' + str(account['uid']),
        case + ': same first password authenticates the invited account by email')
    verify(call(browser, mail['lastActivationLink']).code == 410, case + ': invitation cannot be replayed')

print(json.dumps({'passed': len(checks), 'drupal': prepared['drupal'], 'checks': checks,
    'scope': 'local real Drupal forms and logout; CONNECT completion tested separately; no hosted or OAuth end-to-end claim'}, ensure_ascii=False))
