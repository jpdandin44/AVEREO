"""Préparer le paquet Missions et répéter sa restauration sur des copies privées."""
import argparse
import json
import os
import re
import subprocess
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from zipfile import ZipFile

from prepare_application_candidates import digest, pack
from prepare_shared_menu import TARGETS, recover_files
from release_selected_preprod import declared_root, require, safe_name

APPS = ('connect', 'projet', 'rapport', 'coupe', 'thermo', 'drone', 'passeport-immo')
REPORT_APPS = ('rapport', 'thermo', 'drone', 'passeport-immo')
ROOT = Path(__file__).resolve().parents[2]
BASE = '1d483e8419f16bd34fc4809cc2e72a9065a6a2a7'
OLD_PAYLOAD = '14e1983cc97e113d4238e0f3ffb1f2fc6a2e7d755eeba82dd76a038b45ab359b'


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))


def write_json(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def allowed(app, rel):
    safe_name(rel)
    if rel in ('account-menu.js', 'assets/missions.js'):
        return app in APPS
    if app == 'passeport-immo' and re.fullmatch(r'assets/pdf\.worker\.min-[\w-]+\.mjs', rel):
        return True
    if app in REPORT_APPS:
        return rel == 'index.html' or re.fullmatch(r'assets/[^/]+\.(?:js|css|woff2?)', rel)
    return (app, rel) in (('projet', 'project-workspace.js'), ('coupe', 'legacy-app.html'))


def coupe_overlay(original, source):
    begin = b'    <script id="avereo-mission-context">'
    end = b'    </script>'
    anchor = b'</body>'
    require(source.count(begin) == 1 and original.count(anchor) == 1 and begin not in original,
            'Points d’insertion Coupe différents')
    start = source.index(begin)
    block = source[start:source.index(end, start) + len(end)].replace(b'\r\n', b'\n') + b'\n'
    if b'\r\n' in original:
        block = block.replace(b'\n', b'\r\n')
    after = original.replace(anchor, block + anchor, 1)
    require(after.replace(block, b'', 1) == original, 'Retour arrière Coupe différent')
    return after


def candidate_paths(app, dist):
    names = ['account-menu.js', 'assets/missions.js']
    if app in REPORT_APPS:
        names.append('index.html')
        names.extend(p.relative_to(dist).as_posix() for p in sorted((dist / 'assets').iterdir()) if p.is_file() and p.name != 'missions.js')
    if app == 'projet':
        names.append('project-workspace.js')
    if app == 'coupe':
        names.append('legacy-app.html')
    return names


def rehearse_reference(archive_path, before, rows):
    with tempfile.TemporaryDirectory(dir=archive_path.parent) as temp, ZipFile(archive_path) as archive:
        for row in rows:
            name = row['app'] + '/' + row['path']
            path = Path(temp) / name
            path.parent.mkdir(parents=True, exist_ok=True)
            if name in before:
                path.write_bytes(before[name])
            path.write_bytes(archive.read(name))
            require(digest(path.read_bytes()) == row['afterSha256'], 'Écriture locale différente : ' + name)
            if name in before:
                path.write_bytes(before[name])
                require(digest(path.read_bytes()) == row['beforeSha256'], 'Restauration différente : ' + name)
            else:
                path.unlink()
                require(not path.exists(), 'Fichier ajouté encore présent : ' + name)


def prepare(baseline, output, sha):
    require(subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip() == sha,
            'Version Git inattendue')
    require(not subprocess.check_output(['git', 'status', '--porcelain'], cwd=ROOT).strip(),
            'Le candidat doit être enregistré dans Git')
    require(subprocess.run(['git', 'merge-base', '--is-ancestor', BASE, sha], cwd=ROOT).returncode == 0,
            'Fusion #124 absente')
    proof = read_json(ROOT / 'architecture-v1/avereo-platform/data/recette-missions/qualification.json')
    require(proof['rapportOnlineSync'] is True, 'Recette Rapport en ligne absente')
    previous = baseline / 'selection-menu/payload.zip'
    require(digest(previous.read_bytes()) == OLD_PAYLOAD, 'Paquet de référence #121 différent')
    selection = read_json(baseline / 'selection-menu/selection.json')['applications']
    inventory = read_json(baseline / 'preparation-serveur.json')['applications']
    files, before, rows = {}, {}, []
    with ZipFile(previous) as installed:
        for app in APPS:
            directory = 'backend/public' if app == 'connect' else 'frontend/dist'
            dist = ROOT / 'architecture-v1' / ('avereo-app-' + app) / directory
            with ZipFile(baseline / 'candidats' / (app + '.zip')) as historical:
                for rel in candidate_paths(app, dist):
                    require(allowed(app, rel), 'Fichier hors lot : ' + rel)
                    name = app + '/' + rel
                    old = selection[app]['operations'].get(rel)
                    record = old['after'] if old else inventory[app]['operations'].get(rel, {}).get('before', {})
                    expected = record.get('sha256') if record.get('exists') else None
                    current = (dist / rel).read_bytes()
                    require(proof['files'].get(name) == digest(current), 'Candidat différent des tests : ' + name)
                    if app == 'coupe' and rel == 'legacy-app.html':
                        current = coupe_overlay(installed.read(name), current)
                    if expected == digest(current) or (record.get('exists') and
                            record.get('sha256_lf') == digest(current.replace(b'\r\n', b'\n'))):
                        continue
                    if expected:
                        data = installed.read(name) if name in installed.namelist() else historical.read(rel)
                        require(digest(data) == expected, 'Octets de référence indisponibles : ' + name)
                        before[name] = data
                    files[name] = current
                    rows.append({'app': app, 'path': rel, 'beforeSha256': expected, 'afterSha256': digest(current)})
    require(set(r['app'] for r in rows) == set(APPS), 'Sélection incomplète')
    require(not output.exists(), 'Utiliser un nouveau dossier de sortie')
    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=output.parent) as temp:
        staged = Path(temp) / 'selection'
        staged.mkdir()
        archive = staged / 'payload.zip'
        pack(archive, files)
        rehearse_reference(archive, before, rows)
        manifest = {'sourceCommit': sha, 'merge124': BASE, 'priorPayloadSha256': OLD_PAYLOAD,
                    'artifactSha256': digest(archive.read_bytes()), 'rapportOnlineSync': True,
                    'preparedAt': datetime.now(timezone.utc).isoformat(), 'localRecovery': 'passed_on_reference_copies',
                    'targets': {a: TARGETS[a].as_posix() for a in APPS}, 'files': rows}
        write_json(staged / 'manifest.json', manifest)
        staged.rename(output)
    print(f"{len(rows)} fichiers sur {len(APPS)} cibles. SHA-256 {manifest['artifactSha256']}")


