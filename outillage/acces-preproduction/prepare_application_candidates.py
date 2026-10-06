"""Inventory and package one clean Git reference locally. No remote writes.

Optional anonymous HTTP observations never follow redirects or send credentials.
The archives are candidates: hosted access overlays and recovery remain required.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import subprocess
import urllib.error
import urllib.parse
import urllib.request
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

APPS = ('connect', 'rapport', 'coupe', 'projet', 'thermo', 'drone', 'recherche', 'passeport-immo')


def digest(data):
    return hashlib.sha256(data).hexdigest()


def code_files(folder):
    result = {}
    for path in sorted(folder.rglob('*')):
        if path.is_symlink():
            raise ValueError('Lien symbolique dans le candidat : ' + str(path))
        if not path.is_file():
            continue
        if path.name == '.gitkeep':
            continue
        name = path.relative_to(folder).as_posix()
        if any(part.startswith('.') and part != '.htaccess' for part in Path(name).parts):
            raise ValueError('Fichier privé ou caché dans le candidat : ' + name)
        if path.suffix in ('.log', '.zip') or path.name == 'config.php':
            raise ValueError('Fichier non livrable : ' + name)
        result[name] = path.read_bytes()
    if not result:
        raise ValueError('Candidat vide : ' + str(folder))
    return result


def pack(path, files):
    with ZipFile(path, 'w', compression=ZIP_DEFLATED) as archive:
        for name, content in sorted(files.items()):
            info = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.create_system = 3
            info.external_attr = 0o100644 << 16
            info.compress_type = ZIP_DEFLATED
            archive.writestr(info, content)
    with ZipFile(path) as archive:
        if archive.testzip() or sorted(archive.namelist()) != sorted(files):
            raise ValueError('Archive non conforme.')
        for name, content in files.items():
            if archive.read(name) != content:
                raise ValueError('Contenu non conforme : ' + name)


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, request, fp, code, message, headers, url):
        return None


def observe(url, content=False):
    opener = urllib.request.build_opener(NoRedirect)
    result = {'url': url, 'observed_at': datetime.now(timezone.utc).isoformat(timespec='milliseconds')}
    try:
        try:
            response = opener.open(urllib.request.Request(url, headers={'User-Agent': 'AVEREO-preproduction-audit', 'Accept-Encoding': 'identity'}), timeout=10)
        except urllib.error.HTTPError as error:
            response = error
        result['status'] = response.code
        location = response.headers.get('Location', '')
        if location:
            parsed = urllib.parse.urlsplit(urllib.parse.urljoin(url, location))
            result['redirect_origin_path'] = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, '', ''))
        result['basic_challenge'] = response.headers.get('WWW-Authenticate', '').lower().startswith('basic ')
        data = response.read(2_000_001) if content and response.code == 200 else b''
        response.close()
        if len(data) > 2_000_000:
            raise ValueError('Ressource trop volumineuse.')
        if data:
            result['sha256'] = digest(data)
        return result, data
    except (OSError, ValueError) as error:
        result['status'] = None
        result['error_type'] = type(error).__name__
        return result, b''


def observe_app(app):
    origin = 'https://' + app + '-preprod.avereo.fr'
    https, _ = observe(origin + '/')
    http, _ = observe('http://' + app + '-preprod.avereo.fr/')
    index, body = observe(origin + '/index.html', content=True)
    assets = []
    if body:
        for name in re.findall(rb'(?:src|href)=["\x27](/?assets/[^"\x27]+\.(?:js|css))', body):
            path = name.decode('ascii')
            if '..' in path or '?' in path or '#' in path:
                continue
            receipt, data = observe(origin + '/' + path.lstrip('/'), content=True)
            receipt['path'] = path.lstrip('/')
            if app == 'rapport' and path.endswith('.js'):
                receipt['visite_globale_present'] = b'Visite Globale' in data
                receipt['habitologie_present'] = b'habitologie' in data
            assets.append(receipt)
    row = {'app': app, 'root_https': https, 'root_http': http, 'index': index, 'assets': assets,
           'authenticated_journey_verified': False, 'server_configuration_verified': False}
    if app in ('rapport', 'coupe', 'projet', 'thermo', 'drone', 'recherche'):
        row['entry_without_ticket'], _ = observe(origin + '/connect/entry.php')
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, required=True)
    parser.add_argument('--expected-sha', required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--observe-http', action='store_true')
    args = parser.parse_args()
    source = args.source.resolve()
    sha = subprocess.check_output(['git', '-C', str(source), 'rev-parse', 'HEAD'], text=True).strip()
    if not re.fullmatch('[0-9a-f]{40}', args.expected_sha) or sha != args.expected_sha:
        raise ValueError('La source ne correspond pas à la référence demandée.')
    if subprocess.check_output(['git', '-C', str(source), 'status', '--porcelain'], text=True).strip():
        raise ValueError('La source contient des modifications non versionnées.')
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    manifest = {'source_sha': sha, 'prepared_at': datetime.now(timezone.utc).isoformat(timespec='milliseconds'),
                'applications': [], 'remote_writes': False, 'production_modified': False}
    for app in APPS:
        base = source / 'architecture-v1' / ('avereo-app-' + app)
        if app == 'connect':
            files = {}
            for name in ('public', 'src', 'bin'):
                files.update({name + '/' + path: data for path, data in code_files(base / 'backend' / name).items()})
            files.update({'database/' + path: data for path, data in code_files(base / 'database').items()})
        else:
            files = code_files(base / 'frontend' / 'dist')
        if app == 'passeport-immo':
            files['.htaccess'] = (base / 'workflows' / 'preproduction.htaccess').read_bytes()
            if b'Require all denied' not in files['.htaccess']:
                raise ValueError('Passeport Immo doit rester fermé.')
        archive = output / (app + '.zip')
        pack(archive, files)
        manifest['applications'].append({
            'app': app, 'source_sha': sha, 'archive': archive.name,
            'artifact_sha256': digest(archive.read_bytes()),
            'build_mode': 'closed' if app == 'passeport-immo' else 'prebuilt',
            'build_environment_verified_by_tool': False,
            'hosted_access_overlay_required': app != 'passeport-immo',
            'deployment_authorized': False,
            'files': {name: {'sha256': digest(data), 'sha256_lf': digest(data.replace(b'\r\n', b'\n')), 'bytes': len(data)}
                      for name, data in sorted(files.items())},
        })
    (output / 'candidate-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    if args.observe_http:
        with ThreadPoolExecutor(max_workers=4) as pool:
            observations = list(pool.map(observe_app, APPS))
        (output / 'http-observations.json').write_text(json.dumps(observations, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'source_sha': sha, 'candidates': len(manifest['applications']), 'output': str(output), 'remote_writes': False}))


if __name__ == '__main__':
    main()
