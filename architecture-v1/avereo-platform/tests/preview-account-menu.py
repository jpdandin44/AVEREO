"""Read-only local UI preview. CONNECT identity is fictitious; no mutation API exists."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse, json, re, threading, urllib.parse

ROOT = Path(__file__).resolve().parents[3]
APPS = ['projet', 'rapport', 'coupe', 'thermo', 'drone', 'recherche', 'passeport-immo', 'connect']

class Preview(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_GET(self):
        route = urllib.parse.urlsplit(self.path).path
        if self.server.app_name == 'rapport' and route.startswith('/api/'):
            query = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query)
            fixtures = {
                ('/api/auth.php', 'config'): {'ok': True, 'auth': {'mode': 'connect_gateway', 'configured': True}},
                ('/api/auth.php', 'me'): {'ok': True, 'user': {'name': 'Compte fictif de revue', 'email': 'fixture@example.invalid'}},
                ('/api/reports.php', ''): {'ok': True, 'reports': []},
            }
            payload = fixtures.get((route, query.get('action', [''])[0]))
            if payload is None:
                self.send_error(404, 'No fixture for this action'); return
            data = json.dumps(payload).encode()
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(data); return
        if self.server.app_name == 'connect' and route.startswith('/api/'):
            fixtures = {
                '/api/v1/session': {'authenticated': True, 'approved': True, 'csrfToken': 'fixture-only'},
                '/api/v1/catalog': [],
                '/api/v1/me': {'displayName': 'Compte fictif de revue', 'email': 'fixture@example.invalid'},
                '/api/v1/organizations': [{'id': 1, 'name': 'Organisation fictive', 'role': 'owner'}],
            }
            if route not in fixtures:
                self.send_error(404, 'No fixture for this action'); return
            data = json.dumps({'data': fixtures[route]}).encode()
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers(); self.wfile.write(data); return
        filename = Path(self.translate_path(self.path))
        if filename.is_dir(): filename /= 'index.php' if route.startswith('/rga') else 'index.html'
        if filename.suffix in {'.html', '.php'} and filename.is_file():
            if filename.suffix == '.php' and filename.name not in {'carte.php', 'index.php'}:
                self.send_error(404, 'PHP is not executed by this UI preview'); return
            text = filename.read_text(encoding='utf-8-sig')
            # Strip only presentation PHP from the RGA preview; no gate or private config is executed.
            text = re.sub(r'<\?php require __DIR__.*?\?>', '', text)
            text = re.sub(r'<meta name="avereo-connect-portal"[^>]*?\?>">', '', text)
            text = text.replace('</head>', '<meta name="avereo-connect-portal" content="https://connect-preprod.avereo.fr"></head>')
            self.send_response(200); self.send_header('Content-Type', 'text/html; charset=utf-8'); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(text.encode()); return
        if filename.suffix == '.php': self.send_error(404); return
        super().do_GET()

    def list_directory(self, path):
        self.send_error(404)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=52960)
    args = parser.parse_args()
    servers = []
    try:
        for index, app in enumerate(APPS):
            directory = ROOT / ('architecture-v1/avereo-app-' + app) / ('backend/public' if app == 'connect' else 'frontend/dist')
            if not (directory / 'index.html').is_file(): raise ValueError('Build missing: ' + str(directory))
            server = ThreadingHTTPServer(('127.0.0.1', args.port + index), partial(Preview, directory=str(directory)))
            server.app_name = app; servers.append(server)
            threading.Thread(target=server.serve_forever, daemon=True).start()
            print(f'{app}: http://127.0.0.1:{args.port + index}/', flush=True)
        threading.Event().wait()
    except KeyboardInterrupt:
        pass
    finally:
        for server in servers: server.shutdown(); server.server_close()

if __name__ == '__main__': main()