def rehearse_host(work, expected_sha):
    require(work.resolve() == work and work.parent == Path('/home/daje3540/private')
            and work.name.startswith('missions-preprod-') and work.is_dir(), 'Dossier privé inattendu')
    require(not (work / 'recovery').exists() and not (work / 'rehearsal.json').exists(),
            'Préserver la répétition précédente et utiliser un nouveau dossier')
    os.umask(0o077)
    manifest = read_json(work / 'manifest.json')
    require(digest((work / 'payload.zip').read_bytes()) == manifest['artifactSha256'] == expected_sha,
            'Paquet différent du paquet attendu')
    require(manifest['merge124'] == BASE and manifest['targets'] == {a: TARGETS[a].as_posix() for a in APPS},
            'Cibles inattendues')
    rows = manifest['files']
    names = {r['app'] + '/' + r['path'] for r in rows}
    require(len(names) == len(rows) and {r['app'] for r in rows} == set(APPS), 'Inventaire ambigu ou incomplet')
    checks = {}
    with ZipFile(work / 'payload.zip') as archive:
        require(set(archive.namelist()) == names and len(archive.namelist()) == len(names), 'Inventaire ZIP différent')
        for app in APPS:
            root = declared_root(app + '-preprod.avereo.fr')
            require(root == TARGETS[app] and root.resolve() == root, 'Racine inattendue : ' + app)
            subset = {}
            for row in (r for r in rows if r['app'] == app):
                rel = row['path']
                require(allowed(app, rel), 'Fichier hors périmètre : ' + rel)
                target = root / rel
                require(target.resolve() == target and (not target.exists() or target.is_file()), 'Chemin inattendu')
                actual = digest(target.read_bytes()) if target.is_file() else None
                require(actual == row['beforeSha256'], 'Écart hébergé à examiner : ' + app + '/' + rel)
                data = archive.read(app + '/' + rel)
                require(digest(data) == row['afterSha256'], 'Contenu différent : ' + rel)
                subset[rel] = data
            operations = recover_files(root, subset, work / 'recovery' / app)
            for rel, content in subset.items():
                require(operations[rel]['after']['sha256'] == digest(content), 'Répétition différente : ' + rel)
            checks[app] = operations
    write_json(work / 'rehearsal.json', {'observedAt': datetime.now(timezone.utc).isoformat(),
              'sourceCommit': manifest['sourceCommit'], 'artifactSha256': expected_sha,
              'operations': checks, 'liveFilesModified': False})
    print('Sauvegarde et restauration vérifiées sur copies des sept cibles.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_subparsers(dest='mode', required=True)
    local = modes.add_parser('prepare')
    local.add_argument('--baseline', type=Path, required=True)
    local.add_argument('--output', type=Path, required=True)
    local.add_argument('--source', required=True)
    host = modes.add_parser('rehearse')
    host.add_argument('--work', type=Path, required=True)
    host.add_argument('--sha256', required=True)
    args = parser.parse_args()
    if args.mode == 'prepare':
        prepare(args.baseline, args.output, args.source)
    else:
        rehearse_host(args.work, args.sha256)
