"""Recette Apache/PHP isolée du sas, sans utilisateur, base ou secret réel."""
import json
import http.client
import hashlib
import secrets
import shutil
import subprocess
import tempfile
import time
import uuid
from pathlib import Path
from http.cookies import SimpleCookie

APP = Path(__file__).resolve().parents[1]
IMAGE = 'avereo-passeport-connect-test:local'


def command(*args):
    return subprocess.check_output(args, text=True, stderr=subprocess.STDOUT).strip()


def run():
    assert (APP/'frontend/dist/index.php').exists(), 'Construire le candidat avant la recette.'
    name = 'passeport-gate-test-'+uuid.uuid4().hex[:10]
    with tempfile.TemporaryDirectory(prefix='passeport-http-') as temporary:
        root = Path(temporary).resolve()
        public = root/'public'
        shutil.copytree(APP/'frontend/dist', public)
        secret = secrets.token_hex(32)
        (root/'config.php').write_text("<?php return [\n"
            "'environment'=>'local', 'connect_portal_url'=>'https://connect-preprod.avereo.fr/',\n"
            f"'connect_launch_secret'=>'{secret}', 'connect_launch_nonce_directory'=>'/tmp/passeport-test-nonces',\n"
            "'connect_gate_cookie'=>'PASSEPORT_TEST', 'connect_gate_session_seconds'=>1800];\n", encoding='utf-8')
        container = command('docker','run','--detach','--rm','--name',name,
            '--publish','127.0.0.1::80','--mount',f'type=bind,source={public},target=/var/www/html,readonly',
            '--mount',f'type=bind,source={root}/config.php,target=/fixture/config.php,readonly',
            '--env','AVEREO_CONFIG_FILE=/fixture/config.php',IMAGE)
        try:
            port = int(command('docker','port',container,'80/tcp').rsplit(':',1)[1])
            def request(path, cookie=None, method='GET'):
                connection = http.client.HTTPConnection('127.0.0.1',port,timeout=5)
                connection.request(method,path,headers={'Cookie':cookie} if cookie else {})
                response = connection.getresponse()
                result = response.status, dict(response.getheaders()), response.read()
                connection.close()
                return result
            for _ in range(40):
                try: request('/'); break
                except (ConnectionError,OSError): time.sleep(0.25)
            checks = 0
            for path in ['/', '/index.html', '/bien/fictif']:
                status, headers, _ = request(path)
                assert status == 303, (path,status)
                assert headers['Location'] == 'https://connect-preprod.avereo.fr/?app=passeport-immo'
                assert 'WWW-Authenticate' not in headers
                checks += 1
            for path in ['/connect/entry.php','/connect/entry.php?ticket=invalid']:
                assert request(path)[0] == 403
                checks += 1
            assets = sorted('/'+p.relative_to(public).as_posix()
                for p in (public/'assets').rglob('*') if p.is_file())
            assert assets
            for path in assets:
                status, headers, _ = request(path)
                assert status == 403 and 'WWW-Authenticate' not in headers, (path,status)
                checks += 1
            ticket_script = root/'ticket.php'
            ticket_script.write_text("<?php\n"
                f"require {json.dumps(str(APP.parents[0]/'avereo-app-connect/backend/src/autoload.php'))};\n"
                "putenv('APP_LAUNCH_PASSEPORT_IMMO_URL=https://passeport-immo-preprod.avereo.fr/connect/entry.php');\n"
                f"putenv('APP_LAUNCH_PASSEPORT_IMMO_SECRET={secret}');\n"
                "$issuer=new Avereo\\Connect\\Security\\AppLaunchTicketIssuer(Avereo\\Connect\\Config::fromEnvironment());\n"
                "parse_str(parse_url($issuer->issueLocation('passeport-immo',42,true),PHP_URL_QUERY),$query);\n"
                "echo $query['ticket'];\n",encoding='utf-8')
            ticket = command('php',str(ticket_script))
            status, headers, _ = request('/connect/entry.php?ticket='+ticket)
            assert status == 303 and headers['Location'] == '/'
            cookie = SimpleCookie(headers['Set-Cookie'])['PASSEPORT_TEST']
            assert cookie['secure'] and cookie['httponly'] and cookie['samesite'] == 'Lax'
            checks += 1
            value = 'PASSEPORT_TEST='+cookie.value
            for path in assets:
                status, headers, body = request(path,value)
                expected = (public/path.lstrip('/')).read_bytes()
                assert status == 200 and hashlib.sha256(body).digest() == hashlib.sha256(expected).digest()
                assert headers['Content-Type'].startswith('text/css' if path.endswith('.css') else 'text/javascript')
                assert headers['X-Content-Type-Options'] == 'nosniff'
                assert 'no-store' in headers['Cache-Control'] and 'WWW-Authenticate' not in headers
                assert request(path,value+'invalid')[0] == 403
                head_status, head_headers, head_body = request(path,value,method='HEAD')
                assert head_status == 200 and head_body == b'' and int(head_headers['Content-Length']) == len(expected)
                checks += 3
            (public/'assets/private.php').write_text('<?php echo "must-not-execute";',encoding='utf-8')
            for path in ['/assets/private.php','/assets/missing.js','/assets/index.js.map',
                         '/assets/%252e%252e/config.js','/assets/no%00.js']:
                assert request(path,value)[0] == 404, path
                checks += 1
            for path in ['/connect/gate.php','/connect/entry.php/extra','/connect/unknown.php']:
                for session in [None,value]:
                    assert request(path,session)[0] == 403, path
                    checks += 1
            for path in ['/',assets[0]]:
                status, headers, _ = request(path,value,method='POST')
                assert status == 405 and headers['Allow'] == 'GET, HEAD'
                checks += 1
            for path in ['/', '/index.html', '/bien/fictif']:
                status, _, body = request(path,value)
                assert status == 200 and 'AVEREO'.encode() in body and b'/connect/logout.php' in body
                checks += 1
            assert request('/connect/entry.php?ticket='+ticket)[0] == 403
            checks += 1
            assert request('/',value+'invalid')[0] == 303
            checks += 1
            status, headers, _ = request('/connect/logout.php',value)
            assert status == 303 and headers['Location'] == 'https://connect-preprod.avereo.fr/?logout=1'
            assert 'expires=' in headers['Set-Cookie'].lower()
            checks += 1
            original_policy = (public/'.htaccess').read_bytes()
            (public/'.htaccess').write_bytes((APP/'workflows/preproduction.htaccess').read_bytes())
            for path in ['/', '/index.html', '/connect/entry.php?ticket='+ticket, *assets]:
                assert request(path,value)[0] == 403
                checks += 1
            (public/'.htaccess').write_bytes(original_policy)
            command('docker','exec',container,'a2dismod','rewrite')
            command('docker','exec',container,'apache2ctl','-k','graceful')
            time.sleep(0.5)
            for path in ['/', '/index.html', '/bien/fictif', *assets]:
                assert request(path,value)[0] == 403
                checks += 1
            print(json.dumps({'assertions':checks,'apache':'passed','issuer':'real_connect_component',
                'initialClosure':'passed','hostedRecipe':False},ensure_ascii=False))
        finally:
            # Only remove this test's container; the original applications are untouched.
            subprocess.run(['docker','stop',container],check=True,stdout=subprocess.DEVNULL)


if __name__ == '__main__':
    run()
