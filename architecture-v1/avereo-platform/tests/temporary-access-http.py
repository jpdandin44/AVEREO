"""Exercise real gateway exchanges/cookies over isolated local HTTP; no identity or mail service."""
import base64
import hashlib
import hmac
import http.client
import json
import os
from pathlib import Path
import secrets
import socket
import subprocess
import tempfile
import time
import urllib.parse

ROOT = Path(__file__).resolve().parents[3]
APPS = ['rapport', 'rga', 'coupe', 'projet', 'thermo', 'drone', 'passeport-immo', 'recherche']
KEY = b'isolated-local-http-test-key-only-42'
ROUTER = r'''<?php
declare(strict_types=1);
if (getenv('TEMPORARY_GATE_HTTP_TEST') !== 'isolated-local'
    || ($_SERVER['REMOTE_ADDR'] ?? '') !== '127.0.0.1') {http_response_code(403);exit;}
$root=getenv('AVEREO_REPO_ROOT').'/architecture-v1';
$app=explode('/',trim(parse_url($_SERVER['REQUEST_URI'],PHP_URL_PATH),'/'))[0];
if (in_array($app,['projet','thermo','drone','recherche'],true)) {
    define('AVEREO_GATE_APP',$app);require $root.'/avereo-platform/shared/connect-gate.php';
} elseif (in_array($app,['rapport','coupe'],true)) {
    require $root.'/avereo-app-'.$app.'/frontend/public/connect/gate.php';
} elseif ($app==='rga') {
    define('AVEREO_GATE_APP',$app);require getenv('TEMPORARY_GATE_DIR').'/rga-gate.php';
} elseif ($app==='passeport-immo') {
    define('AVEREO_GATE_APP',$app);require $root.'/avereo-app-passeport-immo/frontend/public/connect/session.php';
} else {http_response_code(404);return;}
$config=['environment'=>'local','connect_launch_secret'=>'isolated-local-http-test-key-only-42',
    'connect_gate_cookie'=>'HTTP_TEST','connect_gate_session_seconds'=>1800,'connect_launch_max_seconds'=>300,
    'connect_launch_nonce_directory'=>getenv('TEMPORARY_GATE_DIR').'/nonces',
    'connect_trial_access_file'=>getenv('TEMPORARY_GATE_POLICY')];
try {
    if (isset($_GET['ticket'])) {
        if ($app==='passeport-immo') passeport_exchange($config,$_GET['ticket']);
        else avereo_gate_exchange_ticket($config,$_GET['ticket']);
    } else {
        $valid=$app==='passeport-immo' ? (bool)passeport_session($config) : avereo_gate_cookie_is_valid($config);
        if (!$valid) throw new RuntimeException('Denied');
    }
    header('Content-Type: application/json');echo '{"authorized":true}';
} catch (Throwable) {http_response_code(401);echo '{"authorized":false}';}
'''

def b64(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=')

def ticket(app, subject='42'):
    now = int(time.time())
    body = b64(json.dumps({'v':1,'app':app,'iat':now,'exp':now+90,'nonce':secrets.token_urlsafe(24),
                          'identity':{'provider':'avereo_connect','id':subject}}).encode())
    return (body+b'.'+b64(hmac.new(KEY,body,hashlib.sha256).digest())).decode()

with tempfile.TemporaryDirectory(prefix='avereo-temporary-http-') as temp:
    folder=Path(temp)
    (folder/'public').mkdir()
    (folder/'router.php').write_text(ROUTER,encoding='utf-8')
    rga=(ROOT/'architecture-v1/avereo-app-rapport/frontend/public/connect/gate.php').read_text(encoding='utf-8')
    assert rga.count("const AVEREO_GATE_APP = 'rapport';")==1
    (folder/'rga-gate.php').write_text(rga.replace("const AVEREO_GATE_APP = 'rapport';",''),encoding='utf-8')
    with socket.socket() as probe:
        probe.bind(('127.0.0.1',0));port=probe.getsockname()[1]
    env=os.environ|{'TEMPORARY_GATE_HTTP_TEST':'isolated-local','TEMPORARY_GATE_DIR':temp,'TEMPORARY_GATE_POLICY':str(folder/'policy.json'),'AVEREO_REPO_ROOT':str(ROOT)}
    log=open(folder/'server.log','w',encoding='utf-8')
    process=subprocess.Popen(['php','-S',f'127.0.0.1:{port}','-t',str(folder/'public'),str(folder/'router.php')],env=env,stdout=log,stderr=log)
    def request(path,cookie=None):
        connection=http.client.HTTPConnection('127.0.0.1',port,timeout=5)
        try:
            connection.request('GET',path,headers={} if cookie is None else {'Cookie':cookie})
            response=connection.getresponse();data=response.read()
            return response.status,response.getheader('Set-Cookie'),data
        finally: connection.close()
    checks=[]
    try:
        for attempt in range(40):
            try: request('/ready');break
            except OSError: time.sleep(.05)
        else: raise RuntimeError('Local gateway test did not start')
        for app in APPS:
            now=int(time.time())
            rule={'status':'active','not_before':now-10,'not_after':now+3600,'sessions_revoked_at':0,'applications':[app]}
            def policy(change=None):
                (folder/'policy.json').write_text(json.dumps({'version':1,'accounts':{'42':rule| (change or {}),'43':rule}}),encoding='utf-8')
            policy()
            issued=ticket(app)
            status,header,_=request('/'+app+'/entry?ticket='+urllib.parse.quote(issued))
            assert status==200 and header,(app,'exchange',status)
            cookie=header.split(';')[0]
            raw=urllib.parse.unquote(cookie.split('=',1)[1]);body,signature=raw.split('.')
            assert hmac.compare_digest(b64(hmac.new(KEY,body.encode(),hashlib.sha256).digest()).decode(),signature)
            payload=json.loads(base64.urlsafe_b64decode(body+'='*(-len(body)%4)))
            assert payload['identity']=={'provider':'avereo_connect','id':'42'},(app,'cookie identity lost')
            assert request('/'+app+'/session',cookie)[0]==200
            assert request('/'+app+'/entry?ticket='+urllib.parse.quote(issued))[0]==401
            for label,change in [('expiry',{'not_after':now-1}),('future',{'not_before':now+60}),('revocation',{'applications':[]})]:
                policy(change)
                assert request('/'+app+'/session',cookie)[0]==401,(app,label,'existing cookie')
                assert request('/'+app+'/entry?ticket='+urllib.parse.quote(ticket(app)))[0]==401,(app,label,'new ticket')
                assert request('/'+app+'/entry?ticket='+urllib.parse.quote(ticket(app,'43')))[0]==200,(app,label,'other account')
            policy({'not_before':0,'not_after':9223372036854775807})
            assert request('/'+app+'/session',cookie)[0]==200
            checks.append({'application':app,'exchangeCookieIdentityReplay':'passed','expiryFutureRevocation':'passed','otherAccountIsolation':'passed','permanent':'passed'})
        print(json.dumps({'httpGatewayChecks':checks,'externalServices':False}))
    finally:
        process.terminate();process.wait(timeout=10);log.close()
