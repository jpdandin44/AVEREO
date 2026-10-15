"""Prépare deux fichiers runtime CONNECT avec préconditions d'empreinte, sans accès distant."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
from zipfile import ZipFile, ZipInfo, ZIP_STORED

APP = Path(__file__).resolve().parents[1]
REPO = APP.parents[1]
CONNECT = 'architecture-v1/avereo-app-connect/backend/'
FILES = ['public/index.php', 'src/Config.php']


def git(*arguments):
    return subprocess.check_output(['git', *arguments], cwd=REPO)


def compatible_files(before_files, source_files, observed_files):
    """Add only the two launch settings to the exact observed historical runtime."""
    anchors = {
        'public/index.php': [
            (b"            'APP_LAUNCH_DRONE_URL', 'APP_LAUNCH_DRONE_SECRET',",
             b"\n            'APP_LAUNCH_PASSEPORT_IMMO_URL', 'APP_LAUNCH_PASSEPORT_IMMO_SECRET',"),
        ],
        'src/Config.php': [
            (b"                'drone' => self::env('APP_LAUNCH_DRONE_URL'),",
             b"\n                'passeport-immo' => self::env('APP_LAUNCH_PASSEPORT_IMMO_URL'),"),
            (b"                'drone' => self::env('APP_LAUNCH_DRONE_SECRET'),",
             b"\n                'passeport-immo' => self::env('APP_LAUNCH_PASSEPORT_IMMO_SECRET'),"),
        ],
    }
    result = {}
    for name in FILES:
        content = before_files[name]
        if hashlib.sha256(content).hexdigest() != observed_files.get(name, {}).get('sha256'):
            raise ValueError('Base différente du runtime observé : '+name)
        if b'APP_LAUNCH_PASSEPORT_IMMO_' in content:
            raise ValueError('Raccordement déjà présent : qualifier le nouveau runtime.')
        for anchor, addition in anchors[name]:
            if content.count(anchor) != 1 or addition.strip() not in source_files[name]:
                raise ValueError('Contexte non qualifié : '+name)
            content = content.replace(anchor, anchor+addition)
        result[name] = content
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--base-sha', required=True)
    parser.add_argument('--output', type=Path, default=APP/'.local/connect-preparation')
    parser.add_argument('--hosted-receipt', type=Path,
        help='Préparer seulement les paramètres de lancement sur la base hébergée exacte observée.')
    args = parser.parse_args()
    source = git('rev-parse', 'HEAD').decode().strip()
    base = git('rev-parse', args.base_sha+'^{commit}').decode().strip()
    if len(args.base_sha) != 40 or base != args.base_sha:
        raise ValueError('Fournir le SHA complet de la base relue.')
    if git('status', '--porcelain', '--', *[CONNECT+name for name in FILES]).strip():
        raise ValueError('Commiter les deux fichiers runtime avant emballage.')
    args.output.mkdir(parents=True, exist_ok=True)
    before_files = {name:git('show', base+':'+CONNECT+name) for name in FILES}
    contents = {name:git('show', source+':'+CONNECT+name) for name in FILES}
    receipt_sha = None
    if args.hosted_receipt:
        receipt_bytes = args.hosted_receipt.read_bytes()
        receipt = json.loads(receipt_bytes)
        contents = compatible_files(before_files, contents,
            receipt['applications']['connect']['codeFiles'])
        receipt_sha = hashlib.sha256(receipt_bytes).hexdigest()
    stem = 'runtime-connect-compatible' if args.hosted_receipt else 'runtime-connect'
    archive = args.output/(stem+'.zip')
    files = []
    with ZipFile(archive, 'w', compression=ZIP_STORED) as packed:
        for name in sorted(FILES):
            before = before_files[name]
            content = contents[name]
            entry = ZipInfo(name, (1980,1,1,0,0,0))
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            packed.writestr(entry, content)
            files.append({'path':name,'expectedBeforeSha256':hashlib.sha256(before).hexdigest(),
                'sha256':hashlib.sha256(content).hexdigest(),'size':len(content)})
    with ZipFile(archive) as packed:
        assert packed.testzip() is None and packed.namelist() == sorted(FILES)
        for item in files:
            assert hashlib.sha256(packed.read(item['path'])).hexdigest() == item['sha256']
    manifest = {'sourceSha':source,'baseSha':base,'artifactSha256':hashlib.sha256(archive.read_bytes()).hexdigest(),
        'files':files,'configurationIncluded':False,'databaseMigrationIncluded':False,
        'deploymentAllowed':False,'precondition':'Refuser si un fichier hébergé diffère de expectedBeforeSha256.'}
    if args.hosted_receipt:
        manifest.update(mode='historical_runtime_launch_settings_only',hostedReceiptSha256=receipt_sha,
            scope='Trois lignes ajoutées : allowlist URL/SECRET et deux correspondances de configuration ; aucun autre changement de runtime.')
    (args.output/(stem+'.manifest.json')).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps({k:v for k,v in manifest.items() if k!='files'},ensure_ascii=False))


if __name__ == '__main__':
    main()
